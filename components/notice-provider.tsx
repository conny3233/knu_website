"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface NoticeItem {
  linkId: string;
  title: string;
  url: string;
}

const NoticeContext = createContext<Map<string, NoticeItem>>(new Map());

/**
 * 최근 발견된 공지를 앱 전체에 한 번만 가져온다.
 *
 * PopularLinks 와 같은 이유로 client fetch다 — 링크 렌더링 경로는 DB를
 * 참조하지 않는다는 원칙(AGENTS.md)을 이 구획도 따른다. 실패하면 빈
 * 맵을 쥐고, 배지는 그냥 하나도 안 뜬다.
 */
export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Map<string, NoticeItem>>(new Map());

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/notices", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: NoticeItem[] }) => {
        setNotices(new Map((data.items ?? []).map((item) => [item.linkId, item])));
      })
      .catch(() => {
        // 공지를 못 받아왔다. 조용히 없던 일로 한다.
      });

    return () => controller.abort();
  }, []);

  return (
    <NoticeContext.Provider value={notices}>{children}</NoticeContext.Provider>
  );
}

/** 이 링크에 최근 발견된 새 공지가 있는가 */
export function useNotice(linkId: string): NoticeItem | undefined {
  return useContext(NoticeContext).get(linkId);
}
