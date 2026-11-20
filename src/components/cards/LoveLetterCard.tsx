import type { ScrapbookPost } from '../../types/scrapbook';
import { formatVietnameseDate } from '../../utils/visitor';
import { LikeButton } from '../LikeButton';
import { PastelFlower, WashiTape } from '../decorations/ScrapbookAccents';

interface LoveLetterCardProps {
  post: ScrapbookPost;
  onSelect: (post: ScrapbookPost) => void;
  onToggleLike: (postId: string) => Promise<void>;
}

export function LoveLetterCard({ post, onSelect, onToggleLike }: LoveLetterCardProps) {
  const isLong = post.message.length > 260;

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
      aria-label={`Đọc lá thư từ ${post.senderDisplay}`}
      style={{ transform: `rotate(${post.tiltDeg * 0.45}deg)` }}
      className="group relative cursor-pointer rounded-2xl border border-[#E6C0CA]/65 bg-[#FFFCFA] p-5 pt-6 scrapbook-shadow scrapbook-shadow-hover hover:rotate-0 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A5164]"
    >
      {/* Top corner paper clip */}
      <div className="pointer-events-none absolute -top-3.5 right-6">
        <WashiTape styleType="clip" />
      </div>

      {/* Stationery header */}
      <div className="flex items-center justify-between border-b border-[#E6C0CA]/45 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <PastelFlower className="h-5 w-5 shrink-0" petalColor="#F3C5D2" />
          <span className="font-hand text-lg text-[#B06376]">Thư gửi nhà mình Nam Hòa</span>
        </div>
        <span className="text-xs font-semibold text-[#966F77] tabular-nums">
          {formatVietnameseDate(post.createdAt)}
        </span>
      </div>

      {/* Ruled paper body */}
      <div className="stationery-lined rounded-lg px-2 py-1.5">
        <p className="whitespace-pre-line text-[15px] leading-[30px] text-[#543E43] line-clamp-9">
          {post.message}
        </p>
      </div>

      {isLong && (
        <p className="mt-2 text-xs font-bold text-[#B06376] group-hover:underline">
          Mở đọc trọn vẹn lá thư →
        </p>
      )}

      {/* Signature & Like */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E6C0CA]/40 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[#966F77]">Thương mến,</p>
          <p className="truncate font-hand text-lg text-[#543E43]">{post.senderDisplay}</p>
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
