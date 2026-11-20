import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  CardStyle,
  DatabaseSchema,
  PaperTone,
  PostRecord,
  PublicPostDTO,
  TapeStyle,
  WallRecord,
} from './types.ts';
import {
  ALLOWED_IMAGE_MIMES,
  ANONYMOUS_DISPLAY_NAME,
  DEFAULT_WALL_ID,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_POST,
  MAX_MESSAGE_LENGTH,
  MAX_SENDER_NAME_LENGTH,
} from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'scrapbook-db.json');

const PAPER_TONES: PaperTone[] = ['cream', 'butter', 'blush', 'lavender', 'sky'];
const TAPE_STYLES: TapeStyle[] = ['striped', 'dots', 'grid', 'clip'];
const TILT_STEPS = [-1.4, -0.7, 0.5, 1.2, -1.0, 0.8];

function ensureStorageDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function determineCardStyle(
  message: string,
  imageCount: number,
  isAnonymous: boolean,
): CardStyle {
  if (imageCount > 0) {
    return 'memory';
  }
  if (isAnonymous) {
    return 'secret';
  }
  const lineBreaks = (message.match(/\n/g) || []).length;
  if (message.length >= 165 || lineBreaks >= 3) {
    return 'letter';
  }
  return 'wish';
}

function createSeedDatabase(): DatabaseSchema {
  const now = Date.now();
  const wall: WallRecord = {
    wallId: DEFAULT_WALL_ID,
    title: 'THIÊN THẦN GỬI THÂN CHỦ',
    description:
      'Một lời chúc, một chiếc ảnh, một chút quan tâm. Cứ gửi hết vào đây, để tụi mình cùng làm nên một góc Nam Hòa thật đáng yêu nha!',
    isOpen: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
  };

  const posts: PostRecord[] = [
    {
      postId: 'post-namhoa-01',
      wallId: DEFAULT_WALL_ID,
      senderName: 'Minh Thư K48',
      isAnonymous: false,
      message:
        'Chúc cả nhà Nam Hòa mùa này luôn rực rỡ, thi cử qua môn vèo vèo, deadline không dí mà niềm vui cứ tự tìm tới nha!',
      imageUrls: [],
      cardStyle: 'wish',
      paperTone: 'butter',
      tapeStyle: 'dots',
      tiltDeg: -1.1,
      createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
      likesByVisitor: { 'seed-1': '1', 'seed-2': '1', 'seed-3': '1', 'seed-4': '1', 'seed-5': '1' },
      likeCount: 5,
      isHidden: false,
    },
    {
      postId: 'post-namhoa-02',
      wallId: DEFAULT_WALL_ID,
      senderName: 'Đội Truyền Thông Nam Hòa',
      isAnonymous: false,
      message: 'Chiếc quà bé xíu thiên thần gửi sớm cho thân chủ nè, nhớ uống sữa giữ sức khỏe nha!',
      imageUrls: ['/memories/nam-hoa-qua-nho.svg'],
      cardStyle: 'memory',
      paperTone: 'cream',
      tapeStyle: 'striped',
      tiltDeg: 0.9,
      createdAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
      likesByVisitor: {
        'seed-1': '1',
        'seed-2': '1',
        'seed-3': '1',
        'seed-4': '1',
        'seed-5': '1',
        'seed-6': '1',
        'seed-7': '1',
        'seed-8': '1',
      },
      likeCount: 8,
      isHidden: false,
    },
    {
      postId: 'post-namhoa-03',
      wallId: DEFAULT_WALL_ID,
      senderName: '',
      isAnonymous: true,
      message:
        'Gửi thân chủ đáng yêu của mình ơi! Dạo này thấy cậu chạy hoạt động hơi mệt rồi đó, nhớ ngủ sớm trước 12 giờ nha. Sáng mai cứ mở ngăn bàn hoặc hộp thư ra, thiên thần nhỏ chuẩn bị sẵn một bất ngờ xinh xắn cho cậu rồi nè. Cố lên nha, có người luôn âm thầm cổ vũ cậu đó!',
      imageUrls: [],
      cardStyle: 'secret',
      paperTone: 'blush',
      tapeStyle: 'dots',
      tiltDeg: -0.6,
      createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
      likesByVisitor: {
        'seed-1': '1',
        'seed-2': '1',
        'seed-3': '1',
        'seed-4': '1',
        'seed-5': '1',
        'seed-6': '1',
      },
      likeCount: 6,
      isHidden: false,
    },
    {
      postId: 'post-namhoa-04',
      wallId: DEFAULT_WALL_ID,
      senderName: 'Khánh Linh',
      isAnonymous: false,
      message:
        'Cảm ơn nhà mình Nam Hòa vì đã luôn là một nơi thật ấm áp mỗi lần tụi mình quay về sau những tuần học căng thẳng.\n\nCó những buổi tối ngồi gấp từng tờ giấy note, gói từng túi bánh nhỏ xíu cho hoạt động Thiên Thần — Thân Chủ mà cười đau cả bụng. Dù sau này mỗi đứa có đi làm hay bận rộn ở đâu, mong tụi mình vẫn nhớ mãi những chiều nắng rộn ràng như thế này cùng nhau nha.\n\nThương cả nhà mình nhiều lắm luôn!',
      imageUrls: [],
      cardStyle: 'letter',
      paperTone: 'cream',
      tapeStyle: 'clip',
      tiltDeg: 0.4,
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      likesByVisitor: {
        'seed-1': '1',
        'seed-2': '1',
        'seed-3': '1',
        'seed-4': '1',
        'seed-5': '1',
        'seed-6': '1',
        'seed-7': '1',
        'seed-8': '1',
        'seed-9': '1',
        'seed-10': '1',
        'seed-11': '1',
      },
      likeCount: 11,
      isHidden: false,
    },
    {
      postId: 'post-namhoa-05',
      wallId: DEFAULT_WALL_ID,
      senderName: 'Hoàng Nam',
      isAnonymous: false,
      message: 'Buổi chiều picnic ở sân trường — nắng đẹp, trà sữa ngon và toàn người dễ thương!',
      imageUrls: ['/memories/nam-hoa-chieu-nang.svg'],
      cardStyle: 'memory',
      paperTone: 'cream',
      tapeStyle: 'grid',
      tiltDeg: -0.9,
      createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      likesByVisitor: { 'seed-1': '1', 'seed-2': '1', 'seed-3': '1', 'seed-4': '1' },
      likeCount: 4,
      isHidden: false,
    },
    {
      postId: 'post-namhoa-06',
      wallId: DEFAULT_WALL_ID,
      senderName: 'Gia Hân',
      isAnonymous: false,
      message: 'Ai là thiên thần của mình tuần này vậy ta? Dễ thương dữ vậy? Hôm nay nhận được hộp sữa với tờ giấy note mà vui nguyên ngày luôn á!',
      imageUrls: [],
      cardStyle: 'wish',
      paperTone: 'lavender',
      tapeStyle: 'clip',
      tiltDeg: 0.8,
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
      likesByVisitor: { 'seed-1': '1', 'seed-2': '1', 'seed-3': '1' },
      likeCount: 3,
      isHidden: false,
    },
  ];

  return {
    walls: { [DEFAULT_WALL_ID]: wall },
    posts,
  };
}

class ScrapbookStore {
  private db: DatabaseSchema;
  private listeners = new Map<string, Set<(event: { type: string; payload?: unknown }) => void>>();
  private rateBuckets = new Map<string, number[]>();

  constructor() {
    ensureStorageDirs();
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed && parsed.walls && Array.isArray(parsed.posts)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to read scrapbook-db.json, initializing fresh store:', err);
    }
    const seed = createSeedDatabase();
    this.save(seed);
    return seed;
  }

  private save(nextDb?: DatabaseSchema) {
    const target = nextDb ?? this.db;
    ensureStorageDirs();
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(target, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = this.rateBuckets.get(key) || [];
    const recent = existing.filter((ts) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
      this.rateBuckets.set(key, recent);
      return false;
    }
    recent.push(now);
    this.rateBuckets.set(key, recent);
    return true;
  }

  subscribe(wallId: string, cb: (event: { type: string; payload?: unknown }) => void) {
    if (!this.listeners.has(wallId)) {
      this.listeners.set(wallId, new Set());
    }
    this.listeners.get(wallId)!.add(cb);
    return () => {
      this.listeners.get(wallId)?.delete(cb);
    };
  }

  private broadcast(wallId: string, type: string, payload?: unknown) {
    const subs = this.listeners.get(wallId);
    if (!subs) return;
    for (const cb of subs) {
      try {
        cb({ type, payload });
      } catch {
        // Ignore broken SSE client
      }
    }
  }

  listWalls(): WallRecord[] {
    return Object.values(this.db.walls).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getWall(wallId: string): WallRecord | null {
    return this.db.walls[wallId] ?? null;
  }

  createWall(input: { wallId: string; title: string; description: string }): WallRecord {
    const slug = input.wallId
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);

    if (!slug || slug.length < 2) {
      throw new Error('Mã đường dẫn bức tường không hợp lệ.');
    }
    if (this.db.walls[slug]) {
      throw new Error('Mã đường dẫn bức tường này đã tồn tại rồi nha.');
    }
    const title = input.title.trim().slice(0, 100);
    if (!title) {
      throw new Error('Vui lòng nhập tên cho bức tường mới.');
    }
    const wall: WallRecord = {
      wallId: slug,
      title,
      description:
        input.description.trim().slice(0, 400) ||
        'Một góc lưu bút xinh xắn dành riêng cho nhà mình Nam Hòa.',
      isOpen: true,
      createdAt: new Date().toISOString(),
    };
    this.db.walls[slug] = wall;
    this.save();
    return wall;
  }

  setWallOpen(wallId: string, isOpen: boolean): WallRecord | null {
    const wall = this.db.walls[wallId];
    if (!wall) return null;
    wall.isOpen = isOpen;
    this.save();
    this.broadcast(wallId, 'wall-updated', wall);
    return wall;
  }

  toPublicDTO(post: PostRecord, visitorId: string, includeModeration = false): PublicPostDTO {
    const dto: PublicPostDTO = {
      postId: post.postId,
      wallId: post.wallId,
      // Strict anonymity protection: never leak senderName when isAnonymous is true
      senderDisplay: post.isAnonymous
        ? ANONYMOUS_DISPLAY_NAME
        : post.senderName.trim() || ANONYMOUS_DISPLAY_NAME,
      isAnonymous: post.isAnonymous,
      message: post.message,
      imageUrls: post.imageUrls,
      cardStyle: post.cardStyle,
      paperTone: post.paperTone,
      tapeStyle: post.tapeStyle,
      tiltDeg: post.tiltDeg,
      createdAt: post.createdAt,
      likeCount: post.likeCount,
      likedByMe: Boolean(visitorId && post.likesByVisitor[visitorId]),
    };
    if (includeModeration) {
      dto.isHidden = post.isHidden;
    }
    return dto;
  }

  getPublicPosts(wallId: string, visitorId: string): PublicPostDTO[] {
    return this.db.posts
      .filter((p) => p.wallId === wallId && !p.isHidden)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => this.toPublicDTO(p, visitorId, false));
  }

  getAdminPosts(wallId: string, visitorId = ''): PublicPostDTO[] {
    return this.db.posts
      .filter((p) => p.wallId === wallId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => this.toPublicDTO(p, visitorId, true));
  }

  getAdminStats(wallId: string) {
    const wallPosts = this.db.posts.filter((p) => p.wallId === wallId);
    const visibleCount = wallPosts.filter((p) => !p.isHidden).length;
    const hiddenCount = wallPosts.filter((p) => p.isHidden).length;
    const totalLikes = wallPosts.reduce((sum, p) => sum + p.likeCount, 0);
    return {
      totalPosts: wallPosts.length,
      visibleCount,
      hiddenCount,
      totalLikes,
    };
  }

  saveBase64Image(dataUrl: string): string {
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      throw new Error('Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WebP hoặc GIF.');
    }
    const mime = match[1];
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new Error('Định dạng ảnh không hợp lệ.');
    }
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
      throw new Error('Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB mỗi ảnh).');
    }
    const ext =
      mime === 'image/jpeg'
        ? 'jpg'
        : mime === 'image/png'
          ? 'png'
          : mime === 'image/webp'
            ? 'webp'
            : 'gif';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    ensureStorageDirs();
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    return `/api/uploads/${filename}`;
  }

  createPost(input: {
    wallId: string;
    senderName?: string;
    isAnonymous: boolean;
    message?: string;
    images?: string[];
    visitorId: string;
  }): PublicPostDTO {
    const wall = this.db.walls[input.wallId];
    if (!wall) {
      throw new Error('Không tìm thấy bức tường lưu bút này.');
    }
    if (!wall.isOpen) {
      throw new Error('Bức tường hiện đã tạm đóng nhận lời nhắn.');
    }

    const cleanMessage = (input.message || '').trim();
    const rawImages = Array.isArray(input.images) ? input.images : [];

    if (!cleanMessage && rawImages.length === 0) {
      throw new Error('Bạn gửi ít nhất một chiếc ảnh hoặc vài dòng nhắn gửi nha!');
    }
    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Lời nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự nha!`);
    }
    if (rawImages.length > MAX_IMAGES_PER_POST) {
      throw new Error(`Bạn chỉ có thể chọn tối đa ${MAX_IMAGES_PER_POST} chiếc ảnh cho mỗi lần gửi nha!`);
    }

    const savedUrls: string[] = [];
    for (const img of rawImages) {
      savedUrls.push(this.saveBase64Image(img));
    }

    const isAnonymous = Boolean(input.isAnonymous);
    // Strip real sender name completely when anonymous
    const sanitizedName = isAnonymous
      ? ''
      : (input.senderName || '').trim().slice(0, MAX_SENDER_NAME_LENGTH);

    const postId = `post-${crypto.randomBytes(6).toString('hex')}`;
    const seed = hashSeed(postId);
    const cardStyle = determineCardStyle(cleanMessage, savedUrls.length, isAnonymous);

    const newPost: PostRecord = {
      postId,
      wallId: wall.wallId,
      senderName: sanitizedName,
      isAnonymous: isAnonymous || !sanitizedName,
      message: cleanMessage,
      imageUrls: savedUrls,
      cardStyle,
      paperTone: PAPER_TONES[seed % PAPER_TONES.length],
      tapeStyle: TAPE_STYLES[(seed >>> 3) % TAPE_STYLES.length],
      tiltDeg: TILT_STEPS[(seed >>> 6) % TILT_STEPS.length],
      createdAt: new Date().toISOString(),
      likesByVisitor: {},
      likeCount: 0,
      isHidden: false,
    };

    this.db.posts.unshift(newPost);
    this.save();

    const publicDto = this.toPublicDTO(newPost, input.visitorId, false);
    this.broadcast(wall.wallId, 'post-created', publicDto);
    return publicDto;
  }

  toggleLike(wallId: string, postId: string, visitorId: string): PublicPostDTO | null {
    if (!visitorId || visitorId.length < 4 || visitorId.length > 120) {
      throw new Error('Không xác định được phiên truy cập.');
    }
    const post = this.db.posts.find((p) => p.wallId === wallId && p.postId === postId && !p.isHidden);
    if (!post) return null;

    if (post.likesByVisitor[visitorId]) {
      delete post.likesByVisitor[visitorId];
    } else {
      post.likesByVisitor[visitorId] = new Date().toISOString();
    }
    post.likeCount = Object.keys(post.likesByVisitor).length;
    this.save();

    const dto = this.toPublicDTO(post, visitorId, false);
    this.broadcast(wallId, 'post-liked', { postId: post.postId, likeCount: post.likeCount });
    return dto;
  }

  setPostHidden(postId: string, isHidden: boolean): PostRecord | null {
    const post = this.db.posts.find((p) => p.postId === postId);
    if (!post) return null;
    post.isHidden = isHidden;
    this.save();
    this.broadcast(post.wallId, 'wall-refresh', { postId });
    return post;
  }

  deletePost(postId: string): PostRecord | null {
    const idx = this.db.posts.findIndex((p) => p.postId === postId);
    if (idx === -1) return null;
    const [removed] = this.db.posts.splice(idx, 1);

    // Clean up local uploaded images belonging only to this post
    for (const url of removed.imageUrls) {
      if (url.startsWith('/api/uploads/')) {
        const filename = path.basename(url);
        const fullPath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch {
            // Ignore cleanup failure
          }
        }
      }
    }

    this.save();
    this.broadcast(removed.wallId, 'post-deleted', { postId: removed.postId });
    return removed;
  }

  getUploadPath(filename: string): string | null {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return null;
    }
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (!fullPath.startsWith(UPLOADS_DIR) || !fs.existsSync(fullPath)) {
      return null;
    }
    return fullPath;
  }
}

export const scrapbookStore = new ScrapbookStore();
