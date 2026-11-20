import { Heart, Share2 } from 'lucide-react';

interface HeaderProps {
  onOpenForm: () => void;
  onScrollToWall: () => void;
  onOpenShare: () => void;
  onNavigateHome: () => void;
  isOpenForSubmissions: boolean;
}

export function Header({
  onOpenForm,
  onScrollToWall,
  onOpenShare,
  onNavigateHome,
  isOpenForSubmissions,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#D8A5B1]/25 bg-[#FDF1F4]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="group flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C98A98] rounded-lg shrink-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E5BAC5]/60 shadow-xs text-[#C98A98] transition-transform duration-150 group-hover:scale-105 shrink-0">
            <Heart className="h-4.5 w-4.5 fill-[#F5C7D4] text-[#9A5164]" strokeWidth={2.2} />
          </span>
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#543E43] whitespace-nowrap">
            THIÊN THẦN GỬI THÂN CHỦ
          </span>
        </button>

        {/* Zone 2: Greeting & clean single-line navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#664C52]"
        >
          <span className="font-hand text-lg text-[#B06376] whitespace-nowrap shrink-0">
            Nhà mình ơiii!
          </span>
          <span aria-hidden="true" className="text-[#D8A5B1]">
            ·
          </span>
          <button
            type="button"
            onClick={onScrollToWall}
            className="whitespace-nowrap shrink-0 hover:text-[#9A5164] underline-offset-4 hover:underline transition-colors"
          >
            Bức tường
          </button>
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:text-[#9A5164] underline-offset-4 hover:underline transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Rủ thêm bạn bè
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenShare}
            aria-label="Rủ thêm bạn bè"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DFB0BC]/55 bg-[#FFFFFF] text-[#543E43] hover:bg-[#FCEBF0] transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenForm}
            disabled={!isOpenForSubmissions}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D497A6]/60 bg-[#F5C7D4] px-3.5 py-2 sm:px-4 text-xs sm:text-sm font-bold text-[#543E43] shadow-xs transition-all duration-150 hover:bg-[#EEB5C5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A5164]"
          >
            Gửi một chiếc thương ♡
          </button>
        </div>
      </div>
    </header>
  );
}
