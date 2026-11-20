import { ArrowLeft, PenLine, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CardStyle, ScrapbookPost } from '../types/scrapbook';
import { LoveLetterCard } from './cards/LoveLetterCard';
import { MemoryCard } from './cards/MemoryCard';
import { SecretMessageCard } from './cards/SecretMessageCard';
import { WishNoteCard } from './cards/WishNoteCard';
import { ChibiAngel } from './decorations/ChibiAngel';
import { PastelFlower } from './decorations/ScrapbookAccents';

interface ScrapbookWallProps {
  wallId: string;
  posts: ScrapbookPost[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  isWallPage?: boolean;
  wallTitle?: string;
  wallDescription?: string;
  onSelectPost: (post: ScrapbookPost) => void;
  onToggleLike: (postId: string) => Promise<void>;
  onOpenForm: () => void;
  onOpenShare: () => void;
  onRetry: () => void;
  onNavigateHome?: () => void;
}

type FilterKey = 'all' | CardStyle;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'memory', label: 'Ảnh kỷ niệm' },
  { key: 'wish', label: 'Giấy note' },
  { key: 'letter', label: 'Thư tay' },
  { key: 'secret', label: 'Thư bí mật' },
];

function getColumnCountForWidth(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function useColumnCount(): number {
  // Use a deterministic initial value so the first render never depends on window.innerWidth
  const [cols, setCols] = useState<number>(3);

  useEffect(() => {
    const onResize = () => setCols(getColumnCountForWidth(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return cols;
}

function estimateCardWeight(post: ScrapbookPost): number {
  if (post.cardStyle === 'memory') return 380 + Math.min(120, post.message.length * 0.4);
  if (post.cardStyle === 'letter') return 320 + Math.min(180, post.message.length * 0.5);
  if (post.cardStyle === 'secret') return 250;
  return 185 + Math.min(130, post.message.length * 0.55);
}

export function ScrapbookWall({
  wallId,
  posts,
  loading,
  error,
  isOpen,
  isWallPage = false,
  wallTitle,
  wallDescription,
  onSelectPost,
  onToggleLike,
  onOpenForm,
  onOpenShare,
  onRetry,
  onNavigateHome,
}: ScrapbookWallProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const columnCount = useColumnCount();

  // Reset card style filter whenever switching to another wall so posts are never hidden by stale state
  useEffect(() => {
    setActiveFilter('all');
  }, [wallId]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter((p) => p.cardStyle === activeFilter);
  }, [posts, activeFilter]);

  // Balanced masonry distribution preserving top-to-bottom newest-first visual rhythm
  const columns = useMemo(() => {
    const buckets: ScrapbookPost[][] = Array.from({ length: columnCount }, () => []);
    const heights = new Array<number>(columnCount).fill(0);

    for (const post of filteredPosts) {
      let shortestIndex = 0;
      for (let i = 1; i < columnCount; i += 1) {
        if (heights[i] < heights[shortestIndex]) {
          shortestIndex = i;
        }
      }
      buckets[shortestIndex].push(post);
      heights[shortestIndex] += estimateCardWeight(post);
    }

    return buckets;
  }, [filteredPosts, columnCount]);

  function renderCard(post: ScrapbookPost) {
    switch (post.cardStyle) {
      case 'memory':
        return (
          <MemoryCard
            key={post.postId}
            post={post}
            onSelect={onSelectPost}
            onToggleLike={onToggleLike}
          />
        );
      case 'letter':
        return (
          <LoveLetterCard
            key={post.postId}
            post={post}
            onSelect={onSelectPost}
            onToggleLike={onToggleLike}
          />
        );
      case 'secret':
        return (
          <SecretMessageCard
            key={post.postId}
            post={post}
            onSelect={onSelectPost}
            onToggleLike={onToggleLike}
          />
        );
      case 'wish':
      default:
        return (
          <WishNoteCard
            key={post.postId}
            post={post}
            onSelect={onSelectPost}
            onToggleLike={onToggleLike}
          />
        );
    }
  }

  return (
    <section
      id="scrapbook-wall"
      aria-labelledby="wall-heading"
      className={`mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 ${
        isWallPage ? 'pt-6 sm:pt-9' : 'pt-4'
      }`}
    >
      {/* Dedicated wall-page top navigation bar */}
      {isWallPage && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E5BBC6]/70 bg-[#FFFCFA] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#543E43] hover:bg-[#FCEBF0] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#B06376]" />
              Quay về trang chủ
            </button>
          )}
          <span className="font-hand text-base sm:text-lg text-[#B06376]">
            {wallTitle || 'THIÊN THẦN GỬI THÂN CHỦ'} · Lưu xá Nam Hòa
          </span>
        </div>
      )}

      {/* Section Header */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-[#E2B5C1]/45 pb-6">
        <div>
          {isWallPage ? (
            <h1
              id="wall-heading"
              className="angel-heading-soft text-2xl sm:text-4xl font-extrabold tracking-tight"
            >
              Góc này toàn điều dễ thương ♡
            </h1>
          ) : (
            <h2
              id="wall-heading"
              className="angel-heading-soft text-2xl sm:text-3xl font-extrabold tracking-tight"
            >
              Góc này toàn điều dễ thương ♡
            </h2>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#7A5E64]">
            <span>
              {isWallPage && wallDescription
                ? wallDescription
                : 'Những lời nhắn và khoảnh khắc nhà mình gửi lại.'}
            </span>
            <span aria-hidden="true" className="text-[#D497A6]">
              ·
            </span>
            <span className="font-bold text-[#543E43] tabular-nums">
              {posts.length} lời nhắn
            </span>
          </div>
          {isWallPage && !isOpen && (
            <p className="mt-3 inline-block rounded-xl border border-[#E2B2BF]/60 bg-[#FFFCFA] px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#964E60]">
              Bức tường hiện đã tạm đóng nhận lời nhắn. Bạn vẫn có thể ngắm và thả tim các kỷ niệm bên dưới nha!
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E2BAC5] bg-[#FFFFFF] px-4 py-2 text-sm font-bold text-[#543E43] hover:bg-[#FCEBF0] transition-colors whitespace-nowrap"
          >
            <Share2 className="h-4 w-4 text-[#B06376]" />
            Rủ thêm bạn bè
          </button>

          <button
            type="button"
            onClick={onOpenForm}
            disabled={!isOpen}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D493A3] bg-[#F5C7D4] px-4 py-2 text-sm font-extrabold text-[#543E43] shadow-[0_4px_12px_-3px_rgba(201,126,144,0.4)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#EEB5C5] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap"
          >
            <PenLine className="h-4 w-4" />
            Gửi thêm một chiếc thương
          </button>
        </div>
      </div>

      {/* Interactive Filter Segmented Bar (only when posts exist) */}
      {posts.length > 0 && (
        <div
          role="tablist"
          aria-label="Lọc theo kiểu thẻ"
          className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveFilter(opt.key)}
                className={`min-h-10 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A5164] ${
                  active
                    ? 'bg-[#9A5164] text-[#FFFFFF] shadow-xs'
                    : 'bg-[#FFFFFF]/90 text-[#664C52] border border-[#E6C0CA]/60 hover:bg-[#FFFFFF] hover:text-[#543E43]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-[#E6C0CA]/40 bg-[#FFFCFA]/90 p-5"
            >
              <div className="h-4 w-24 rounded bg-[#FCEBF0]" />
              <div className="mt-4 space-y-2.5">
                <div className="h-3.5 w-full rounded bg-[#FCEBF0]/80" />
                <div className="h-3.5 w-5/6 rounded bg-[#FCEBF0]/80" />
                <div className="h-3.5 w-2/3 rounded bg-[#FCEBF0]/80" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mx-auto max-w-lg rounded-3xl border border-[#E5BBC6]/60 bg-[#FFFCFA] p-8 text-center scrapbook-shadow">
          <p className="font-display text-xl font-bold text-[#543E43]">
            Chưa tải được bức tường lúc này
          </p>
          <p className="mt-2 text-sm text-[#7A5E64]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D493A3] bg-[#F5C7D4] px-5 py-2.5 text-sm font-bold text-[#543E43] hover:bg-[#EEB5C5]"
          >
            Thử tải lại nha
          </button>
        </div>
      )}

      {/* SCREEN 5 — EMPTY WALL */}
      {!loading && !error && posts.length === 0 && (
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E5BBC6]/55 bg-[#FFFCFA] px-6 py-12 text-center scrapbook-shadow">
          <div className="relative mx-auto mb-4 flex w-fit items-center justify-center">
            <PastelFlower className="absolute -left-8 top-4 h-7 w-7 opacity-85" petalColor="#F9D5DF" />
            <ChibiAngel variant="waving" className="h-32 w-28" />
            <PastelFlower className="absolute -right-8 bottom-3 h-7 w-7 opacity-85" petalColor="#EFE8FA" />
          </div>

          <h3
            className="font-display text-2xl sm:text-3xl font-extrabold text-[#543E43]"
            style={{ textWrap: 'balance' }}
          >
            Góc nhỏ này vẫn đang chờ những chiếc thương đầu tiên!
          </h3>

          <p className="mt-2.5 text-base text-[#7A5E64]">
            Nhà mình mở hàng bằng một lời nhắn nha?
          </p>

          <button
            type="button"
            onClick={onOpenForm}
            disabled={!isOpen}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#D493A3] bg-[#F5C7D4] px-6 py-3 text-base font-extrabold text-[#543E43] shadow-[0_4px_14px_-3px_rgba(201,126,144,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#EEB5C5] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <PenLine className="h-4.5 w-4.5" />
            Gửi chiếc thương đầu tiên
          </button>
        </div>
      )}

      {/* Empty filtered category state */}
      {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
        <div className="mx-auto max-w-md rounded-2xl border border-[#E6C0CA]/50 bg-[#FFFCFA] px-6 py-10 text-center">
          <p className="font-display text-lg font-bold text-[#543E43]">
            Chưa có lời nhắn nào thuộc kiểu thẻ này nha!
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#FCEBF0] px-4 py-2 text-sm font-bold text-[#543E43] hover:bg-[#F5C7D4]"
          >
            Xem lại tất cả lời nhắn
          </button>
        </div>
      )}

      {/* Responsive Masonry Columns */}
      {!loading && !error && filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start pt-2">
          {columns.map((colPosts, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-7 min-w-0">
              {colPosts.map((post) => renderCard(post))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
