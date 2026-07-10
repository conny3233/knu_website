"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { TrackedLink } from "@/components/tracked-link";
import { hostname } from "@/lib/links/url";

interface PopularItem {
  id: string;
  name: string;
  url: string;
  count: number;
}

/**
 * 많이 눌린 링크.
 *
 * 저장소가 없으면 /api/stats 가 빈 목록을 준다. 그때 이 구획은 통째로 사라지고,
 * 페이지의 나머지는 아무 영향도 받지 않는다. 통계는 있으면 좋은 것이지,
 * 링크 허브가 서 있기 위한 조건이 아니다.
 */
export function PopularLinks() {
  const [items, setItems] = useState<PopularItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/stats", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: PopularItem[] }) => setItems(data.items ?? []))
      .catch(() => {
        // 통계를 못 받아왔다. 조용히 없던 일로 한다.
      });

    return () => controller.abort();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="scroll-mt-24 space-y-5" aria-labelledby="popular-title">
      {/* 성도에서 가장 밝은 별들 */}
      <SectionHeader
        titleId="popular-title"
        mark="★"
        title="많이 찾는 링크"
        blurb="이 사이트를 거쳐 간 사람들의 발자국"
      />

      <ol className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <li key={item.id} className="bg-paper">
            <TrackedLink
              linkId={item.id}
              href={item.url}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-knu-red-tint/60"
            >
              <span
                aria-hidden
                className="catalog-num w-5 shrink-0 text-sm text-knu-gray group-hover:text-knu-red"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] font-medium group-hover:text-knu-red-ink">
                  {item.name}
                </span>
                <span className="meta block truncate text-knu-gray">
                  {hostname(item.url)}
                </span>
              </span>
              <span className="meta shrink-0 text-knu-gray">{item.count}</span>
            </TrackedLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
