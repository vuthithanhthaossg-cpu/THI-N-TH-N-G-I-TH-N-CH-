import { Heart } from 'lucide-react';
import { useState } from 'react';

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => Promise<void> | void;
  compact?: boolean;
}

export function LikeButton({ liked, count, onToggle, compact = false }: LikeButtonProps) {
  const [busy, setBusy] = useState(false);
  const [popping, setPopping] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setPopping(true);
    setTimeout(() => setPopping(false), 220);
    try {
      await onToggle();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? `Bỏ thả tim (${count})` : `Thả tim (${count})`}
      className={`inline-flex items-center gap-1.5 rounded-xl border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A] whitespace-nowrap shrink-0 ${
        compact ? 'min-h-9 px-2.5 py-1 text-xs' : 'min-h-10 px-3.5 py-1.5 text-sm'
      } ${
        liked
          ? 'border-[#B87983] bg-[#F3D5DD] text-[#49363A] font-bold'
          : 'border-[#B87983]/35 bg-[#FFF7F0]/90 text-[#49363A]/85 font-semibold hover:bg-[#F8E4E8]'
      }`}
    >
      <Heart
        className={`h-4 w-4 transition-transform duration-150 ${popping ? 'scale-125' : 'scale-100'} ${
          liked ? 'fill-[#B8576B] text-[#B8576B]' : 'text-[#B87983]'
        }`}
        strokeWidth={2.2}
      />
      <span>{liked ? 'Đã thả tim' : 'Thả tim ♡'}</span>
      <span className="tabular-nums font-bold text-[#49363A]">{count}</span>
    </button>
  );
}
