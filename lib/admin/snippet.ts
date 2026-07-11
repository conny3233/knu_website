import type { SubmissionRow } from "@/lib/db/adapter";

/**
 * 제보를 `lib/links/data.ts`에 붙일 KnuLink 리터럴 코드로 바꾼다.
 *
 * 순수 함수라 두 곳에서 그대로 쓴다: 관리자 화면의 "코드로 내보내기"
 * 미리보기(브라우저)와 `/api/admin/commit`의 실제 커밋(서버). 한쪽만 고치고
 * 다른 쪽을 깜빡하는 일이 없도록 로직을 여기 하나로 모았다.
 */

/** "https://example.knu.ac.kr/path" → "example" */
export function slugFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const first = host.split(".")[0] ?? "link";
    return first.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "link";
  } catch {
    return "link";
  }
}

/**
 * id는 클릭 통계의 키라 겹치면 안 된다. 겹치면 경고 대신 -2, -3…을 붙여
 * 애초에 충돌이 나지 않게 만든다 — 자동 커밋 경로엔 사람이 보는 눈이 없다.
 */
export function uniqueId(url: string, used: Set<string>): string {
  const base = slugFromUrl(url);
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

export function buildSnippet(
  rows: readonly SubmissionRow[],
  existingIds: readonly string[],
): string {
  const used = new Set(existingIds);
  const blocks = rows.map((row) => {
    const id = uniqueId(row.url, used);
    const lines = [
      `  {`,
      `    id: ${JSON.stringify(id)},`,
      `    name: ${JSON.stringify(row.name)},`,
      `    url: ${JSON.stringify(row.url)},`,
      `    category: ${JSON.stringify(row.category)},`,
      `    campus: "both",  // 캠퍼스를 확인해 필요하면 daegu/sangju로 바꾸세요`,
      `    requiresLogin: false,`,
      `    keywords: [],  // TODO: 검색 별칭 채우기`,
    ];
    if (row.note) lines.push(`    description: ${JSON.stringify(row.note)},`);
    lines.push(`  },`);
    return lines.join("\n");
  });
  return blocks.join("\n");
}

const ARRAY_END_MARKER = "] as const satisfies readonly KnuLink[];";

/** data.ts의 배열 종료 마커 앞에 snippet을 끼워 넣는다. 마커가 없으면 null(방어적). */
export function insertLinkEntries(fileText: string, snippet: string): string | null {
  if (!fileText.includes(ARRAY_END_MARKER)) return null;
  return fileText.replace(ARRAY_END_MARKER, `${snippet}\n${ARRAY_END_MARKER}`);
}

/** 이미 있는 파일 텍스트에서 기존 id를 전부 뽑는다(정규식 — data.ts는 리터럴이라 안전) */
export function extractExistingIds(fileText: string): string[] {
  return [...fileText.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]!);
}
