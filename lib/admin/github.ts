import type { SubmissionRow } from "@/lib/db/adapter";
import { buildSnippet, extractExistingIds, insertLinkEntries } from "./snippet";

/**
 * GitHub Contents API로 `lib/links/data.ts`에 직접 커밋한다.
 *
 * `/admin`의 "바로 반영" 버튼이 부르는 곳. 이 프로젝트 전용 도구라 저장소·경로·
 * 브랜치를 하드코딩한다(설정화는 과함 — 이 저장소 말고 쓸 곳이 없다).
 *
 * `GITHUB_TOKEN`은 **이 저장소 하나만** 건드릴 수 있는 fine-grained PAT여야
 * 한다(Contents: Read and write 권한만). 공개 웹 화면(비밀번호로 보호되긴
 * 하지만)이 쥐고 있는 토큰이라, 새는 경우의 피해 범위를 이 저장소로 좁힌다.
 */

const OWNER = "conny3233";
const REPO = "knu_website";
const FILE_PATH = "lib/links/data.ts";
const BRANCH = "main";

export type CommitResult =
  | { ok: true; commitSha: string }
  | { ok: false; error: string };

/** ADMIN_SECRET·CRON_SECRET과 같은 컨벤션 — 없으면 기능 자체가 꺼진다 */
export function githubEnabled(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

interface ContentsGetResponse {
  content: string;
  sha: string;
}

interface ContentsPutResponse {
  commit: { sha: string };
}

/**
 * 저장소 계층 관례대로 이 함수도 throw하지 않는다 — 실패는 결과 객체로
 * 돌아오고, 호출부(라우트)가 사용자에게 그대로 보여준다.
 */
export async function commitLinksUpdate(
  rows: readonly SubmissionRow[],
  commitMessage: string,
): Promise<CommitResult> {
  if (!githubEnabled()) {
    return { ok: false, error: "GITHUB_TOKEN이 설정돼 있지 않습니다." };
  }
  if (rows.length === 0) {
    return { ok: false, error: "커밋할 항목이 없습니다." };
  }

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      { headers: authHeaders() },
    );
    if (!getRes.ok) {
      return { ok: false, error: `파일을 불러오지 못했습니다 (HTTP ${getRes.status})` };
    }
    const file = (await getRes.json()) as ContentsGetResponse;
    const currentText = Buffer.from(file.content, "base64").toString("utf8");

    const existingIds = extractExistingIds(currentText);
    const snippet = buildSnippet(rows, existingIds);
    const updatedText = insertLinkEntries(currentText, snippet);
    if (!updatedText) {
      return { ok: false, error: "data.ts 구조를 찾지 못했습니다(배열 종료 마커 없음)." };
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(updatedText, "utf8").toString("base64"),
          sha: file.sha,
          branch: BRANCH,
        }),
      },
    );
    if (!putRes.ok) {
      const body: { message?: string } = await putRes.json().catch(() => ({}));
      return {
        ok: false,
        error: `커밋 실패 (HTTP ${putRes.status})${body.message ? `: ${body.message}` : ""}`,
      };
    }
    const put = (await putRes.json()) as ContentsPutResponse;
    return { ok: true, commitSha: put.commit.sha };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

export const REPO_SLUG = `${OWNER}/${REPO}`;
