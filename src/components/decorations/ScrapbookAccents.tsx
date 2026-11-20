import type { TapeStyle } from '../../types/scrapbook';

interface WashiTapeProps {
  styleType: TapeStyle;
  tone?: 'rose' | 'lavender' | 'sky' | 'butter';
  className?: string;
}

const TAPE_TONE_CLASSES = {
  rose: 'bg-[#E8B6C2]/80 border-[#B87983]/30',
  lavender: 'bg-[#D7C9EA]/85 border-[#9B87B8]/30',
  sky: 'bg-[#C7DFEA]/85 border-[#7FA8BC]/30',
  butter: 'bg-[#F5DFAA]/85 border-[#C7A75E]/30',
};

export function WashiTape({ styleType, tone = 'rose', className = '' }: WashiTapeProps) {
  if (styleType === 'clip') {
    return (
      <svg
        viewBox="0 0 36 52"
        fill="none"
        className={`w-7 h-10 drop-shadow-xs ${className}`}
        aria-hidden="true"
      >
        <path
          d="M12 15 V35 C12 41 24 41 24 35 V11 C24 6 15 6 15 11 V31 C15 34 21 34 21 31 V16"
          stroke="#6E5B5F"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M12 15 V35 C12 41 24 41 24 35 V11 C24 6 15 6 15 11 V31"
          stroke="#B5A4A8"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const patternClass =
    styleType === 'striped'
      ? 'washi-striped'
      : styleType === 'dots'
        ? 'washi-dots'
        : 'washi-grid';

  return (
    <div
      aria-hidden="true"
      className={`h-6 w-24 border-y backdrop-blur-[1px] shadow-xs ${TAPE_TONE_CLASSES[tone]} ${patternClass} ${className}`}
      style={{
        clipPath:
          'polygon(2% 0%, 98% 0%, 100% 25%, 97% 50%, 100% 75%, 98% 100%, 2% 100%, 0% 75%, 3% 50%, 0% 25%)',
      }}
    />
  );
}

export function PastelFlower({
  className = 'w-7 h-7',
  petalColor = '#F3D5DD',
  centerColor = '#F5CF76',
}: {
  className?: string;
  petalColor?: string;
  centerColor?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g>
        <ellipse cx="24" cy="11" rx="6" ry="10" fill={petalColor} />
        <ellipse cx="24" cy="37" rx="6" ry="10" fill={petalColor} />
        <ellipse cx="11" cy="24" rx="10" ry="6" fill={petalColor} />
        <ellipse cx="37" cy="24" rx="10" ry="6" fill={petalColor} />
        <ellipse cx="15" cy="15" rx="6" ry="9" transform="rotate(-45 15 15)" fill={petalColor} />
        <ellipse cx="33" cy="33" rx="6" ry="9" transform="rotate(-45 33 33)" fill={petalColor} />
        <ellipse cx="33" cy="15" rx="6" ry="9" transform="rotate(45 33 15)" fill={petalColor} />
        <ellipse cx="15" cy="33" rx="6" ry="9" transform="rotate(45 15 33)" fill={petalColor} />
        <circle cx="24" cy="24" r="6.5" fill={centerColor} />
      </g>
    </svg>
  );
}

export function WaxHeartSeal({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true">
      {/* Organic wax seal shape */}
      <path
        d="M30 5 C36 4, 42 7, 47 11 C52 16, 55 22, 54 30 C55 38, 51 45, 45 49 C39 54, 33 56, 26 54 C19 54, 13 50, 9 44 C5 38, 5 30, 7 23 C8 15, 14 9, 21 7 C24 5, 27 5, 30 5 Z"
        fill="#A44D5E"
        stroke="#7F3645"
        strokeWidth="2"
      />
      <circle cx="30" cy="30" r="17.5" stroke="#C57484" strokeWidth="1.5" fill="#B55C6E" />
      <path
        d="M30 25.5 C27.8 21.5, 21.5 22.3, 21.5 27.2 C21.5 32.1, 30 37.5, 30 37.5 C30 37.5, 38.5 32.1, 38.5 27.2 C38.5 22.3, 32.2 21.5, 30 25.5 Z"
        fill="#FFF7F0"
      />
    </svg>
  );
}

export function SparkleStar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2 L14.4 9.6 L22 12 L14.4 14.4 L12 22 L9.6 14.4 L2 12 L9.6 9.6 Z"
        fill="#F0C66B"
      />
    </svg>
  );
}
