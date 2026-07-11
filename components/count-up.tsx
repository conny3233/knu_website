"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 뷰포트에 들어오면 0에서 목표값까지 한 번 세어 올라간다.
 *
 * 서버는 항상 최종값을 렌더한다(SSR/무JS/크롤러에 정확한 숫자). 마운트 후
 * 관찰이 걸리기 전까지도 최종값이라, 스크롤 없이 보여도 숫자는 맞다.
 * prefers-reduced-motion이면 애니메이션을 건너뛴다.
 */
export function CountUp({
  to,
  className,
  durationMs = 1100,
}: {
  to: number;
  className?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();
        const start = performance.now();
        setValue(0);
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / durationMs);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(eased * to));
          if (p < 1) requestAnimationFrame(tick);
          else setValue(to);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
