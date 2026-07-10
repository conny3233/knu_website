import { HEALTH_NOTE } from "@/lib/links/categories";
import type { HealthException } from "@/lib/links/types";

/**
 * "이 링크는 깨졌다"가 아니라 "이렇게 보일 수 있다"를 알리는 표식.
 *
 * 자동 점검 도구는 이 사이트들을 죽은 것으로 오판한다. 사람에게는
 * 무슨 일이 벌어질지 미리 말해 주는 편이 낫다.
 */
export function HealthBadge({ exception }: { exception: HealthException }) {
  const note = HEALTH_NOTE[exception];

  return (
    <span
      className="relative z-10 inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full border border-knu-gray/50 text-knu-gray"
      title={note}
      aria-label={note}
      role="note"
    >
      <svg viewBox="0 0 16 16" className="size-2.5" fill="currentColor" aria-hidden="true">
        <path d="M7 3h2v6H7zM7 11h2v2H7z" />
      </svg>
    </span>
  );
}
