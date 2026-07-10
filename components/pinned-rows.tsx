"use client";

import { TrackedLink } from "@/components/tracked-link";
import { useFavoriteIds, useRecentIds } from "@/hooks/use-favorites";
import { LINK_BY_ID } from "@/lib/links/data";
import { hostname } from "@/lib/links/url";
import type { KnuLink } from "@/lib/links/types";

/** 저장된 id 중 지금도 존재하는 링크만. 데이터에서 링크를 빼도 깨지지 않는다. */
function resolve(ids: readonly string[]): KnuLink[] {
  return ids.map((id) => LINK_BY_ID.get(id)).filter((l): l is KnuLink => !!l);
}

function Chip({ link }: { link: KnuLink }) {
  return (
    <TrackedLink
      linkId={link.id}
      href={link.url}
      className="group flex shrink-0 items-center gap-2.5 border border-rule bg-paper px-3 py-2 transition-colors hover:border-knu-red hover:bg-knu-red-tint/60"
    >
      <span className="text-[0.8125rem] font-medium group-hover:text-knu-red-ink">
        {link.name}
      </span>
      <span className="meta hidden text-knu-gray sm:inline">
        {hostname(link.url)}
      </span>
    </TrackedLink>
  );
}

function Row({
  label,
  links,
}: {
  label: string;
  links: readonly KnuLink[];
}) {
  return (
    <div className="flex items-center gap-4">
      <p className="label-ko w-16 shrink-0 text-knu-gray">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {links.map((link) => (
          <Chip key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}

/**
 * 즐겨찾기와 최근 방문. 둘 다 localStorage에 산다.
 * 서버 스냅샷이 빈 배열이라 첫 렌더에는 아무것도 그리지 않는다 — 하이드레이션은 조용하다.
 */
export function PinnedRows() {
  const favorites = resolve(useFavoriteIds());
  const recents = resolve(useRecentIds()).slice(0, 6);

  if (favorites.length === 0 && recents.length === 0) return null;

  return (
    <div className="space-y-3 border-y border-rule py-5">
      {favorites.length > 0 && <Row label="즐겨찾기" links={favorites} />}
      {recents.length > 0 && <Row label="최근" links={recents} />}
    </div>
  );
}
