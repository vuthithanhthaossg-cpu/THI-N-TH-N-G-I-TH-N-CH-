interface ChibiAngelProps {
  variant?: 'praying' | 'heart' | 'waving';
  className?: string;
}

/**
 * Signature chibi angel character inspired faithfully by the original Nam Hoa angel:
 * blonde curly hair, floating golden halo, happy curved eyes, rosy cheeks,
 * small feathered white wings, and a white gown with golden trim.
 */
export function ChibiAngel({ variant = 'praying', className = 'w-24 h-24' }: ChibiAngelProps) {
  return (
    <svg
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Floating golden halo */}
      <ellipse
        cx="70"
        cy="17"
        rx="20"
        ry="5.5"
        stroke="#49363A"
        strokeWidth="3"
        fill="#FFF6CF"
      />
      <ellipse cx="70" cy="17" rx="14" ry="2.6" stroke="#E5B95C" strokeWidth="1.8" fill="none" />

      {/* Little feathered wings behind body */}
      <g stroke="#49363A" strokeWidth="2.8" strokeLinejoin="round">
        {/* Left wing */}
        <path
          d="M44 96 C22 86, 12 96, 19 109 C15 114, 21 122, 31 119 C32 125, 42 124, 48 116 Z"
          fill="#FFFDF9"
        />
        <path d="M27 104 Q34 106 41 105" stroke="#E8B6C2" strokeWidth="1.8" strokeLinecap="round" />
        {/* Right wing */}
        <path
          d="M96 96 C118 86, 128 96, 121 109 C125 114, 119 122, 109 119 C108 125, 98 124, 92 116 Z"
          fill="#FFFDF9"
        />
        <path d="M113 104 Q106 106 99 105" stroke="#E8B6C2" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* Hair back volume (curly warm blonde) */}
      <path
        d="M32 63 C25 46, 39 28, 56 30 C64 23, 82 23, 89 31 C106 30, 116 48, 108 65 C113 78, 104 92, 92 91 L48 91 C35 92, 27 78, 32 63 Z"
        fill="#FCE59B"
        stroke="#49363A"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Little ears */}
      <circle cx="35" cy="70" r="6" fill="#FFE6D5" stroke="#49363A" strokeWidth="2.6" />
      <circle cx="105" cy="70" r="6" fill="#FFE6D5" stroke="#49363A" strokeWidth="2.6" />

      {/* Chibi round face */}
      <path
        d="M38 66 C38 46, 52 38, 70 38 C88 38, 102 46, 102 66 C102 85, 89 96, 70 96 C51 96, 38 85, 38 66 Z"
        fill="#FFE9DB"
        stroke="#49363A"
        strokeWidth="3"
      />

      {/* Curly blonde bangs */}
      <path
        d="M36 62 C38 42, 54 32, 70 32 C86 32, 102 42, 104 62 C97 56, 92 50, 88 57 C83 49, 76 47, 71 56 C66 47, 58 48, 53 57 C48 50, 42 56, 36 62 Z"
        fill="#FCE59B"
        stroke="#49363A"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Hair highlight curl */}
      <path
        d="M54 41 Q61 36 69 40"
        stroke="#FFF8DB"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Happy curved closed eyes */}
      <path
        d="M49 69 Q55 62 61 69"
        stroke="#49363A"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M79 69 Q85 62 91 69"
        stroke="#49363A"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Soft rosy cheeks */}
      <ellipse cx="48" cy="77" rx="6.5" ry="4" fill="#F4A9BC" opacity="0.72" />
      <ellipse cx="92" cy="77" rx="6.5" ry="4" fill="#F4A9BC" opacity="0.72" />

      {/* Gentle happy smile */}
      <path
        d="M64 78 Q70 84 76 78"
        stroke="#49363A"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* White angel robe with gold collar & hem */}
      <path
        d="M53 96 L87 96 L101 142 C85 151, 55 151, 39 142 Z"
        fill="#FFFDF9"
        stroke="#49363A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Gold robe hem */}
      <path
        d="M42 137 C58 145, 82 145, 98 137"
        stroke="#E5B95C"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Little gold collar */}
      <path
        d="M56 97 Q70 106 84 97"
        stroke="#E5B95C"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pose-specific hands */}
      {variant === 'praying' && (
        <g stroke="#49363A" strokeWidth="2.6" strokeLinejoin="round">
          <path d="M53 102 C48 112, 54 121, 64 118 L66 109" fill="#FFFDF9" />
          <path d="M87 102 C92 112, 86 121, 76 118 L74 109" fill="#FFFDF9" />
          <circle cx="66" cy="113" r="5" fill="#FFE9DB" />
          <circle cx="74" cy="113" r="5" fill="#FFE9DB" />
        </g>
      )}

      {variant === 'heart' && (
        <g>
          <path
            d="M51 102 C46 113, 52 121, 62 119"
            fill="#FFFDF9"
            stroke="#49363A"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M89 102 C94 113, 88 121, 78 119"
            fill="#FFFDF9"
            stroke="#49363A"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M70 112 C66 105, 56 107, 56 115 C56 123, 70 131, 70 131 C70 131, 84 123, 84 115 C84 107, 74 105, 70 112 Z"
            fill="#E8B6C2"
            stroke="#49363A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="117" r="4.5" fill="#FFE9DB" stroke="#49363A" strokeWidth="2.2" />
          <circle cx="80" cy="117" r="4.5" fill="#FFE9DB" stroke="#49363A" strokeWidth="2.2" />
        </g>
      )}

      {variant === 'waving' && (
        <g stroke="#49363A" strokeWidth="2.6" strokeLinejoin="round">
          {/* Left arm resting */}
          <path d="M53 102 C46 113, 49 123, 58 121" fill="#FFFDF9" strokeLinecap="round" />
          <circle cx="56" cy="121" r="4.5" fill="#FFE9DB" />
          {/* Right arm raised waving */}
          <path d="M87 101 C98 96, 108 87, 105 78" fill="#FFFDF9" strokeLinecap="round" />
          <circle cx="106" cy="77" r="5" fill="#FFE9DB" />
          {/* Little floating heart near waving hand */}
          <path
            d="M117 61 C115 58, 111 59, 111 62.5 C111 66, 117 69.5, 117 69.5 C117 69.5, 123 66, 123 62.5 C123 59, 119 58, 117 61 Z"
            fill="#E8B6C2"
            stroke="#49363A"
            strokeWidth="1.8"
          />
        </g>
      )}
    </svg>
  );
}
