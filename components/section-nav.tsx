"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/links/categories";

/**
 * 헤더의 카테고리 퀵내비.
 *
 * 스크롤 위치에 따라 현재 보고 있는 구획을 붉게 표시한다. 링크 자체는
 * 서버가 그린 정적 앵커(#core 등)라 JS가 없어도 이동은 된다 — 활성
 * 표시만 클라이언트가 얹는다(점진적 향상). data-fx 게이트와 무관하다.
 */
export function SectionNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = CATEGORY_ORDER as readonly string[];
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // 화면 상단(헤더 바로 아래)에 가장 가까이 걸친 구획을 활성으로.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="카테고리"
      className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex"
    >
      {CATEGORY_ORDER.map((category) => {
        const isActive = active === category;
        return (
          <a
            key={category}
            href={`#${category}`}
            aria-current={isActive ? "true" : undefined}
            className={`rounded-[2px] px-2 py-1 text-[0.8125rem] whitespace-nowrap transition-colors ${
              isActive
                ? "bg-knu-red-tint font-medium text-knu-red-ink"
                : "text-muted hover:bg-knu-red-tint hover:text-knu-red-ink"
            }`}
          >
            {CATEGORIES[category].label}
          </a>
        );
      })}
    </nav>
  );
}
