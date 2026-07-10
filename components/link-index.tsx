import { FavoriteButton } from "@/components/favorite-button";
import { HealthBadge } from "@/components/health-badge";
import { TrackedLink } from "@/components/tracked-link";
import { hostname } from "@/lib/links/url";
import type { KnuLink } from "@/lib/links/types";

/**
 * 인쇄물의 목차(目次)식 색인.
 *
 *   경제경영연구소 ················· rieba.knu.ac.kr
 *
 * 링크가 수십 개인 구획(부설연구소)을 카드로 깔면 벽이 된다.
 * 이름과 주소 사이를 점선 리더가 잇는 색인이 절반의 높이로 더 많이 담고,
 * 성도 카탈로그라는 지면의 은유와도 맞는다.
 */
function IndexRow({ link }: { link: KnuLink }) {
  return (
    <li className="group relative break-inside-avoid">
      <TrackedLink
        linkId={link.id}
        href={link.url}
        className="-mx-2 flex items-baseline gap-2.5 px-2 py-[0.4375rem]
                   transition-colors after:absolute after:inset-0 after:content-['']
                   hover:bg-knu-red-tint/50"
      >
        <span className="truncate text-[0.875rem] leading-snug font-medium group-hover:text-knu-red-ink">
          {link.name}
        </span>

        {link.healthException && <HealthBadge exception={link.healthException} />}

        <span aria-hidden className="dot-leader opacity-70" />

        <span className="meta hidden shrink-0 text-knu-gray transition-colors group-hover:text-knu-red sm:inline">
          {hostname(link.url)}
        </span>
      </TrackedLink>

      {/* 별은 행 오른쪽 끝, 호버 때만 떠오른다 (켜져 있으면 항상) */}
      <span
        className="absolute top-1/2 -right-6 -translate-y-1/2 opacity-0 transition-opacity
                   group-hover:opacity-100 has-[[aria-pressed=true]]:opacity-100"
      >
        <FavoriteButton linkId={link.id} name={link.name} />
      </span>
    </li>
  );
}

export function LinkIndex({ links }: { links: readonly KnuLink[] }) {
  return (
    <ol className="gap-x-14 pr-6 md:columns-2 xl:columns-3">
      {links.map((link) => (
        <IndexRow key={link.id} link={link} />
      ))}
    </ol>
  );
}
