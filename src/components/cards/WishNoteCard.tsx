import type { PaperTone, ScrapbookPost } from '../../types/scrapbook';
import { formatVietnameseDate } from '../../utils/visitor';
import { LikeButton } from '../LikeButton';
import { WashiTape } from '../decorations/ScrapbookAccents';

interface WishNoteCardProps {
  post: ScrapbookPost;
  onSelect: (post: ScrapbookPost) => void;
  onToggleLike: (postId: string) => Promise<void>;
}

const NOTE_SURFACE: Record<PaperTone, string> = {
  cream: 'bg-[#FFF7F0] border-[#49363A]/20',
  butter: 'bg-[#FFF9DC] border-[#C9B375]/45',
  blush: 'bg-[#FCE8EE] border-[#D69FAE]/45',
  lavender: 'bg-[#EEE7F6] border-[#B6A4CE]/45',
  sky: 'bg-[#E6F1F6] border-[#9BBCCB]/45',
};

const TAPE_TONE: Record<PaperTone, 'rose' | 'lavender' | 'sky' | 'butter'> = {
  cream: 'rose',
  butter: 'rose',
  blush: 'butter',
  lavender: 'rose',
  sky: 'lavender',
};

export function WishNoteCard({ post, onSelect, onToggleLike }: WishNoteCardProps) {
  return (
    <article
      onClick={() => onSelect(post)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(post);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Xem lời chúc của ${post.senderDisplay}`}
      style={{ transform: `rotate(${post.tiltDeg * 0.75}deg)` }}
      className={`group relative cursor-pointer rounded-2xl border-2 px-5 pt-7 pb-4 scrapbook-shadow scrapbook-shadow-hover hover:rotate-0 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A] ${NOTE_SURFACE[post.paperTone]}`}
    >
      {/* Top decorative washi tape or paper clip */}
      <div className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2">
        <WashiTape
          styleType={post.tapeStyle}
          tone={TAPE_TONE[post.paperTone]}
          className={post.tapeStyle === 'clip' ? '-mt-1' : '-rotate-2'}
        />
      </div>

      {/* Handwritten tiny note accent */}
      <p className="font-hand text-base text-[#9E5D68] mb-1.5">Lời nhắn nhỏ ♡</p>

      {/* Main wish text */}
      <p className="whitespace-pre-line text-[15px] leading-relaxed font-medium text-[#49363A] line-clamp-7">
        {post.message}
      </p>

      {/* Footer metadata & like */}
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#49363A]/10 pt-3">
        <div className="min-w-0 text-xs text-[#6E565B]">
          <p className="truncate font-bold text-[#49363A]">{post.senderDisplay}</p>
          <p className="mt-0.5 tabular-nums">{formatVietnameseDate(post.createdAt)}</p>
        </div>
        <LikeButton
          liked={post.likedByMe}
          count={post.likeCount}
          onToggle={() => onToggleLike(post.postId)}
          compact
        />
      </div>
    </article>
  );
}
