import { CheomseongdaeMark } from "@/components/cheomseongdae-mark";
import { SearchTrigger } from "@/components/search-trigger";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/links/categories";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a
          href="#main"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="경북대 링크 허브 홈"
        >
          <CheomseongdaeMark className="size-8 text-knu-red" twinkle />
          <span className="flex items-baseline gap-1.5">
            {/* 공식 표기를 따라 소문자 knu */}
            <span className="text-lg leading-none font-bold tracking-tight lowercase">
              knu
            </span>
            <span className="text-[0.8125rem] leading-none text-muted">
              링크 허브
            </span>
          </span>
        </a>

        <nav
          aria-label="카테고리"
          className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex"
        >
          {CATEGORY_ORDER.map((category) => (
            <a
              key={category}
              href={`#${category}`}
              className="rounded-[2px] px-2 py-1 text-[0.8125rem] whitespace-nowrap text-muted transition-colors hover:bg-knu-red-tint hover:text-knu-red-ink"
            >
              {CATEGORIES[category].label}
            </a>
          ))}
        </nav>

        <div className="ml-auto lg:ml-0">
          <SearchTrigger variant="header" />
        </div>
      </div>
    </header>
  );
}
