import { Images } from 'lucide-react';
import { useState } from 'react';
import type { ScrapbookPost } from '../../types/scrapbook';
import { formatVietnameseDate } from '../../utils/visitor';
import { LikeButton } from '../LikeButton';
import { PastelFlower, WashiTape } from '../decorations/ScrapbookAccents';

interface MemoryCardProps {
  post: ScrapbookPost;
  onSelect: (post: ScrapbookPost) => void;
  onToggleLike: (postId: string) => Promise<void>;
}

export function MemoryCard({ post, onSelect, onToggleLike }: MemoryCardProps) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = post.imageUrls[0];
  const extraCount = Math.max(0, post.imageUrls.length - 1);

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
      aria-label={`Xem khoảnh khắc của ${post.senderDisplay}`}
      style={{ transform: `rotate(${post.tiltDeg * 0.85}deg)` }}
      className="group relative cursor-pointer rounded-sm border border-[#49363A]/15 bg-[#FFFFFF] p-3 pb-4 scrapbook-shadow scrapbook-shadow-hover hover:rotate-0 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A]"
    >
      {/* Top striped washi tape */}
      <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <WashiTape
          styleType={post.tapeStyle === 'clip' ? 'striped' : post.tapeStyle}
          tone="rose"
          className="rotate-1"
        />
      </div>

      {/* Polaroid photo frame preserving natural aspect ratio */}
      <div className="relative overflow-hidden bg-[#F8E4E8]/60 border border-[#49363A]/10">
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={post.message ? post.message.slice(0, 80) : `Khoảnh khắc từ ${post.senderDisplay}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="block w-full h-auto max-h-[420px] object-contain bg-[#FFF7F0] transition-transform duration-300 group-hover:scale-[1.015]"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F8E4E8] to-[#FFF7F0] p-6 text-center text-[#8B636B]">
            <PastelFlower className="h-9 w-9" petalColor="#E8B6C2" />
            <span className="text-xs font-semibold">Khoảnh khắc kỷ niệm Nam Hòa</span>
          </div>
        )}

        {extraCount > 0 && (
          <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-lg bg-[#49363A]/85 px-2.5 py-1 text-xs font-bold text-[#FFF7F0] backdrop-blur-xs">
            <Images className="h-3.5 w-3.5" />+{extraCount} ảnh
          </span>
        )}
      </div>

      {/* Polaroid caption area */}
      <div className="relative mt-3.5 px-1">
        {post.message ? (
          <p className="font-hand text-lg leading-snug text-[#49363A] line-clamp-4">
            {post.message}
          </p>
        ) : (
          <p className="font-hand text-base text-[#9E5D68]">Một chiếc ảnh xinh gửi nhà mình ♡</p>
        )}

        <PastelFlower
          className="pointer-events-none absolute -top-2 right-0 h-5 w-5 opacity-70"
          petalColor="#F3D5DD"
        />
      </div>

      {/* Sender & Like bar */}
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#49363A]/10 px-1 pt-3">
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
