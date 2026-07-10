"use client";

import type { AnchorHTMLAttributes, KeyboardEvent } from "react";
import { recentStore } from "@/lib/client/id-store";
import { trackClick } from "@/lib/client/track";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  linkId: string;
  href: string;
}

/**
 * 바깥 사이트로 나가는 앵커. 나가기 직전에 클릭을 기록한다.
 *
 * onMouseDown 을 쓰는 이유: 좌클릭과 휠클릭(새 탭)을 모두 잡으면서
 * preventDefault 를 하지 않으므로 브라우저의 기본 이동을 조금도 방해하지 않는다.
 * onClick 이었다면 휠클릭이 잡히지 않는다.
 */
export function TrackedLink({ linkId, href, children, ...rest }: Props) {
  const record = () => {
    recentStore.push(linkId);
    trackClick(linkId);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseDown={record}
      // 키보드 사용자는 mousedown을 일으키지 않는다
      onKeyDown={(e: KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === "Enter") record();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
