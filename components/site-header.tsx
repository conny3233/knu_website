import { KnuCrest } from "@/components/knu-mark";
import { SearchTrigger } from "@/components/search-trigger";
import { SectionNav } from "@/components/section-nav";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a
          href="#main"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="경북대 링크 허브 홈"
        >
          <KnuCrest className="size-8" />
          <span className="flex items-baseline gap-1.5">
            <span className="text-base leading-none font-bold tracking-tight">
              경북대 링크 허브
            </span>
          </span>
        </a>

        <SectionNav />

        <div className="ml-auto lg:ml-0">
          <SearchTrigger variant="header" />
        </div>
      </div>
    </header>
  );
}
