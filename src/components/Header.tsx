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
    <header className="sticky top-0 z-30 border-b border-[#B87983]/20 bg-[#F8E4E8]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="group flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B87983] rounded-lg shrink-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF7F0] border border-[#B87983]/30 shadow-xs text-[#B87983] transition-transform duration-150 group-hover:scale-105 shrink-0">
            <Heart className="h-4.5 w-4.5 fill-[#E8B6C2] text-[#49363A]" strokeWidth={2.2} />
          </span>
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#49363A] whitespace-nowrap">
            THIÊN THẦN GỬI THÂN CHỦ
          </span>
        </button>

        {/* Zone 2: Greeting & clean single-line navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#49363A]/85"
        >
          <span className="font-hand text-lg text-[#9E5D68] whitespace-nowrap shrink-0">
            Nhà mình ơiii!
          </span>
          <span aria-hidden="true" className="text-[#B87983]/50">
            ·
          </span>
          <button
            type="button"
            onClick={onScrollToWall}
            className="whitespace-nowrap shrink-0 hover:text-[#9E5D68] underline-offset-4 hover:underline transition-colors"
          >
            Bức tường
          </button>
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:text-[#9E5D68] underline-offset-4 hover:underline transition-colors"
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
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#B87983]/35 bg-[#FFF7F0] text-[#49363A] hover:bg-[#F3D5DD] transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenForm}
            disabled={!isOpenForSubmissions}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#49363A]/20 bg-[#E8B6C2] px-3.5 py-2 sm:px-4 text-xs sm:text-sm font-bold text-[#49363A] shadow-xs transition-all duration-150 hover:bg-[#DFA3B2] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A]"
          >
            Gửi một chiếc thương ♡
          </button>
        </div>
      </div>
    </header>
  );
}
