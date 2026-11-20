import { isSupabaseConfigured, requireSupabase, STORAGE_BUCKET } from '../lib/supabase';
import {
  ANONYMOUS_LABEL,
  MAX_IMAGES_PER_POST,
  MAX_MESSAGE_LENGTH,
  MAX_SENDER_NAME_LENGTH,
  type AdminStats,
  type CardStyle,
  type PaperTone,
  type ScrapbookPost,
  type TapeStyle,
  type Wall,
} from '../types/scrapbook';
import type { PreparedImage } from '../utils/imageCompression';
import { getOrCreateVisitorId } from '../utils/visitor';

// --- Raw Supabase row shapes ---

interface WallRow {
  wall_id: string;
  title: string;
  description: string;
  is_open: boolean;
  created_at: string;
}

interface PostRow {
  post_id: string;
  wall_id: string;
  sender_name: string;
  is_anonymous: boolean;
  message: string;
  image_urls: string[] | null;
  card_style: CardStyle;
  paper_tone: PaperTone;
  tape_style: TapeStyle;
  tilt_deg: number;
  like_count: number;
  is_hidden: boolean;
  created_at: string;
}

const PAPER_TONES: PaperTone[] = ['cream', 'butter', 'blush', 'lavender', 'sky'];
const TAPE_STYLES: TapeStyle[] = ['striped', 'dots', 'grid', 'clip'];
const TILT_STEPS = [-1.4, -0.7, 0.5, 1.2, -1.0, 0.8];

function mapWallRow(row: WallRow): Wall {
  return {
    wallId: row.wall_id,
    title: row.title,
    description: row.description,
    isOpen: row.is_open,
    createdAt: row.created_at,
  };
}

function mapPostRow(row: PostRow, likedSet?: Set<string>, includeModeration = false): ScrapbookPost {
  const isAnon = Boolean(row.is_anonymous) || !row.sender_name?.trim();
  const post: ScrapbookPost = {
    postId: row.post_id,
    wallId: row.wall_id,
    senderDisplay: isAnon ? ANONYMOUS_LABEL : row.sender_name.trim(),
    isAnonymous: isAnon,
    message: row.message || '',
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    cardStyle: row.card_style,
    paperTone: row.paper_tone,
    tapeStyle: row.tape_style,
    tiltDeg: Number(row.tilt_deg || 0),
    createdAt: row.created_at,
    likeCount: Number(row.like_count || 0),
    likedByMe: likedSet ? likedSet.has(row.post_id) : false,
  };
  if (includeModeration) {
    post.isHidden = row.is_hidden;
  }
  return post;
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function determineCardStyle(message: string, imageCount: number, isAnonymous: boolean): CardStyle {
  if (imageCount > 0) return 'memory';
  if (isAnonymous) return 'secret';
  const lineBreaks = (message.match(/\n/g) || []).length;
  if (message.length >= 165 || lineBreaks >= 3) return 'letter';
  return 'wish';
}

function extFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

function randomHex(len = 10): string {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}

function extractStoragePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + marker.length).split('?')[0];
  return rawPath ? decodeURIComponent(rawPath) : null;
}

function mapSupabaseError(error: { message?: string; code?: string } | null, fallback: string): Error {
  if (!error) return new Error(fallback);
  const msg = error.message || '';
  if (msg.includes('row-level security') || error.code === '42501') {
    return new Error('Bức tường hiện đã tạm đóng hoặc bạn không có quyền thực hiện thao tác này.');
  }
  if (msg.includes('Invalid login credentials')) {
    return new Error('Email hoặc mật khẩu quản trị chưa đúng rồi nha.');
  }
  return new Error(msg || fallback);
}

// --- Public Wall APIs ---

export async function fetchWallAndPosts(
  wallId: string,
): Promise<{ wall: Wall; posts: ScrapbookPost[] }> {
  const client = requireSupabase();
  const visitorId = getOrCreateVisitorId();

  const [wallRes, postsRes, likesRes] = await Promise.all([
    client.from('walls').select('*').eq('wall_id', wallId).maybeSingle(),
    client
      .from('posts')
      .select('*')
      .eq('wall_id', wallId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false }),
    client.rpc('get_visitor_liked_posts', {
      p_wall_id: wallId,
      p_visitor_id: visitorId,
    }),
  ]);

  if (wallRes.error) {
    throw mapSupabaseError(wallRes.error, 'Không thể tải thông tin bức tường lúc này.');
  }
  if (!wallRes.data) {
    throw new Error('Không tìm thấy bức tường này.');
  }
  if (postsRes.error) {
    throw mapSupabaseError(postsRes.error, 'Không thể tải danh sách lời nhắn lúc này.');
  }

  const likedIds = new Set<string>(
    Array.isArray(likesRes.data)
      ? (likesRes.data as { post_id: string }[]).map((row) => row.post_id)
      : [],
  );

  return {
    wall: mapWallRow(wallRes.data as WallRow),
    posts: (postsRes.data as PostRow[]).map((row) => mapPostRow(row, likedIds, false)),
  };
}

export async function createPostWithProgress(
  wallId: string,
  payload: {
    senderName: string;
    isAnonymous: boolean;
    message: string;
    images: PreparedImage[];
  },
  onProgress: (percent: number) => void,
): Promise<{ post: ScrapbookPost }> {
  const client = requireSupabase();

  const cleanMessage = payload.message.trim();
  const images = payload.images || [];

  if (!cleanMessage && images.length === 0) {
    throw new Error('Bạn gửi ít nhất một chiếc ảnh hoặc vài dòng nhắn gửi nha!');
  }
  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Lời nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự nha!`);
  }
  if (images.length > MAX_IMAGES_PER_POST) {
    throw new Error(`Bạn chỉ có thể chọn tối đa ${MAX_IMAGES_PER_POST} chiếc ảnh cho mỗi lần gửi nha!`);
  }

  // Verify wall is open before uploading any photos
  onProgress(8);
  const { data: wallRow, error: wallErr } = await client
    .from('walls')
    .select('wall_id, is_open')
    .eq('wall_id', wallId)
    .maybeSingle();

  if (wallErr || !wallRow) {
    throw new Error('Không tìm thấy bức tường này.');
  }
  if (!wallRow.is_open) {
    throw new Error('Bức tường hiện đã tạm đóng nhận lời nhắn.');
  }

  // Upload compressed images directly to Supabase Storage
  const uploadedUrls: string[] = [];
  if (images.length > 0) {
    for (let i = 0; i < images.length; i += 1) {
      const img = images[i];
      const ext = extFromMime(img.mimeType);
      const objectPath = `${wallId}/${Date.now()}-${randomHex(10)}.${ext}`;

      const { error: uploadErr } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, img.blob, {
          contentType: img.mimeType,
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadErr) {
        throw mapSupabaseError(
          uploadErr,
          'Không thể tải ảnh lên lúc này. Bạn kiểm tra dung lượng/định dạng rồi thử lại nha!',
        );
      }

      const { data: pubData } = client.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
      uploadedUrls.push(pubData.publicUrl);

      const uploadPct = 15 + Math.round(((i + 1) / images.length) * 65);
      onProgress(uploadPct);
    }
  } else {
    onProgress(55);
  }

  // Strict anonymity protection: never send or store real name when anonymous
  const rawName = payload.isAnonymous
    ? ''
    : payload.senderName.trim().slice(0, MAX_SENDER_NAME_LENGTH);
  const effectiveAnonymous = Boolean(payload.isAnonymous) || !rawName;

  const seed = hashSeed(`${Date.now()}-${randomHex(8)}-${cleanMessage.slice(0, 24)}`);
  const cardStyle = determineCardStyle(cleanMessage, uploadedUrls.length, effectiveAnonymous);
  const paperTone = PAPER_TONES[seed % PAPER_TONES.length];
  const tapeStyle = TAPE_STYLES[(seed >>> 3) % TAPE_STYLES.length];
  const tiltDeg = TILT_STEPS[(seed >>> 6) % TILT_STEPS.length];

  const { data: inserted, error: insertErr } = await client
    .from('posts')
    .insert({
      wall_id: wallId,
      sender_name: effectiveAnonymous ? '' : rawName,
      is_anonymous: effectiveAnonymous,
      message: cleanMessage,
      image_urls: uploadedUrls,
      card_style: cardStyle,
      paper_tone: paperTone,
      tape_style: tapeStyle,
      tilt_deg: tiltDeg,
      like_count: 0,
      is_hidden: false,
    })
    .select('*')
    .single();

  if (insertErr || !inserted) {
    throw mapSupabaseError(insertErr, 'Không thể gửi chiếc thương lúc này, bạn thử lại nha!');
  }

  onProgress(100);
  return {
    post: mapPostRow(inserted as PostRow, new Set(), false),
  };
}

export async function togglePostLike(
  _wallId: string,
  postId: string,
): Promise<{ postId: string; likeCount: number; likedByMe: boolean }> {
  const client = requireSupabase();
  const visitorId = getOrCreateVisitorId();

  const { data, error } = await client.rpc('toggle_post_like', {
    p_post_id: postId,
    p_visitor_id: visitorId,
  });

  if (error) {
    throw mapSupabaseError(error, 'Chưa thả tim được lúc này, bạn thử lại nha!');
  }

  const row = Array.isArray(data)
    ? (data[0] as { post_id: string; like_count: number; liked_by_me: boolean } | undefined)
    : (data as { post_id: string; like_count: number; liked_by_me: boolean } | null);

  if (!row) {
    throw new Error('Không nhận được phản hồi lượt thả tim.');
  }

  return {
    postId: row.post_id,
    likeCount: Number(row.like_count),
    likedByMe: Boolean(row.liked_by_me),
  };
}

// --- Supabase Realtime subscription ---

export type WallRealtimeEvent =
  | { type: 'post-created'; payload: ScrapbookPost }
  | { type: 'post-updated'; payload: { post: ScrapbookPost; isHidden: boolean } }
  | { type: 'post-deleted'; payload: { postId: string } }
  | { type: 'wall-updated'; payload: Wall };

export function subscribeWallEvents(
  wallId: string,
  onEvent: (event: WallRealtimeEvent) => void,
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }
  const client = requireSupabase();

  const channel = client
    .channel(`scrapbook-wall-${wallId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `wall_id=eq.${wallId}`,
      },
      (payload) => {
        const row = payload.new as PostRow;
        if (row && !row.is_hidden) {
          onEvent({ type: 'post-created', payload: mapPostRow(row) });
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
        filter: `wall_id=eq.${wallId}`,
      },
      (payload) => {
        const row = payload.new as PostRow;
        if (row) {
          onEvent({
            type: 'post-updated',
            payload: { post: mapPostRow(row), isHidden: Boolean(row.is_hidden) },
          });
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'posts',
        filter: `wall_id=eq.${wallId}`,
      },
      (payload) => {
        const oldRow = payload.old as { post_id?: string };
        if (oldRow?.post_id) {
          onEvent({ type: 'post-deleted', payload: { postId: oldRow.post_id } });
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'walls',
        filter: `wall_id=eq.${wallId}`,
      },
      (payload) => {
        const row = payload.new as WallRow;
        if (row) {
          onEvent({ type: 'wall-updated', payload: mapWallRow(row) });
        }
      },
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

// --- Admin Auth (Supabase Auth Email + Password + admin_users RBAC) ---

async function verifyIsAuthorizedAdmin(userId: string): Promise<boolean> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.user_id);
}

export async function adminSignIn(
  email: string,
  password: string,
): Promise<{ email: string }> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    throw mapSupabaseError(error, 'Email hoặc mật khẩu quản trị chưa đúng rồi nha.');
  }

  const authorized = await verifyIsAuthorizedAdmin(data.user.id);
  if (!authorized) {
    await client.auth.signOut();
    throw new Error('Tài khoản này chưa được cấp quyền quản trị bức tường.');
  }

  return { email: data.user.email || email.trim() };
}

export async function adminCheckSession(): Promise<{
  authenticated: boolean;
  email: string | null;
}> {
  if (!isSupabaseConfigured) {
    return { authenticated: false, email: null };
  }
  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) {
    return { authenticated: false, email: null };
  }

  const authorized = await verifyIsAuthorizedAdmin(session.user.id);
  if (!authorized) {
    await client.auth.signOut();
    return { authenticated: false, email: null };
  }

  return { authenticated: true, email: session.user.email || null };
}

export async function adminSignOut(): Promise<void> {
  const client = requireSupabase();
  await client.auth.signOut();
}

// --- Admin Moderation APIs (Protected by Supabase RLS + public.is_admin()) ---

export async function adminListWalls(): Promise<{ walls: Wall[] }> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('walls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw mapSupabaseError(error, 'Không thể tải danh sách bức tường.');
  }
  return { walls: (data as WallRow[]).map(mapWallRow) };
}

export async function adminCreateWall(input: {
  wallId: string;
  title: string;
  description: string;
}): Promise<{ wall: Wall }> {
  const client = requireSupabase();
  const slug = input.wallId
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  if (!slug || slug.length < 2) {
    throw new Error('Mã đường dẫn bức tường không hợp lệ (tối thiểu 2 ký tự chữ thường/số).');
  }

  const title = input.title.trim().slice(0, 100);
  if (!title) {
    throw new Error('Vui lòng nhập tên cho bức tường mới.');
  }

  const description =
    input.description.trim().slice(0, 400) ||
    'Một góc nhỏ dành riêng cho nhà mình Nam Hòa.';

  const { data, error } = await client
    .from('walls')
    .insert({
      wall_id: slug,
      title,
      description,
      is_open: true,
    })
    .select('*')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new Error('Mã đường dẫn bức tường này đã tồn tại rồi nha.');
    }
    throw mapSupabaseError(error, 'Không thể tạo bức tường mới.');
  }

  return { wall: mapWallRow(data as WallRow) };
}

export async function adminFetchWallData(
  wallId: string,
): Promise<{ wall: Wall; posts: ScrapbookPost[]; stats: AdminStats }> {
  const client = requireSupabase();

  const [wallRes, postsRes] = await Promise.all([
    client.from('walls').select('*').eq('wall_id', wallId).maybeSingle(),
    client
      .from('posts')
      .select('*')
      .eq('wall_id', wallId)
      .order('created_at', { ascending: false }),
  ]);

  if (wallRes.error || !wallRes.data) {
    throw mapSupabaseError(wallRes.error, 'Không tìm thấy bức tường.');
  }
  if (postsRes.error) {
    throw mapSupabaseError(postsRes.error, 'Không thể tải danh sách lời nhắn.');
  }

  const mappedPosts = (postsRes.data as PostRow[]).map((row) => mapPostRow(row, undefined, true));
  const visibleCount = mappedPosts.filter((p) => !p.isHidden).length;
  const hiddenCount = mappedPosts.filter((p) => p.isHidden).length;
  const totalLikes = mappedPosts.reduce((sum, p) => sum + p.likeCount, 0);

  return {
    wall: mapWallRow(wallRes.data as WallRow),
    posts: mappedPosts,
    stats: {
      totalPosts: mappedPosts.length,
      visibleCount,
      hiddenCount,
      totalLikes,
    },
  };
}

export async function adminSetWallOpen(
  wallId: string,
  isOpen: boolean,
): Promise<{ wall: Wall }> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('walls')
    .update({ is_open: isOpen })
    .eq('wall_id', wallId)
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseError(error, 'Không thể cập nhật trạng thái nhận lời nhắn.');
  }
  return { wall: mapWallRow(data as WallRow) };
}

export async function adminSetPostHidden(
  postId: string,
  isHidden: boolean,
): Promise<{ post: ScrapbookPost }> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('posts')
    .update({ is_hidden: isHidden })
    .eq('post_id', postId)
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseError(error, 'Không thể cập nhật trạng thái bài đăng.');
  }
  return { post: mapPostRow(data as PostRow, undefined, true) };
}

export async function adminDeletePost(post: ScrapbookPost): Promise<void> {
  const client = requireSupabase();

  // Delete database record first (protected by admin RLS policy)
  const { error } = await client.from('posts').delete().eq('post_id', post.postId);
  if (error) {
    throw mapSupabaseError(error, 'Không thể xóa lời nhắn này.');
  }

  // Clean up associated photos from Supabase Storage bucket (best-effort)
  const storagePaths = post.imageUrls
    .map(extractStoragePathFromPublicUrl)
    .filter((p): p is string => Boolean(p));

  if (storagePaths.length > 0) {
    await client.storage.from(STORAGE_BUCKET).remove(storagePaths);
  }
}
