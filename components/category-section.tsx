import { LinkCard } from "@/components/link-card";
import { catalogMark, SectionHeader } from "@/components/section-header";
import { CATEGORIES } from "@/lib/links/categories";
import type { Category, KnuLink } from "@/lib/links/types";

export function LinkGrid({ links }: { links: readonly KnuLink[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  );
}

export function CategorySection({
  category,
  links,
  index,
}: {
  category: Category;
  links: readonly KnuLink[];
  /** 페이지 로드 시 계단식으로 등장하는 순번 */
  index: number;
}) {
  const meta = CATEGORIES[category];

  return (
    <section
      id={category}
      className="reveal scroll-mt-24 space-y-5"
      style={{ "--i": index } as React.CSSProperties}
      aria-labelledby={`${category}-title`}
    >
      <SectionHeader
        titleId={`${category}-title`}
        mark={catalogMark(meta.order)}
        title={meta.label}
        blurb={meta.blurb}
      />
      <LinkGrid links={links} />
    </section>
  );
}
