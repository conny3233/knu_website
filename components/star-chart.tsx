/**
 * 성도(星圖) — 히어로의 천문도.
 *
 * 첨성대를 중심에 놓고, 개교 당시의 5개 단과대학과 1개 대학원을 뜻하는
 * 여섯 별이 궤도를 느리게(2분에 한 바퀴) 돈다. 하늘의 눈금은
 * 반대 방향으로 더 느리게 돌아, 관측 기구가 살아 있다는 인상만 남긴다.
 *
 * 아래쪽 눈금에 새긴 좌표는 경북대학교 본교(대구 산격동)의 실제 위경도다.
 * 서버 컴포넌트 — 애니메이션은 전부 CSS가 한다.
 */

/** 상단 호를 따라 15°부터 165°까지, 궤도 반지름 210 */
const STARS = [15, 45, 75, 105, 135, 165].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: 300 + Math.cos(rad) * 210,
    y: 300 - Math.sin(rad) * 210,
  };
});

/** 4각 별 — 판각된 성도의 별표 */
function starPath(x: number, y: number, r: number): string {
  const inner = r * 0.28;
  return [
    `M ${x} ${y - r}`,
    `L ${x + inner} ${y - inner}`,
    `L ${x + r} ${y}`,
    `L ${x + inner} ${y + inner}`,
    `L ${x} ${y + r}`,
    `L ${x - inner} ${y + inner}`,
    `L ${x - r} ${y}`,
    `L ${x - inner} ${y - inner}`,
    "Z",
  ].join(" ");
}

/** 배경의 잔별 — 결정적(고정 시드)이어야 SSR과 어긋나지 않는다 */
const FAINT_STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 180, y: 95, r: 1.3, o: 0.3 },
  { x: 420, y: 130, r: 1.1, o: 0.25 },
  { x: 130, y: 210, r: 1.0, o: 0.2 },
  { x: 470, y: 250, r: 1.4, o: 0.3 },
  { x: 210, y: 160, r: 0.9, o: 0.18 },
  { x: 370, y: 90, r: 1.0, o: 0.22 },
  { x: 95, y: 320, r: 1.2, o: 0.25 },
  { x: 500, y: 350, r: 1.0, o: 0.2 },
  { x: 155, y: 430, r: 1.1, o: 0.22 },
  { x: 445, y: 440, r: 1.3, o: 0.28 },
  { x: 250, y: 500, r: 0.9, o: 0.18 },
  { x: 350, y: 520, r: 1.0, o: 0.2 },
];

/** 30° 간격의 큰 눈금 + 6° 간격의 잔눈금 */
function Ticks() {
  const ticks = [];
  for (let deg = 0; deg < 360; deg += 6) {
    const major = deg % 30 === 0;
    const rad = (deg * Math.PI) / 180;
    const r1 = 270;
    const r2 = major ? 258 : 264;
    ticks.push(
      <line
        key={deg}
        x1={300 + Math.cos(rad) * r1}
        y1={300 - Math.sin(rad) * r1}
        x2={300 + Math.cos(rad) * r2}
        y2={300 - Math.sin(rad) * r2}
        strokeWidth={major ? 1 : 0.5}
        opacity={major ? 0.4 : 0.22}
      />,
    );
  }
  return <>{ticks}</>;
}

export function StarChart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* ── 고정된 지면: 관측 눈금 ── */}
      <g className="chart-orbit-reverse" stroke="currentColor">
        <Ticks />
      </g>

      {/* 바깥 원 — 하늘의 가장자리 */}
      <circle
        cx="300"
        cy="300"
        r="270"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
        pathLength="1"
        className="chart-draw"
        style={{ "--draw-i": 0 } as React.CSSProperties}
      />

      {/* 별들의 궤도 */}
      <circle
        cx="300"
        cy="300"
        r="210"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeDasharray="0.004 0.008"
        opacity="0.5"
        pathLength="1"
        className="chart-draw"
        style={{ "--draw-i": 1 } as React.CSSProperties}
      />

      {/* 안쪽 원 — 첨성대의 마당 */}
      <circle
        cx="300"
        cy="300"
        r="132"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
        pathLength="1"
        className="chart-draw"
        style={{ "--draw-i": 2 } as React.CSSProperties}
      />

      {/* 잔별 */}
      <g fill="currentColor">
        {FAINT_STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>

      {/* ── 도는 하늘: 여섯 별과 별자리 선 ── */}
      <g className="chart-orbit">
        {/* 별자리 선 — 여섯 별을 잇는다 */}
        <polyline
          points={STARS.map((s) => `${s.x},${s.y}`).join(" ")}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.25"
        />
        {STARS.map((s, i) => (
          <path
            key={i}
            d={starPath(s.x, s.y, 7)}
            fill="currentColor"
            style={{
              animation: "twinkle 5s ease-in-out infinite",
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </g>

      {/* ── 중심: 첨성대 (40×40 원판을 확대 재배치) ──
           차트가 온통 헤어라인이므로, 중심체도 판화처럼 가볍게 */}
      <g transform="translate(300 312) scale(5.2) translate(-20 -21)" opacity="0.9">
        <rect
          x="11.4"
          y="31"
          width="17.2"
          height="1.2"
          stroke="currentColor"
          strokeWidth="0.35"
        />
        <path
          d="M13.8 31 C13.3 23.5, 14.5 16.5, 16.4 11.7 L23.6 11.7 C25.5 16.5, 26.7 23.5, 26.2 31 Z"
          stroke="currentColor"
          strokeWidth="0.45"
          strokeLinejoin="round"
        />
        <g stroke="currentColor" strokeWidth="0.18" opacity="0.55">
          <line x1="14" y1="27" x2="26" y2="27" />
          <line x1="14.2" y1="23.2" x2="25.8" y2="23.2" />
          <line x1="15" y1="16.2" x2="25" y2="16.2" />
          <line x1="15.5" y1="13" x2="24.5" y2="13" />
        </g>
        <rect x="18.3" y="19" width="3.4" height="3.4" fill="currentColor" opacity="0.85" />
        <rect
          x="15.4"
          y="9.5"
          width="9.2"
          height="2.2"
          stroke="currentColor"
          strokeWidth="0.4"
        />
      </g>

      {/* ── 관측 기록 — 경북대 본교의 실제 좌표 ── */}
      <text
        x="300"
        y="560"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.55"
        style={{
          font: "500 11px var(--font-mono, monospace)",
          letterSpacing: "0.18em",
        }}
      >
        35.8890° N · 128.6109° E
      </text>
      <text
        x="300"
        y="578"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.35"
        style={{
          font: "400 9px var(--font-mono, monospace)",
          letterSpacing: "0.22em",
        }}
      >
        DAEGU — EST. 1946
      </text>
    </svg>
  );
}
