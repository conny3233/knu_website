"use client";

import { useEffect, useState } from "react";
import { useNoticeList } from "@/components/notice-provider";
import { LINK_BY_ID } from "@/lib/links/data";

/**
 * 히어로 아래 한 줄 공지 티커.
 *
 * NoticeProvider(client fetch)에서 최근 공지를 받아, 감시 사이트에 새 글이
 * 있을 때만 나타난다. 없으면 아무것도 그리지 않는다 — 그래서 data-fx로
 * 숨기면 안 된다(AGENTS.md §3). 여러 건이면 몇 초에 한 번 부드럽게 넘긴다.
 * prefers-reduced-motion이면 넘기지 않고 첫 건만 둔다.
 */
export function NoticeTicker() {
  const notices = useNoticeList();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (notices.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % notices.length);
    }, 4500);
    return () => clearInterval(t);
  }, [notices.length]);

  if (notices.length === 0) return null;

  const current = notices[Math.min(idx, notices.length - 1)];
  const source = LINK_BY_ID.get(current.linkId);

  return (
    <div className="mb-4 flex items-center gap-3 border border-rule border-l-2 border-l-knu-red bg-paper px-3 py-2 text-[0.8125rem]">
      <span className="meta shrink-0 rounded-[2px] bg-knu-red px-1.5 py-0.5 text-[0.625rem] tracking-wide text-paper">
        새 공지
      </span>
      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-ink transition-colors hover:text-knu-red-ink"
        title={current.title}
      >
        {source && <span className="text-knu-gray">{source.name} · </span>}
        {current.title}
      </a>
      {notices.length > 1 && (
        <span
          aria-hidden
          className="meta shrink-0 tabular-nums text-knu-gray"
        >
          {Math.min(idx, notices.length - 1) + 1}/{notices.length}
        </span>
      )}
    </div>
  );
}
