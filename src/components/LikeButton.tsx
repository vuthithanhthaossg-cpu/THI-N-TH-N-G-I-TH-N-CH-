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
      className={`inline-flex items-center gap-1.5 rounded-xl border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A5164] whitespace-nowrap shrink-0 ${
        compact ? 'min-h-9 px-2.5 py-1 text-xs' : 'min-h-10 px-3.5 py-1.5 text-sm'
      } ${
        liked
          ? 'border-[#DF9DAE] bg-[#FCE6ED] text-[#543E43] font-bold'
          : 'border-[#E5BAC5]/65 bg-[#FFFFFF]/90 text-[#664C52] font-semibold hover:bg-[#FDF1F4]'
      }`}
    >
      <Heart
        className={`h-4 w-4 transition-transform duration-150 ${popping ? 'scale-125' : 'scale-100'} ${
          liked ? 'fill-[#D96B82] text-[#D96B82]' : 'text-[#CF8E9E]'
        }`}
        strokeWidth={2.2}
      />
      <span>{liked ? 'Đã thả tim' : 'Thả tim ♡'}</span>
      <span className="tabular-nums font-bold text-[#543E43]">{count}</span>
    </button>
  );
}
