/**
 * 성도(星圖) 카탈로그의 표제행.
 *
 * 카탈로그 번호를 판각(板刻)처럼 크게 — 붉은 헤어라인 윤곽선만 남긴
 * 고스트 숫자가 제목 뒤에 서고, 제목이 그 아랫단을 딛는다.
 *
 *        ....
 *      01
 *      핵심 시스템  8 ──────────────────  학사의 중심…
 */
export function SectionHeader({
  mark,
  title,
  blurb,
  titleId,
  count,
}: {
  /** 카탈로그 표식. 보통 "01" 같은 두 자리 번호. */
  mark: string;
  title: string;
  blurb?: string;
  /** 섹션의 aria-labelledby 가 가리키는 곳 */
  titleId?: string;
  /** 이 구획의 링크 수 */
  count?: number;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="ghost-num pointer-events-none absolute -top-5 -left-0.5 text-[4rem] sm:-top-7 sm:text-[5.5rem]"
      >
        {mark}
      </span>

      <div className="relative flex items-baseline gap-3 pt-10 sm:gap-4 sm:pt-14">
        <h2
          id={titleId}
          className="text-xl font-bold tracking-tight whitespace-nowrap sm:text-2xl"
        >
          {title}
        </h2>

        {count !== undefined && (
          <span aria-label={`${count}개`} className="meta text-knu-red-ink">
            {count}
          </span>
        )}

        <span aria-hidden className="h-px min-w-4 flex-1 bg-rule" />

        {blurb && (
          <p className="hidden max-w-xs truncate text-xs text-muted lg:block">
            {blurb}
          </p>
        )}
      </div>
    </div>
  );
}

/** 카테고리 순번을 카탈로그 표식으로. 1 → "01" */
export function catalogMark(order: number): string {
  return String(order).padStart(2, "0");
}
