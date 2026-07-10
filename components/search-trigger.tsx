"use client";

import { useIsMac } from "@/hooks/use-is-mac";
import { usePalette } from "@/components/palette-provider";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M13.5 13.5L17 17" />
    </svg>
  );
}

function Shortcut({ compact = false }: { compact?: boolean }) {
  const isMac = useIsMac();
  return (
    <kbd
      className={`shrink-0 rounded-[2px] border border-rule px-1.5 py-0.5 font-mono text-knu-gray ${
        compact ? "text-[0.625rem]" : "text-[0.6875rem]"
      }`}
    >
      {isMac ? "⌘" : "Ctrl"} K
    </kbd>
  );
}

/**
 * 검색 입력창처럼 보이지만 실은 버튼이다. 누르면 ⌘K 팔레트가 열린다.
 * 검색 표면을 하나로 두면, 두 곳에서 다르게 동작할 여지가 없다.
 */
export function SearchTrigger({ variant }: { variant: "hero" | "header" }) {
  const { open } = usePalette();

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="링크 검색 열기"
        className="group flex cursor-pointer items-center gap-2 border border-rule bg-paper py-1.5 pr-1.5 pl-2.5 text-sm text-muted transition-colors hover:border-rule-strong hover:text-ink"
      >
        <SearchIcon className="size-3.5 text-knu-gray transition-colors group-hover:text-knu-red" />
        <span className="hidden sm:inline">검색</span>
        <Shortcut compact />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="링크 검색 열기"
      className="group flex w-full cursor-pointer items-center gap-3 border border-rule-strong bg-paper px-4 py-4 text-left transition-all duration-200 ease-out-quart hover:border-knu-red hover:shadow-[0_8px_30px_-12px] hover:shadow-knu-red/30"
    >
      <SearchIcon className="size-5 shrink-0 text-knu-gray transition-colors group-hover:text-knu-red" />
      <span className="flex-1 truncate text-[0.9375rem] text-knu-gray">
        수강신청, 도서관, <span className="jamo text-muted">ㅅㄱㅅㅊ</span> …
      </span>
      <Shortcut />
    </button>
  );
}
