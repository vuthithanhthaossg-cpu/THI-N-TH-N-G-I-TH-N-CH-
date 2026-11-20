import { ArrowDown, PenLine } from 'lucide-react';
import { ChibiAngel } from './decorations/ChibiAngel';
import { PastelFlower, SparkleStar } from './decorations/ScrapbookAccents';

interface HeroProps {
  wallTitle?: string;
  wallDescription?: string;
  isOpen: boolean;
  onOpenForm: () => void;
  onScrollToWall: () => void;
}

export function Hero({
  wallDescription,
  isOpen,
  onOpenForm,
  onScrollToWall,
}: HeroProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 pb-8 sm:px-6 sm:pt-10 sm:pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#B87983]/25 bg-[#FFF7F0] p-4 sm:p-7 md:p-9 scrapbook-shadow">
        {/* Bespoke Pastel Angel Scrapbook Banner inspired by Reference 1 & 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-[#B87983]/20 bg-gradient-to-b from-[#E6DDF1]/70 via-[#F8E4E8] to-[#F3D5DD]/80 px-5 py-7 sm:px-10 sm:py-10">
          {/* Soft watercolor clouds */}
          <svg
            viewBox="0 0 800 220"
            fill="none"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g fill="#FFF7F0" opacity="0.72">
              <ellipse cx="110" cy="64" rx="78" ry="28" />
              <ellipse cx="66" cy="74" rx="44" ry="20" />
              <ellipse cx="156" cy="74" rx="46" ry="20" />
              <ellipse cx="688" cy="56" rx="84" ry="28" />
              <ellipse cx="635" cy="68" rx="46" ry="20" />
              <ellipse cx="734" cy="68" rx="48" ry="20" />
              <ellipse cx="400" cy="210" rx="230" ry="44" opacity="0.55" />
            </g>
            {/* Golden arched halo stardust curve */}
            <path
              d="M270 155 Q400 28 530 155"
              stroke="#D8B372"
              strokeWidth="1.5"
              strokeDasharray="4 7"
              opacity="0.75"
            />
          </svg>

          {/* Subtle corner pastel flowers & sparkles */}
          <PastelFlower
            className="pointer-events-none absolute top-4 left-5 h-9 w-9 opacity-85 -rotate-12 hidden sm:block"
            petalColor="#F3C7D3"
          />
          <PastelFlower
            className="pointer-events-none absolute bottom-4 right-6 h-10 w-10 opacity-85 rotate-12 hidden sm:block"
            petalColor="#E8B6C2"
          />
          <SparkleStar className="pointer-events-none absolute top-7 right-16 h-4 w-4 opacity-90" />
          <SparkleStar className="pointer-events-none absolute bottom-8 left-16 h-3.5 w-3.5 opacity-80" />

          {/* Banner central lockup */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-7">
            <div className="shrink-0 drop-shadow-sm">
              <ChibiAngel variant="heart" className="h-28 w-24 sm:h-36 sm:w-32" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-hand text-xl sm:text-2xl text-[#9E5D68] mb-1">
                Nhà mình ơiii!
              </p>
              <div className="angel-title-outline text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.12] tracking-tight">
                THIÊN THẦN
                <span className="block sm:inline sm:ml-2">GỬI THÂN CHỦ</span>
              </div>
              <p className="mt-2.5 text-xs sm:text-sm font-semibold text-[#49363A]/80">
                Lưu bút kỷ niệm · Cộng đồng Nam Hòa
              </p>
            </div>
          </div>
        </div>

        {/* Centered Editorial Copy & CTAs */}
        <div className="mx-auto mt-7 max-w-2xl text-center">
          <h1
            className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#49363A] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Có chiếc thương nào muốn gửi hông?
          </h1>

          <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-[#49363A]/85">
            {wallDescription ||
              'Một lời chúc, một chiếc ảnh, một chút quan tâm. Cứ gửi hết vào đây, để tụi mình cùng làm nên một góc Nam Hòa thật đáng yêu nha!'}
          </p>

          {!isOpen && (
            <p className="mt-4 inline-block rounded-xl border border-[#B87983]/35 bg-[#F8E4E8] px-4 py-2 text-sm font-semibold text-[#8A4A56]">
              Bức tường hiện đã tạm đóng nhận lời nhắn. Bạn vẫn có thể ngắm và thả tim các kỷ niệm bên dưới nha!
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenForm}
              disabled={!isOpen}
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#49363A] bg-[#E8B6C2] px-6 py-3 text-base font-extrabold text-[#49363A] shadow-[0_4px_0_#49363A] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#E1A6B5] active:translate-y-0.5 active:shadow-[0_2px_0_#49363A] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A]"
            >
              <PenLine className="h-4.5 w-4.5" strokeWidth={2.4} />
              Gửi một chiếc thương ♡
            </button>

            <button
              type="button"
              onClick={onScrollToWall}
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#B87983]/45 bg-[#FFF7F0] px-6 py-3 text-base font-bold text-[#49363A] transition-colors duration-150 hover:bg-[#F8E4E8] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49363A]"
            >
              Khám phá bức tường
              <ArrowDown className="h-4 w-4 text-[#B87983]" />
            </button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-[#8B636B]">
            <PastelFlower className="h-4 w-4 shrink-0" petalColor="#E8B6C2" />
            <span>Một góc nhỏ dành riêng cho nhà mình Nam Hòa</span>
            <PastelFlower className="h-4 w-4 shrink-0" petalColor="#E8B6C2" />
          </p>
        </div>
      </div>
    </section>
  );
}
