import { FavoriteButton } from "@/components/favorite-button";
import { HealthBadge } from "@/components/health-badge";
import { TrackedLink } from "@/components/tracked-link";
import { hostname } from "@/lib/links/url";
import type { KnuLink } from "@/lib/links/types";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="meta rounded-[2px] border border-rule px-1.5 py-0.5 text-muted">
      {children}
    </span>
  );
}

export function LinkCard({ link }: { link: KnuLink }) {
  return (
    <article
      className="group relative flex flex-col gap-2 border border-rule border-l-2 border-l-transparent bg-paper p-4
                 transition-[border-color,background-color,transform] duration-200 ease-out-quart
                 hover:-translate-y-px hover:border-rule-strong hover:border-l-knu-red hover:bg-knu-red-tint/50
                 focus-within:border-l-knu-red"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[0.9375rem] leading-snug font-semibold tracking-tight">
          {/*
            ::after 로 카드 전체를 덮어 어디를 눌러도 링크가 열리게 한다.
            앵커의 접근 가능한 이름은 링크 이름 그대로 남는다.
          */}
          <TrackedLink
            linkId={link.id}
            href={link.url}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-knu-red-ink"
          >
            {link.name}
          </TrackedLink>
        </h3>

        <div className="flex shrink-0 items-center gap-1.5">
          {link.healthException && <HealthBadge exception={link.healthException} />}
          <FavoriteButton linkId={link.id} name={link.name} />
        </div>
      </div>

      {link.description && (
        <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-muted">
          {link.description}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <span className="meta truncate text-knu-gray">{hostname(link.url)}</span>

        <div className="flex shrink-0 items-center gap-1.5">
          {link.campus === "sangju" && <Pill>상주</Pill>}
          {link.requiresLogin && <Pill>로그인</Pill>}
          <svg
            viewBox="0 0 16 16"
            className="size-3.5 text-knu-gray transition-transform duration-200 ease-out-quart group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-knu-red"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 11L11 5M6 5h5v5" />
          </svg>
        </div>
      </div>
    </article>
  );
}
