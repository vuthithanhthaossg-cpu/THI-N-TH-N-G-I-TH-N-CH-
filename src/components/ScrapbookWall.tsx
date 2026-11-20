import { PenLine, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CardStyle, ScrapbookPost } from '../types/scrapbook';
import { LoveLetterCard } from './cards/LoveLetterCard';
import { MemoryCard } from './cards/MemoryCard';
import { SecretMessageCard } from './cards/SecretMessageCard';
import { WishNoteCard } from './cards/WishNoteCard';
import { ChibiAngel } from './decorations/ChibiAngel';
import { PastelFlower } from './decorations/ScrapbookAccents';

interface ScrapbookWallProps {
  posts: ScrapbookPost[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  onSelectPost: (post: ScrapbookPost) => void;
  onToggleLike: (postId: string) => Promise<void>;
  onOpenForm: () => void;
  onOpenShare: () => void;
  onRetry: () => void;
}

type FilterKey = 'all' | CardStyle;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'memory', label: 'Ảnh kỷ niệm' },
  { key: 'wish', label: 'Giấy note' },
  { key: 'letter', label: 'Thư tay' },
  { key: 'secret', label: 'Thư bí mật' },
];

function useColumnCount(): number {
  const getCount = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 640) return 2;
    return 1;
  };

  const [cols, setCols] = useState<number>(getCount);

  useEffect(() => {
    const onResize = () => setCols(getCount());
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
  posts,
  loading,
  error,
  isOpen,
  onSelectPost,
  onToggleLike,
  onOpenForm,
  onOpenShare,
  onRetry,
}: ScrapbookWallProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const columnCount = useColumnCount();

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
      className="mx-auto max-w-7xl px-4 pt-4 pb-20 sm:px-6 lg:px-8"
    >
      {/* Section Header */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-[#B87983]/25 pb-6">
        <div>
          <h2
            id="wall-heading"
            className="angel-heading-soft text-2xl sm:text-3xl font-extrabold tracking-tight"
          >
            Góc này toàn điều dễ thương ♡
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#6E565B]">
            <span>Những lời nhắn và khoảnh khắc nhà mình gửi lại.</span>
            <span aria-hidden="true" className="text-[#B87983]">
              ·
            </span>
            <span className="font-bold text-[#49363A] tabular-nums">
              {posts.length} lời nhắn
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#B87983]/45 bg-[#FFF7F0] px-4 py-2 text-sm font-bold text-[#49363A] hover:bg-[#F3D5DD]/60 transition-colors whitespace-nowrap"
          >
            <Share2 className="h-4 w-4 text-[#9E5D68]" />
            Rủ thêm bạn bè
          </button>

          <button
            type="button"
            onClick={onOpenForm}
            disabled={!isOpen}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#49363A] bg-[#E8B6C2] px-4 py-2 text-sm font-extrabold text-[#49363A] shadow-[0_3px_0_#49363A] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#E1A6B5] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap"
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
          aria-label="Lọc theo kiểu thẻ lưu bút"
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
                className={`min-h-10 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A] ${
                  active
                    ? 'bg-[#49363A] text-[#FFF7F0]'
                    : 'bg-[#FFF7F0]/85 text-[#49363A]/80 border border-[#B87983]/25 hover:bg-[#FFF7F0] hover:text-[#49363A]'
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
              className="h-64 animate-pulse rounded-2xl border border-[#B87983]/20 bg-[#FFF7F0]/80 p-5"
            >
              <div className="h-4 w-24 rounded bg-[#F3D5DD]" />
              <div className="mt-4 space-y-2.5">
                <div className="h-3.5 w-full rounded bg-[#F3D5DD]/70" />
                <div className="h-3.5 w-5/6 rounded bg-[#F3D5DD]/70" />
                <div className="h-3.5 w-2/3 rounded bg-[#F3D5DD]/70" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mx-auto max-w-lg rounded-3xl border border-[#B87983]/35 bg-[#FFF7F0] p-8 text-center scrapbook-shadow">
          <p className="font-display text-xl font-bold text-[#49363A]">
            Chưa tải được bức tường lúc này
          </p>
          <p className="mt-2 text-sm text-[#6E565B]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#49363A] bg-[#E8B6C2] px-5 py-2.5 text-sm font-bold text-[#49363A] hover:bg-[#DFA3B2]"
          >
            Thử tải lại nha
          </button>
        </div>
      )}

      {/* SCREEN 5 — EMPTY WALL */}
      {!loading && !error && posts.length === 0 && (
        <div className="mx-auto max-w-xl rounded-3xl border border-[#B87983]/30 bg-[#FFF7F0] px-6 py-12 text-center scrapbook-shadow">
          <div className="relative mx-auto mb-4 flex w-fit items-center justify-center">
            <PastelFlower className="absolute -left-8 top-4 h-7 w-7 opacity-80" petalColor="#F3D5DD" />
            <ChibiAngel variant="waving" className="h-32 w-28" />
            <PastelFlower className="absolute -right-8 bottom-3 h-7 w-7 opacity-80" petalColor="#E6DDF1" />
          </div>

          <h3
            className="font-display text-2xl sm:text-3xl font-extrabold text-[#49363A]"
            style={{ textWrap: 'balance' }}
          >
            Góc nhỏ này vẫn đang chờ những chiếc thương đầu tiên!
          </h3>

          <p className="mt-2.5 text-base text-[#6E565B]">
            Nhà mình mở hàng bằng một lời nhắn nha?
          </p>

          <button
            type="button"
            onClick={onOpenForm}
            disabled={!isOpen}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#49363A] bg-[#E8B6C2] px-6 py-3 text-base font-extrabold text-[#49363A] shadow-[0_4px_0_#49363A] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#E1A6B5] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <PenLine className="h-4.5 w-4.5" />
            Gửi chiếc thương đầu tiên
          </button>
        </div>
      )}

      {/* Empty filtered category state */}
      {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
        <div className="mx-auto max-w-md rounded-2xl border border-[#B87983]/25 bg-[#FFF7F0] px-6 py-10 text-center">
          <p className="font-display text-lg font-bold text-[#49363A]">
            Chưa có lời nhắn nào thuộc kiểu thẻ này nha!
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#F3D5DD] px-4 py-2 text-sm font-bold text-[#49363A] hover:bg-[#E8B6C2]"
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
