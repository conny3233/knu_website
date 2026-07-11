import { CategorySection, LinkGrid } from "@/components/category-section";
import { CollegeSection } from "@/components/college-section";
import { CountUp } from "@/components/count-up";
import { Hobanu } from "@/components/knu-mark";
import { NoticeTicker } from "@/components/notice-ticker";
import { PinnedRows } from "@/components/pinned-rows";
import { PopularLinks } from "@/components/popular-links";
import { SearchTrigger } from "@/components/search-trigger";
import { SectionHeader } from "@/components/section-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StarChart } from "@/components/star-chart";
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
  // 카테고리 구획은 ㄱㄴㄷ 순. 자주 찾는 링크(큐레이션)·많이 찾는 링크(클릭수)는 예외.
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }
  return groups;
}

function Hero() {
  return (
    <section className="relative pt-16 pb-16 sm:pt-24 sm:pb-24">
      {/*
        성도(星圖). 스크롤보다 느리게 흐르고(시차), 700px에 걸쳐 사라진다.
        붉은 하나의 자산을 크게 — 색을 늘리는 대신 밀도를 늘린다.
      */}
      <div
        aria-hidden
        data-parallax="-0.12"
        data-fade="700"
        className="pointer-events-none absolute top-[-90px] right-[-110px] hidden text-knu-red xl:block"
      >
        <StarChart className="size-[620px]" />
      </div>

      {/*
        성도(xl)를 감춘 태블릿 폭(md~lg)에서는 텍스트 오른쪽 여백에 호반우가
        선다. 셋(성도·호반우)이 동시에 뜨지 않고, 좁은 모바일에서는 텍스트와
        겹치지 않도록 아예 감춘다 — 그 화면은 카운트업 모션만으로 충분하다.
      */}
      <div
        aria-hidden
        data-parallax="-0.06"
        className="pointer-events-none absolute right-0 bottom-10 hidden w-36 opacity-95 md:block lg:w-44 xl:hidden"
      >
        <Hobanu className="h-auto w-full" priority />
      </div>

      <div className="relative max-w-2xl">
        <p
          className="reveal meta text-knu-gray"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          kyungpook national university · link hub
        </p>

        <h1
          className="reveal mt-6 text-[2.5rem] leading-[1.08] font-bold tracking-[-0.035em] sm:text-[4rem]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          경북대학교의
          <br />
          모든 링크를,{" "}
          <span className="hero-underline whitespace-nowrap">한 곳에서.</span>
        </h1>

        <div
          className="reveal mt-10 max-w-xl"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <SearchTrigger variant="hero" />
        </div>

        {/* 관측 기록부의 집계 — 세리프 숫자가 지면의 무게중심을 잡는다 */}
        <dl
          className="reveal mt-12 flex items-baseline gap-10"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-2">
            <dd className="catalog-num text-4xl font-medium text-ink sm:text-[2.75rem]">
              <CountUp to={LINKS.length} />
            </dd>
            <dt className="meta text-knu-gray">links</dt>
          </div>
          <div className="flex items-baseline gap-2">
            <dd className="catalog-num text-4xl font-medium text-ink sm:text-[2.75rem]">
              <CountUp to={CATEGORY_ORDER.length} />
            </dd>
            <dt className="meta text-knu-gray">categories</dt>
          </div>
          <div className="hidden items-baseline gap-2 sm:flex">
            <dd className="jamo text-xl text-knu-red-ink">ㅅㄱㅅㅊ</dd>
            <dt className="label-ko text-knu-gray">초성 검색</dt>
          </div>
        </dl>
      </div>
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

        <NoticeTicker />

        <PinnedRows />

        <div className="mt-14 space-y-24">
          <section
            data-fx
            className="scroll-mt-24 space-y-6"
            aria-labelledby="featured-title"
          >
            <SectionHeader
              titleId="featured-title"
              mark="00"
              title="자주 찾는 링크"
              blurb="학기 중 가장 많이 열리는 곳"
              count={FEATURED_LINKS.length}
            />
            <LinkGrid links={FEATURED_LINKS} />
          </section>

          <PopularLinks />

          {CATEGORY_ORDER.map((category) => {
            const links = groups.get(category) ?? [];
            if (links.length === 0) return null;

            // 단과대학만 21개라 캠퍼스 필터를 따로 붙인다
            return category === "college" ? (
              <CollegeSection key={category} links={links} />
            ) : (
              <CategorySection key={category} category={category} links={links} />
            );
          })}

          <SubmitSection />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
