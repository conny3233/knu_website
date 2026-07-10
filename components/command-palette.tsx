"use client";

import { Command } from "cmdk";
import { useMemo, useState } from "react";
import { useIsMac } from "@/hooks/use-is-mac";
import { recentStore, useFavoriteIds, useRecentIds } from "@/hooks/use-favorites";
import { trackClick } from "@/lib/client/track";
import { CATEGORIES } from "@/lib/links/categories";
import { FEATURED_LINKS, LINK_BY_ID, LINKS } from "@/lib/links/data";
import { hostname } from "@/lib/links/url";
import type { KnuLink } from "@/lib/links/types";
import { rankLinks } from "@/lib/search/rank";

function byId(ids: readonly string[]): KnuLink[] {
  return ids.map((id) => LINK_BY_ID.get(id)).filter((l): l is KnuLink => !!l);
}

function Row({ link, onSelect }: { link: KnuLink; onSelect: () => void }) {
  return (
    <Command.Item
      value={link.id}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 border-l-2 border-l-transparent px-4 py-2.5
                 data-[selected=true]:border-l-knu-red data-[selected=true]:bg-knu-red-tint"
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium group-data-[selected=true]:text-knu-red-ink">
        {link.name}
      </span>
      <span className="meta hidden shrink-0 text-knu-gray sm:block">
        {hostname(link.url)}
      </span>
      <span className="shrink-0 text-[0.6875rem] text-muted">
        {CATEGORIES[link.category].label}
      </span>
    </Command.Item>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const isMac = useIsMac();
  const favoriteIds = useFavoriteIds();
  const recentIds = useRecentIds();

  // 닫힐 때 질의를 비운다. 다음에 열면 처음부터.
  //
  // 이펙트가 아니라 렌더 중에 처리하는 이유: 팔레트는 ESC(onOpenChange)로도,
  // ⌘K 토글(provider가 직접 open을 뒤집는다)로도 닫힌다. open 값의 전이를
  // 보는 편이 두 경로를 모두 덮는다.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setQuery("");
  }

  const results = useMemo(() => rankLinks(LINKS, query, { limit: 12 }), [query]);

  const favorites = byId(favoriteIds);
  const recents = byId(recentIds).slice(0, 5);

  function go(link: KnuLink) {
    recentStore.push(link.id);
    trackClick(link.id);
    window.open(link.url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }

  const searching = query.trim().length > 0;
  const nothingFound = searching && results.length === 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="경북대 링크 검색"
      shouldFilter={false} // 필터·정렬은 초성 랭커가 한다
      loop
      overlayClassName="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]"
      contentClassName="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2
                        border border-rule-strong bg-paper shadow-[0_24px_60px_-15px] shadow-ink/25"
    >
      <div className="flex items-center gap-3 border-b border-rule px-4">
        <svg
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-knu-gray"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M13.5 13.5L17 17" />
        </svg>

        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="수강신청, 도서관, ㅅㄱㅅㅊ …"
          className="h-14 w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-knu-gray"
        />

        <kbd className="meta shrink-0 rounded-[2px] border border-rule px-1.5 py-0.5 text-knu-gray">
          esc
        </kbd>
      </div>

      <Command.List className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain py-2">
        {nothingFound && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted">
              <span className="font-medium text-ink">{query}</span> 에 맞는 링크가 없습니다.
            </p>
            <p className="mt-1 text-xs text-knu-gray">
              초성으로도 찾을 수 있어요. 예: ㅅㄱㅅㅊ → 수강신청
            </p>
          </div>
        )}

        {searching &&
          results.map((link) => (
            <Row key={link.id} link={link} onSelect={() => go(link)} />
          ))}

        {!searching && (
          <>
            {favorites.length > 0 && (
              <Group heading="즐겨찾기">
                {favorites.map((link) => (
                  <Row key={link.id} link={link} onSelect={() => go(link)} />
                ))}
              </Group>
            )}

            {recents.length > 0 && (
              <Group heading="최근 방문">
                {recents.map((link) => (
                  <Row key={link.id} link={link} onSelect={() => go(link)} />
                ))}
              </Group>
            )}

            <Group heading="자주 찾는 링크">
              {FEATURED_LINKS.map((link) => (
                <Row key={link.id} link={link} onSelect={() => go(link)} />
              ))}
            </Group>
          </>
        )}
      </Command.List>

      <div className="flex items-center justify-between border-t border-rule px-4 py-2.5">
        <p className="text-[0.6875rem] text-knu-gray">
          초성 검색을 지원합니다 · <span className="jamo text-muted">ㄷㅅㄱ</span> → 도서관
        </p>
        <div className="flex items-center gap-3 text-[0.6875rem] text-knu-gray">
          <span className="flex items-center gap-1">
            <Key>↑</Key>
            <Key>↓</Key> 이동
          </span>
          <span className="flex items-center gap-1">
            <Key>↵</Key> 새 탭에서 열기
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Key>{isMac ? "⌘" : "Ctrl"}</Key>
            <Key>K</Key>
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5
                 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-medium
                 [&_[cmdk-group-heading]]:text-knu-gray"
    >
      {children}
    </Command.Group>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-[2px] border border-rule px-1 py-0.5 font-mono text-[0.625rem]">
      {children}
    </kbd>
  );
}
