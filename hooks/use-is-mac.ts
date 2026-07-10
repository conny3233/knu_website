"use client";

import { useSyncExternalStore } from "react";

let cached: boolean | undefined;

function detect(): boolean {
  if (cached === undefined) {
    cached = /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  return cached;
}

const noopSubscribe = () => () => {};

/**
 * ⌘ 인가 Ctrl 인가. 서버는 알 수 없으므로 일단 false(Ctrl)로 그리고,
 * 하이드레이션 직후 진짜 값으로 바꾼다. useSyncExternalStore 가 그 교대를
 * 맡으므로 하이드레이션 불일치 경고가 나지 않는다.
 */
export function useIsMac(): boolean {
  return useSyncExternalStore(noopSubscribe, detect, () => false);
}
