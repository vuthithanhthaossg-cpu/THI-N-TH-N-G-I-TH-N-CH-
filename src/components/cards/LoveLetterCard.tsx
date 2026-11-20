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
      className="group relative cursor-pointer rounded-2xl border border-[#B87983]/35 bg-[#FFF7F0] p-5 pt-6 scrapbook-shadow scrapbook-shadow-hover hover:rotate-0 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A]"
    >
      {/* Top corner paper clip */}
      <div className="pointer-events-none absolute -top-3.5 right-6">
        <WashiTape styleType="clip" />
      </div>

      {/* Stationery header */}
      <div className="flex items-center justify-between border-b border-[#B87983]/25 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <PastelFlower className="h-5 w-5 shrink-0" petalColor="#E8B6C2" />
          <span className="font-hand text-lg text-[#9E5D68]">Thư gửi nhà mình Nam Hòa</span>
        </div>
        <span className="text-xs font-semibold text-[#8B636B] tabular-nums">
          {formatVietnameseDate(post.createdAt)}
        </span>
      </div>

      {/* Ruled paper body */}
      <div className="stationery-lined rounded-lg px-2 py-1.5">
        <p className="whitespace-pre-line text-[15px] leading-[30px] text-[#49363A] line-clamp-9">
          {post.message}
        </p>
      </div>

      {isLong && (
        <p className="mt-2 text-xs font-bold text-[#9E5D68] group-hover:underline">
          Mở đọc trọn vẹn lá thư →
        </p>
      )}

      {/* Signature & Like */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#B87983]/20 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[#8B636B]">Thương mến,</p>
          <p className="truncate font-hand text-lg text-[#49363A]">{post.senderDisplay}</p>
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
