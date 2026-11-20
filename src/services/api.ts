import type { AdminStats, ScrapbookPost, Wall } from '../types/scrapbook';
import { getOrCreateVisitorId } from '../utils/visitor';

function visitorHeaders(): Record<string, string> {
  return {
    'X-Visitor-Id': getOrCreateVisitorId(),
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      typeof data?.error === 'string' ? data.error : 'Có chút trục trặc nhỏ, bạn thử lại nha!';
    throw new Error(errMsg);
  }
  return data as T;
}

export async function fetchWallAndPosts(wallId: string): Promise<{ wall: Wall; posts: ScrapbookPost[] }> {
  const res = await fetch(`/api/walls/${encodeURIComponent(wallId)}`, {
    headers: visitorHeaders(),
  });
  return parseResponse(res);
}

export function createPostWithProgress(
  wallId: string,
  payload: {
    senderName: string;
    isAnonymous: boolean;
    message: string;
    images: string[];
  },
  onProgress: (percent: number) => void,
): Promise<{ post: ScrapbookPost }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/walls/${encodeURIComponent(wallId)}/posts`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Visitor-Id', getOrCreateVisitorId());

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(95, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(parsed as { post: ScrapbookPost });
        } else {
          reject(new Error(parsed?.error || 'Không thể gửi chiếc thương lúc này.'));
        }
      } catch {
        reject(new Error('Phản hồi từ máy chủ không hợp lệ.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Kết nối bị gián đoạn. Bạn kiểm tra mạng rồi thử lại nha!'));
    };

    xhr.send(JSON.stringify(payload));
  });
}

export async function togglePostLike(
  wallId: string,
  postId: string,
): Promise<{ post: ScrapbookPost }> {
  const res = await fetch(
    `/api/walls/${encodeURIComponent(wallId)}/posts/${encodeURIComponent(postId)}/like`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...visitorHeaders(),
      },
      body: JSON.stringify({ visitorId: getOrCreateVisitorId() }),
    },
  );
  return parseResponse(res);
}

export function subscribeWallEvents(
  wallId: string,
  onEvent: (event: { type: string; payload?: unknown }) => void,
): () => void {
  const source = new EventSource(`/api/walls/${encodeURIComponent(wallId)}/events`);
  source.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data);
      onEvent(parsed);
    } catch {
      // Ignore malformed heartbeat
    }
  };
  return () => {
    source.close();
  };
}

// --- Admin APIs ---

export async function adminLogin(password: string): Promise<{ token: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return parseResponse(res);
}

export async function adminCheckSession(token: string): Promise<{ authenticated: boolean }> {
  const res = await fetch('/api/admin/session', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function adminLogout(token: string): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminListWalls(token: string): Promise<{ walls: Wall[] }> {
  const res = await fetch('/api/admin/walls', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function adminCreateWall(
  token: string,
  input: { wallId: string; title: string; description: string },
): Promise<{ wall: Wall }> {
  const res = await fetch('/api/admin/walls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return parseResponse(res);
}

export async function adminFetchWallData(
  token: string,
  wallId: string,
): Promise<{ wall: Wall; posts: ScrapbookPost[]; stats: AdminStats }> {
  const res = await fetch(`/api/admin/walls/${encodeURIComponent(wallId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function adminSetWallOpen(
  token: string,
  wallId: string,
  isOpen: boolean,
): Promise<{ wall: Wall }> {
  const res = await fetch(`/api/admin/walls/${encodeURIComponent(wallId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isOpen }),
  });
  return parseResponse(res);
}

export async function adminSetPostHidden(
  token: string,
  postId: string,
  isHidden: boolean,
): Promise<{ post: ScrapbookPost }> {
  const res = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isHidden }),
  });
  return parseResponse(res);
}

export async function adminDeletePost(token: string, postId: string): Promise<void> {
  const res = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseResponse(res);
}
