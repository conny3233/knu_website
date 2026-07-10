"use client";

import { useState } from "react";
import { LinkGrid } from "@/components/category-section";
import { catalogMark, SectionHeader } from "@/components/section-header";
import { CATEGORIES } from "@/lib/links/categories";
import type { Campus, KnuLink } from "@/lib/links/types";

type Filter = "all" | Campus;

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "daegu", label: "대구" },
  { value: "sangju", label: "상주" },
];

/**
 * 단과대학만 캠퍼스 필터를 가진다. 21개나 되고, 상주 학생에게 대구
 * 단과대학 19개는 대체로 잡음이기 때문이다. 다른 카테고리는 링크가 적어
 * 필터를 붙일 값이 없다.
 */
export function CollegeSection({
  links,
  index,
}: {
  links: readonly KnuLink[];
  index: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const meta = CATEGORIES.college;

  const visible =
    filter === "all" ? links : links.filter((l) => l.campus === filter);

  return (
    <section
      id="college"
      className="reveal scroll-mt-24 space-y-5"
      style={{ "--i": index } as React.CSSProperties}
      aria-labelledby="college-title"
    >
      <SectionHeader
        titleId="college-title"
        mark={catalogMark(meta.order)}
        title={meta.label}
        blurb={meta.blurb}
      />

      <div
        role="tablist"
        aria-label="캠퍼스로 거르기"
        className="flex w-fit gap-px border border-rule bg-rule"
      >
        {TABS.map((tab) => {
          const selected = filter === tab.value;
          const count =
            tab.value === "all"
              ? links.length
              : links.filter((l) => l.campus === tab.value).length;

          return (
            <button
              key={tab.value}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setFilter(tab.value)}
              className={`flex cursor-pointer items-baseline gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "bg-knu-red text-paper"
                  : "bg-paper text-muted hover:bg-knu-red-tint hover:text-knu-red-ink"
              }`}
            >
              {tab.label}
              <span
                className={`meta ${selected ? "text-paper/70" : "text-knu-gray"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <LinkGrid links={visible} />
    </section>
  );
}
