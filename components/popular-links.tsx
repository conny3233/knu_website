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
 * 많이 눌린 링크 — 관측 횟수 순위표.
 *
 * 저장소가 없으면 /api/stats 가 빈 목록을 준다. 그때 이 구획은 통째로 사라지고,
 * 페이지의 나머지는 아무 영향도 받지 않는다. 통계는 있으면 좋은 것이지,
 * 링크 허브가 서 있기 위한 조건이 아니다.
 *
 * (data-fx 를 붙이지 않는 이유: 이 구획은 fetch 뒤 늦게 나타나므로
 *  ScrollFx 의 관찰 목록에 들지 못한다. 붙이면 영영 숨는다.)
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

  const max = Math.max(...items.map((i) => i.count));

  return (
    <section className="scroll-mt-24 space-y-6" aria-labelledby="popular-title">
      {/* 성도에서 가장 밝은 별들 */}
      <SectionHeader
        titleId="popular-title"
        mark="★"
        title="많이 찾는 링크"
        blurb="이 사이트를 거쳐 간 사람들의 발자국"
        count={items.length}
      />

      <ol className="grid gap-x-14 gap-y-1 md:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id} className="border-b border-rule last:border-b-0 md:nth-last-2:border-b-0">
            <TrackedLink
              linkId={item.id}
              href={item.url}
              className="group flex items-center gap-4 px-1 py-3 transition-colors hover:bg-knu-red-tint/40"
            >
              <span
                aria-hidden
                className="catalog-num w-6 shrink-0 text-xl text-knu-red"
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] font-semibold group-hover:text-knu-red-ink">
                  {item.name}
                </span>
                <span className="meta block truncate text-knu-gray">
                  {hostname(item.url)}
                </span>
              </span>

              {/* 관측 횟수 — 가장 밝은 별을 기준으로 한 상대 광도 */}
              <span className="flex shrink-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="hidden h-px bg-knu-red/60 transition-colors group-hover:bg-knu-red sm:block"
                  style={{ width: `${Math.max(8, (item.count / max) * 72)}px` }}
                />
                <span className="meta w-8 text-right text-knu-gray">
                  {item.count}
                </span>
              </span>
            </TrackedLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
