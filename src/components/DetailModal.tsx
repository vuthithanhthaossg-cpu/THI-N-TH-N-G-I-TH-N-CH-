import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ScrapbookPost } from '../types/scrapbook';
import { formatVietnameseDateTime } from '../utils/visitor';
import { LikeButton } from './LikeButton';
import { PastelFlower, WaxHeartSeal } from './decorations/ScrapbookAccents';

interface DetailModalProps {
  post: ScrapbookPost | null;
  onClose: () => void;
  onToggleLike?: (postId: string) => Promise<void>;
  readOnlyLike?: boolean;
}

export function DetailModal({
  post,
  onClose,
  onToggleLike,
  readOnlyLike = false,
}: DetailModalProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [post?.postId]);

  useEffect(() => {
    if (!post) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (post.imageUrls.length > 1) {
        if (e.key === 'ArrowRight') {
          setPhotoIndex((i) => (i + 1) % post.imageUrls.length);
        } else if (e.key === 'ArrowLeft') {
          setPhotoIndex((i) => (i - 1 + post.imageUrls.length) % post.imageUrls.length);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [post, onClose]);

  if (!post) return null;

  const hasPhotos = post.imageUrls.length > 0;
  const activePhoto = hasPhotos ? post.imageUrls[photoIndex] || post.imageUrls[0] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#49363A]/55 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-[#49363A]/20 bg-[#FFF7F0] shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#B87983]/25 bg-[#F8E4E8]/80 px-5 py-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {post.cardStyle === 'secret' ? (
              <WaxHeartSeal className="h-8 w-8 shrink-0" />
            ) : (
              <PastelFlower className="h-6 w-6 shrink-0" petalColor="#E8B6C2" />
            )}
            <h2
              id="detail-modal-title"
              className="font-display text-xl sm:text-2xl font-extrabold text-[#49363A] truncate"
            >
              Một chiếc thương được gửi lại ♡
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng lại"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#B87983]/30 bg-[#FFF7F0] text-[#49363A] hover:bg-[#F3D5DD] transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Full photo showcase preserving aspect ratio */}
          {activePhoto && (
            <div className="relative rounded-2xl border border-[#B87983]/25 bg-[#FFFFFF] p-2.5 sm:p-3 shadow-xs">
              <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-[#F8E4E8]/45">
                <img
                  src={activePhoto}
                  alt={`Ảnh kỷ niệm từ ${post.senderDisplay}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[58vh] w-auto max-w-full object-contain"
                />

                {post.imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex(
                          (i) => (i - 1 + post.imageUrls.length) % post.imageUrls.length,
                        )
                      }
                      aria-label="Ảnh trước"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#49363A]/80 text-[#FFF7F0] hover:bg-[#49363A]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex((i) => (i + 1) % post.imageUrls.length)}
                      aria-label="Ảnh tiếp theo"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#49363A]/80 text-[#FFF7F0] hover:bg-[#49363A]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {post.imageUrls.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto pb-1">
                  {post.imageUrls.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoIndex(idx)}
                      className={`overflow-hidden rounded-lg border-2 transition-all ${
                        idx === photoIndex
                          ? 'border-[#49363A] scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Ảnh thu nhỏ ${idx + 1}`}
                        className="h-12 w-12 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Message */}
          {post.message && (
            <div
              className={`rounded-2xl border border-[#B87983]/25 p-5 ${
                post.cardStyle === 'letter' ? 'stationery-lined' : 'bg-[#FFFFFF]'
              }`}
            >
              {post.cardStyle === 'secret' && (
                <p className="font-hand text-xl text-[#9E5D68] mb-2">
                  Thư bí mật gửi tới nhà mình ♡
                </p>
              )}
              <p className="whitespace-pre-line text-base leading-[30px] text-[#49363A]">
                {post.message}
              </p>
            </div>
          )}

          {/* Metadata & Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#B87983]/20 pt-4">
            <div className="text-sm text-[#6E565B]">
              <p className="font-extrabold text-[#49363A] text-base">{post.senderDisplay}</p>
              <p className="mt-0.5 text-xs tabular-nums">
                {formatVietnameseDateTime(post.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {!readOnlyLike && onToggleLike && (
                <LikeButton
                  liked={post.likedByMe}
                  count={post.likeCount}
                  onToggle={() => onToggleLike(post.postId)}
                />
              )}

              <button
                type="button"
                onClick={onClose}
                className="min-h-10 rounded-xl border border-[#B87983]/45 bg-[#F8E4E8] px-4 py-2 text-sm font-bold text-[#49363A] hover:bg-[#F3D5DD] transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
