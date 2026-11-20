const VISITOR_STORAGE_KEY = 'namhoa_scrapbook_visitor_id';
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `v-${crypto.randomUUID()}`
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VISITOR_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `v-session-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function getVietnamDateParts(isoDate: string): {
  day: string;
  month: string;
  year: number;
  hours: string;
  minutes: string;
} | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // Vietnam (Asia/Ho_Chi_Minh) is fixed UTC+7 with no DST; computing via UTC
  // methods guarantees identical output across server and client timezones/locales.
  const vn = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  return {
    day: String(vn.getUTCDate()).padStart(2, '0'),
    month: String(vn.getUTCMonth() + 1).padStart(2, '0'),
    year: vn.getUTCFullYear(),
    hours: String(vn.getUTCHours()).padStart(2, '0'),
    minutes: String(vn.getUTCMinutes()).padStart(2, '0'),
  };
}

export function formatVietnameseDate(isoDate: string): string {
  const parts = getVietnamDateParts(isoDate);
  if (!parts) return '';
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatVietnameseDateTime(isoDate: string): string {
  const parts = getVietnamDateParts(isoDate);
  if (!parts) return '';
  return `${parts.hours}:${parts.minutes} · ${parts.day}/${parts.month}/${parts.year}`;
}

export function getPublicWallUrl(wallId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!wallId || wallId === 'nam-hoa') {
    return origin ? `${origin}/` : '/';
  }
  const path = `/wall/${encodeURIComponent(wallId)}`;
  return origin ? `${origin}${path}` : path;
}
