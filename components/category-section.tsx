import { LinkCard } from "@/components/link-card";
import { LinkIndex } from "@/components/link-index";
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

/** 이보다 많으면 카드 대신 목차식 색인으로 깐다 */
const INDEX_THRESHOLD = 24;

export function CategorySection({
  category,
  links,
}: {
  category: Category;
  links: readonly KnuLink[];
}) {
  const meta = CATEGORIES[category];
  const dense = links.length > INDEX_THRESHOLD;

  return (
    <section
      id={category}
      data-fx
      className="scroll-mt-24 space-y-6"
      aria-labelledby={`${category}-title`}
    >
      <SectionHeader
        titleId={`${category}-title`}
        mark={catalogMark(meta.order)}
        title={meta.label}
        blurb={meta.blurb}
        count={links.length}
      />
      {dense ? <LinkIndex links={links} /> : <LinkGrid links={links} />}
    </section>
  );
}
