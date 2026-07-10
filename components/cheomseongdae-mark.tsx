/**
 * 첨성대 + 6개의 별.
 *
 * 경북대 심벌마크의 의미를 빌려 직접 작도한 모티프다.
 * (공식 로고 파일은 저작권이 있어 쓰지 않는다.)
 *   · 첨성대 — 진리 탐구
 *   · 6개의 별 — 개교 당시의 5개 단과대학과 1개 대학원
 *   · 원 — 공동체의 화합
 */

/** 상단 호(弧)를 따라 15°부터 165°까지 고르게 놓인 여섯 개의 별 */
const STARS = [15, 45, 75, 105, 135, 165].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    cx: 20 + Math.cos(rad) * 15.2,
    cy: 20 - Math.sin(rad) * 15.2,
  };
});

/** 첨성대 몸통. 아래가 넓고 위로 갈수록 좁아지는 병(甁) 모양 */
const BODY =
  "M13.8 31 C13.3 23.5, 14.5 16.5, 16.4 11.7 L23.6 11.7 C25.5 16.5, 26.7 23.5, 26.2 31 Z";

export function CheomseongdaeMark({
  className,
  twinkle = false,
}: {
  className?: string;
  /** 별을 아주 느리게 깜빡이게 한다. 헤더에서만 켠다. */
  twinkle?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* 몸통 밖으로 삐져나가지 않도록 단(段)을 가둔다 */}
        <clipPath id="csd-body">
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* 공동체의 화합 */}
      <circle cx="20" cy="20" r="18.6" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />

      {/* 개교 당시의 5개 단과대학과 1개 대학원 */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r="1.35"
          fill="currentColor"
          style={
            twinkle
              ? {
                  animation: `twinkle 4.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.55}s`,
                }
              : undefined
          }
        />
      ))}

      {/* 기단부 */}
      <rect x="11.4" y="31" width="17.2" height="1.7" fill="currentColor" />

      {/* 몸통 */}
      <path d={BODY} stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />

      {/* 화강암을 쌓아 올린 27단. 넷으로 줄여 결만 남긴다. */}
      <g clipPath="url(#csd-body)" stroke="currentColor" strokeWidth="0.85" opacity="0.45">
        <line x1="12" y1="27" x2="28" y2="27" />
        <line x1="12" y1="23.2" x2="28" y2="23.2" />
        <line x1="12" y1="16.2" x2="28" y2="16.2" />
        <line x1="12" y1="13" x2="28" y2="13" />
      </g>

      {/* 창구(窓口) — 사람이 드나들던 네모난 구멍 */}
      <rect x="18.3" y="19" width="3.4" height="3.4" fill="currentColor" />

      {/* 정자석(井字石) — 꼭대기의 우물 정(井) 자 돌 */}
      <rect x="15.4" y="9.5" width="9.2" height="2.2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
