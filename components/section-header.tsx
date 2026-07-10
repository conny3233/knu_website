/**
 * 성도(星圖) 카탈로그의 표제행.
 *
 *   05 ─────────────────────  단과대학    약칭이 제각각이라…
 *
 * 번호와 제목 사이를 가느다란 괘선이 끝까지 밀어낸다. 인쇄물의 결.
 */
export function SectionHeader({
  mark,
  title,
  blurb,
  titleId,
}: {
  /** 카탈로그 표식. 보통 "01" 같은 두 자리 번호. */
  mark: string;
  title: string;
  blurb?: string;
  /** 섹션의 aria-labelledby 가 가리키는 곳 */
  titleId?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 sm:gap-4">
      <span
        aria-hidden
        className="catalog-num w-7 shrink-0 text-xl leading-none text-knu-red sm:text-2xl"
      >
        {mark}
      </span>

      <h2
        id={titleId}
        className="text-lg font-bold tracking-tight whitespace-nowrap sm:text-xl"
      >
        {title}
      </h2>

      <span aria-hidden className="h-px min-w-4 flex-1 bg-rule" />

      {blurb && (
        <p className="hidden max-w-xs truncate text-xs text-muted lg:block">
          {blurb}
        </p>
      )}
    </div>
  );
}

/** 카테고리 순번을 카탈로그 표식으로. 1 → "01" */
export function catalogMark(order: number): string {
  return String(order).padStart(2, "0");
}
