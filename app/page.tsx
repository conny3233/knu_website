import { CategorySection, LinkGrid } from "@/components/category-section";
import { CheomseongdaeMark } from "@/components/cheomseongdae-mark";
import { CollegeSection } from "@/components/college-section";
import { PinnedRows } from "@/components/pinned-rows";
import { PopularLinks } from "@/components/popular-links";
import { SearchTrigger } from "@/components/search-trigger";
import { SectionHeader } from "@/components/section-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SubmitSection } from "@/components/submit-form";
import { CATEGORY_ORDER } from "@/lib/links/categories";
import { FEATURED_LINKS, LINKS } from "@/lib/links/data";
import type { Category, KnuLink } from "@/lib/links/types";

/**
 * 이 페이지는 서버 컴포넌트이고, DB를 한 번도 참조하지 않는다.
 * 링크는 오직 lib/links/data.ts 에서 온다 — 그래서 DB가 죽어도 여기는 멀쩡하다.
 */
function groupByCategory(links: readonly KnuLink[]): Map<Category, KnuLink[]> {
  const groups = new Map<Category, KnuLink[]>();
  for (const link of links) {
    const bucket = groups.get(link.category);
    if (bucket) bucket.push(link);
    else groups.set(link.category, [link]);
  }
  return groups;
}

function Hero() {
  return (
    <section className="relative pt-16 pb-14 sm:pt-24 sm:pb-16">
      {/* 지면 오른쪽에 아주 옅게 걸린 첨성대 */}
      <CheomseongdaeMark className="pointer-events-none absolute -top-4 right-0 hidden size-72 text-knu-red/[0.06] xl:block" />

      <p
        className="reveal meta text-knu-gray"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        kyungpook national university · link hub
      </p>

      <h1
        className="reveal mt-5 text-[2.25rem] leading-[1.12] font-bold tracking-[-0.03em] sm:text-6xl"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        경북대학교의 모든 링크를,
        <br />
        {/* 붉은 밑줄이 글자 아래 62% 지점부터 차오른다 */}
        <span className="box-decoration-clone bg-linear-to-b from-transparent from-[62%] to-knu-red/25 to-[62%]">
          한 곳에서.
        </span>
      </h1>

      <p
        className="reveal mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        수강신청은 <span className="font-mono text-ink">sugang</span>, 성적은{" "}
        <span className="font-mono text-ink">knuin</span>, 강의는{" "}
        <span className="font-mono text-ink">lms1</span>. 규칙이라곤 없는 주소{" "}
        {LINKS.length}개를 검색 한 번으로 찾습니다.
      </p>

      <div className="reveal mt-9 max-w-xl" style={{ "--i": 3 } as React.CSSProperties}>
        <SearchTrigger variant="hero" />
      </div>

      <p
        className="reveal mt-4 flex flex-wrap items-center gap-x-2 text-knu-gray"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        <span className="meta">
          {LINKS.length} links · {CATEGORY_ORDER.length} categories
        </span>
        <span aria-hidden>·</span>
        <span className="text-[0.6875rem]">초성 검색 지원</span>
      </p>
    </section>
  );
}

export default function Home() {
  const groups = groupByCategory(LINKS);

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6">
        <Hero />

        <PinnedRows />

        <div className="mt-14 space-y-20">
          <section
            className="reveal scroll-mt-24 space-y-5"
            style={{ "--i": 5 } as React.CSSProperties}
            aria-labelledby="featured-title"
          >
            <SectionHeader
              titleId="featured-title"
              mark="00"
              title="자주 찾는 링크"
              blurb="학기 중 가장 많이 열리는 곳"
            />
            <LinkGrid links={FEATURED_LINKS} />
          </section>

          <PopularLinks />

          {CATEGORY_ORDER.map((category, i) => {
            const links = groups.get(category) ?? [];
            if (links.length === 0) return null;

            // 단과대학만 21개라 캠퍼스 필터를 따로 붙인다
            return category === "college" ? (
              <CollegeSection key={category} links={links} index={6 + i} />
            ) : (
              <CategorySection
                key={category}
                category={category}
                links={links}
                index={6 + i}
              />
            );
          })}

          <SubmitSection />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
