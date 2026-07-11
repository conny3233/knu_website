"use client";

import { useNotice } from "@/components/notice-provider";

/**
 * "새 공지가 있다"는 작은 붉은 표. lib/notices/sources.ts 에 등록된
 * 사이트에만 값이 있으므로, 대부분의 카드에서는 그냥 null이다.
 */
export function NoticeBadge({ linkId }: { linkId: string }) {
  const notice = useNotice(linkId);
  if (!notice) return null;

  return (
    <span
      className="meta shrink-0 rounded-[2px] bg-knu-red px-1 py-0.5 text-paper"
      title={notice.title}
    >
      new
    </span>
  );
}
