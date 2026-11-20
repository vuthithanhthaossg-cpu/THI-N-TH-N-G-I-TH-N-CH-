import { MailOpen } from 'lucide-react';
import type { ScrapbookPost } from '../../types/scrapbook';
import { formatVietnameseDate } from '../../utils/visitor';
import { LikeButton } from '../LikeButton';
import { WaxHeartSeal } from '../decorations/ScrapbookAccents';

interface SecretMessageCardProps {
  post: ScrapbookPost;
  onSelect: (post: ScrapbookPost) => void;
  onToggleLike: (postId: string) => Promise<void>;
}

export function SecretMessageCard({ post, onSelect, onToggleLike }: SecretMessageCardProps) {
  const envelopeBg =
    post.paperTone === 'lavender'
      ? 'bg-[#F3EEFB] border-[#D0BFE6]/75'
      : post.paperTone === 'sky'
        ? 'bg-[#EDF6FA] border-[#B6D3E3]/75'
        : 'bg-[#FDEBF1] border-[#E7B7C6]/75';

  const flapStroke =
    post.paperTone === 'lavender'
      ? '#CBB9E3'
      : post.paperTone === 'sky'
        ? '#B0CFE0'
        : '#E4B1C1';

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
      aria-label="Mở phong thư bí mật từ Ai đó rất dễ thương"
      style={{ transform: `rotate(${post.tiltDeg * 0.7}deg)` }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border scrapbook-shadow scrapbook-shadow-hover hover:rotate-0 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A5164] ${envelopeBg}`}
    >
      {/* Folded envelope top flap SVG */}
      <div className="relative h-24 w-full overflow-hidden">
        <svg
          viewBox="0 0 320 100"
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          <polygon points="0,0 320,0 160,86" fill="#FFFFFF" fillOpacity="0.6" />
          <polyline
            points="0,0 160,86 320,0"
            fill="none"
            stroke={flapStroke}
            strokeWidth="2"
          />
        </svg>

        {/* Heart wax seal sitting right on flap point */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 transition-transform duration-150 group-hover:scale-108">
          <WaxHeartSeal className="h-12 w-12 drop-shadow-xs" />
        </div>
      </div>

      {/* Envelope body content */}
      <div className="px-5 pt-4 pb-4 text-center">
        <p className="font-hand text-xl text-[#543E43]">Phong thư bí mật ♡</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#664C52] line-clamp-3">
          “{post.message}”
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#A55568] group-hover:underline">
          <MailOpen className="h-3.5 w-3.5" />
          Chạm để mở thư đọc tiếp
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#D8A5B1]/30 pt-3 text-left">
          <div className="min-w-0 text-xs text-[#7A5E64]">
            <p className="truncate font-bold text-[#543E43]">{post.senderDisplay}</p>
            <p className="mt-0.5 tabular-nums">{formatVietnameseDate(post.createdAt)}</p>
          </div>
          <LikeButton
            liked={post.likedByMe}
            count={post.likeCount}
            onToggle={() => onToggleLike(post.postId)}
            compact
          />
        </div>
      </div>
    </article>
  );
}
