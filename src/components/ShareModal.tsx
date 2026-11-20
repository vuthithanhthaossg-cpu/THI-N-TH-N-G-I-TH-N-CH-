import { Check, Copy, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { getPublicWallUrl } from '../utils/visitor';

interface ShareModalProps {
  open: boolean;
  wallId: string;
  wallTitle: string;
  onClose: () => void;
  onCopiedToast: (msg: string) => void;
}

export function ShareModal({
  open,
  wallId,
  wallTitle,
  onClose,
  onCopiedToast,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareUrl = getPublicWallUrl(wallId);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    onCopiedToast('Đã sao chép đường dẫn rồi nha!');
    setTimeout(() => setCopied(false), 2400);
  }

  async function handleNativeShare() {
    if (!canNativeShare) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: wallTitle || 'THIÊN THẦN GỬI THÂN CHỦ',
        text: 'Nhà mình ơiii! Vào gửi một chiếc thương lên bức tường lưu bút Nam Hòa nha ♡',
        url: shareUrl,
      });
    } catch {
      // User cancelled native share sheet
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#543E43]/35 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E5BBC6]/70 bg-[#FFFCFA] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="share-modal-title"
              className="font-display text-2xl font-extrabold text-[#8F4A5B]"
            >
              Rủ thêm bạn bè
            </h2>
            <p className="mt-1 text-sm text-[#7A5E64]">
              Chia sẻ đường dẫn để mọi người cùng góp một chiếc thương nha!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng lại"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5BBC6]/60 bg-[#FDF1F4] text-[#543E43] hover:bg-[#FCEBF0]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Copyable Link Box */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#E5BBC6]/80 bg-[#FFFFFF] p-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Đường dẫn bức tường"
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2 text-xs sm:text-sm font-semibold text-[#543E43] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#F5C7D4] px-3.5 py-2 text-xs sm:text-sm font-extrabold text-[#543E43] hover:bg-[#EEB5C5] transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
        </div>

        {copied && (
          <p className="mt-2.5 text-center text-sm font-bold text-[#964E60]">
            Đã sao chép đường dẫn rồi nha!
          </p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D493A3] bg-[#F5C7D4] px-4 py-2.5 text-sm font-extrabold text-[#543E43] shadow-xs hover:bg-[#EEB5C5]"
            >
              <Share2 className="h-4 w-4" />
              Chia sẻ nhanh
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-11 rounded-xl border border-[#E2BAC5] bg-[#FDF1F4] px-4 py-2.5 text-sm font-bold text-[#543E43] hover:bg-[#FCEBF0]"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
