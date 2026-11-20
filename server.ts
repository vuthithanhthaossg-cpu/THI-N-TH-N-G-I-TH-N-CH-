import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { scrapbookStore } from './server/store.ts';
import { DEFAULT_WALL_ID } from './server/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'namhoa2026';

// In-memory active admin sessions (token -> created timestamp)
const adminSessions = new Map<string, number>();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function extractAdminToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function isValidAdminSession(token: string | null): boolean {
  if (!token) return false;
  const created = adminSessions.get(token);
  if (!created) return false;
  if (Date.now() - created > SESSION_TTL_MS) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractAdminToken(req);
  if (!isValidAdminSession(token)) {
    res.status(401).json({ error: 'Vui lòng đăng nhập quyền quản trị để tiếp tục.' });
    return;
  }
  next();
}

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
  const visitor = typeof req.headers['x-visitor-id'] === 'string' ? req.headers['x-visitor-id'] : '';
  return `${ip}:${visitor}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '24mb' }));

  // Serve uploaded scrapbook photos safely
  app.get('/api/uploads/:filename', (req, res) => {
    const filePath = scrapbookStore.getUploadPath(req.params.filename);
    if (!filePath) {
      res.status(404).json({ error: 'Không tìm thấy ảnh.' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  });

  // Public: get wall metadata & published posts
  app.get('/api/walls/:wallId', (req, res) => {
    const wallId = req.params.wallId || DEFAULT_WALL_ID;
    const wall = scrapbookStore.getWall(wallId);
    if (!wall) {
      res.status(404).json({ error: 'Không tìm thấy bức tường lưu bút này.' });
      return;
    }
    const visitorId = typeof req.headers['x-visitor-id'] === 'string' ? req.headers['x-visitor-id'] : '';
    const posts = scrapbookStore.getPublicPosts(wallId, visitorId);
    res.json({ wall, posts });
  });

  // Public: real-time updates via Server-Sent Events
  app.get('/api/walls/:wallId/events', (req, res) => {
    const wallId = req.params.wallId || DEFAULT_WALL_ID;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    const unsubscribe = scrapbookStore.subscribe(wallId, (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  // Public: create a new scrapbook contribution (no account required)
  app.post('/api/walls/:wallId/posts', (req, res) => {
    const rateKey = `post:${getClientKey(req)}`;
    if (!scrapbookStore.checkRateLimit(rateKey, 8, 60_000)) {
      res.status(429).json({
        error: 'Bạn gửi hơi nhanh rồi đó, đợi một chút rồi gửi tiếp nha!',
      });
      return;
    }

    try {
      const wallId = req.params.wallId || DEFAULT_WALL_ID;
      const visitorId =
        typeof req.headers['x-visitor-id'] === 'string' ? req.headers['x-visitor-id'] : '';
      const { senderName, isAnonymous, message, images } = req.body ?? {};
      const post = scrapbookStore.createPost({
        wallId,
        senderName: typeof senderName === 'string' ? senderName : '',
        isAnonymous: Boolean(isAnonymous),
        message: typeof message === 'string' ? message : '',
        images: Array.isArray(images) ? images : [],
        visitorId,
      });
      res.status(201).json({ post });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi chiếc thương lúc này.';
      const status = message.includes('tạm đóng') ? 403 : 400;
      res.status(status).json({ error: message });
    }
  });

  // Public: toggle like (deduplicated per visitorId)
  app.post('/api/walls/:wallId/posts/:postId/like', (req, res) => {
    const rateKey = `like:${getClientKey(req)}`;
    if (!scrapbookStore.checkRateLimit(rateKey, 40, 60_000)) {
      res.status(429).json({ error: 'Bạn thả tim nhanh quá, nghỉ tay xíu nha!' });
      return;
    }

    try {
      const wallId = req.params.wallId || DEFAULT_WALL_ID;
      const postId = req.params.postId;
      const visitorId =
        typeof req.headers['x-visitor-id'] === 'string'
          ? req.headers['x-visitor-id']
          : typeof req.body?.visitorId === 'string'
            ? req.body.visitorId
            : '';
      const post = scrapbookStore.toggleLike(wallId, postId, visitorId);
      if (!post) {
        res.status(404).json({ error: 'Không tìm thấy lời nhắn này.' });
        return;
      }
      res.json({ post });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thả tim lúc này.';
      res.status(400).json({ error: message });
    }
  });

  // Admin authentication
  app.post('/api/admin/login', (req, res) => {
    const rateKey = `admin-login:${getClientKey(req)}`;
    if (!scrapbookStore.checkRateLimit(rateKey, 10, 60_000)) {
      res.status(429).json({ error: 'Thử đăng nhập quá nhiều lần, vui lòng đợi 1 phút.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const expected = Buffer.from(ADMIN_PASSWORD);
    const provided = Buffer.from(password);
    const matched =
      expected.length === provided.length && crypto.timingSafeEqual(expected, provided);

    if (!matched) {
      res.status(401).json({ error: 'Mật khẩu quản trị chưa đúng rồi nha.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, Date.now());
    res.json({ token });
  });

  app.get('/api/admin/session', (req, res) => {
    const token = extractAdminToken(req);
    res.json({ authenticated: isValidAdminSession(token) });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = extractAdminToken(req);
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ ok: true });
  });

  // Admin: list walls & create new wall
  app.get('/api/admin/walls', requireAdmin, (_req, res) => {
    res.json({ walls: scrapbookStore.listWalls() });
  });

  app.post('/api/admin/walls', requireAdmin, (req, res) => {
    try {
      const { wallId, title, description } = req.body ?? {};
      const wall = scrapbookStore.createWall({
        wallId: String(wallId || ''),
        title: String(title || ''),
        description: String(description || ''),
      });
      res.status(201).json({ wall });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Không thể tạo bức tường mới.',
      });
    }
  });

  // Admin: fetch wall overview + ALL posts (including hidden)
  app.get('/api/admin/walls/:wallId', requireAdmin, (req, res) => {
    const wallId = req.params.wallId || DEFAULT_WALL_ID;
    const wall = scrapbookStore.getWall(wallId);
    if (!wall) {
      res.status(404).json({ error: 'Không tìm thấy bức tường.' });
      return;
    }
    const posts = scrapbookStore.getAdminPosts(wallId);
    const stats = scrapbookStore.getAdminStats(wallId);
    res.json({ wall, posts, stats });
  });

  // Admin: open / close submissions
  app.patch('/api/admin/walls/:wallId', requireAdmin, (req, res) => {
    const wallId = req.params.wallId || DEFAULT_WALL_ID;
    if (typeof req.body?.isOpen !== 'boolean') {
      res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
      return;
    }
    const wall = scrapbookStore.setWallOpen(wallId, req.body.isOpen);
    if (!wall) {
      res.status(404).json({ error: 'Không tìm thấy bức tường.' });
      return;
    }
    res.json({ wall });
  });

  // Admin: hide or restore post
  app.patch('/api/admin/posts/:postId', requireAdmin, (req, res) => {
    if (typeof req.body?.isHidden !== 'boolean') {
      res.status(400).json({ error: 'Trạng thái ẩn/hiện không hợp lệ.' });
      return;
    }
    const updated = scrapbookStore.setPostHidden(req.params.postId, req.body.isHidden);
    if (!updated) {
      res.status(404).json({ error: 'Không tìm thấy lời nhắn.' });
      return;
    }
    res.json({ post: scrapbookStore.toPublicDTO(updated, '', true) });
  });

  // Admin: permanently delete post
  app.delete('/api/admin/posts/:postId', requireAdmin, (req, res) => {
    const removed = scrapbookStore.deletePost(req.params.postId);
    if (!removed) {
      res.status(404).json({ error: 'Không tìm thấy lời nhắn.' });
      return;
    }
    res.json({ deleted: true, postId: removed.postId });
  });

  // Serve Vite dev middleware in development or built static assets in production
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist/index.html'));
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THIÊN THẦN GỬI THÂN CHỦ server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
