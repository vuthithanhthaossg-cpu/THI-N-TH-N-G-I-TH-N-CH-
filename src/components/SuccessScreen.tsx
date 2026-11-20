import { Share2 } from 'lucide-react';
import { useEffect } from 'react';
import { ChibiAngel } from './decorations/ChibiAngel';
import { PastelFlower, SparkleStar } from './decorations/ScrapbookAccents';

interface SuccessScreenProps {
  open: boolean;
  onViewWall: () => void;
  onShare: () => void;
}

export function SuccessScreen({ open, onViewWall, onShare }: SuccessScreenProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onViewWall();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onViewWall]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-screen-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#543E43]/35 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onViewWall();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E5BBC6]/70 bg-[#FFFCFA] px-6 py-8 sm:px-8 sm:py-10 text-center shadow-2xl">
        <PastelFlower
          className="pointer-events-none absolute top-4 left-5 h-8 w-8 opacity-85"
          petalColor="#F9D5DF"
        />
        <PastelFlower
          className="pointer-events-none absolute bottom-4 right-5 h-8 w-8 opacity-85"
          petalColor="#EFE8FA"
        />
        <SparkleStar className="pointer-events-none absolute top-7 right-10 h-4 w-4" />

        <div className="mx-auto mb-3 flex justify-center">
          <ChibiAngel variant="heart" className="h-32 w-28" />
        </div>

        <h2
          id="success-screen-title"
          className="angel-title-outline text-3xl sm:text-4xl font-extrabold"
        >
          TING TING! ♡
        </h2>

        <p className="mt-3 font-display text-xl font-extrabold text-[#543E43]">
          Một chiếc thương đã được gửi đi!
        </p>

        <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#7A5E64]">
          Cảm ơn bạn đã góp thêm một điều dễ thương vào góc nhỏ Nam Hòa.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onViewWall}
            className="w-full min-h-12 rounded-2xl border border-[#D493A3] bg-[#F5C7D4] px-5 py-3 text-base font-extrabold text-[#543E43] shadow-[0_4px_14px_-3px_rgba(201,126,144,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#EEB5C5]"
          >
            Về ngắm bức tường
          </button>

          <button
            type="button"
            onClick={onShare}
            className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E2BAC5] bg-[#FDF1F4] px-5 py-2.5 text-sm font-bold text-[#543E43] hover:bg-[#FCEBF0] transition-colors"
          >
            <Share2 className="h-4 w-4 text-[#B06376]" />
            Rủ thêm bạn bè
          </button>
        </div>
      </div>
    </div>
  );
}
