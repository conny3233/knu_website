import type { BoardParser, ParsedNotice } from "./types";

/**
 * 게시판 목록 HTML에서 글 목록을 뽑는다.
 *
 * 정규식으로 파싱한다 — cheerio 같은 HTML 파서를 새로 들이지 않는다.
 * 감시 대상이 둘뿐이고, 각자 마크업이 고정적이라 정규식 두 벌로 충분하다.
 * 학교가 게시판 템플릿을 바꾸면 이 파일이 조용히 빈 배열을 돌려주게 되는데,
 * 그 실패는 cron 라우트가 삼킨다 — 배지가 하나 안 뜨는 것이지 사이트가
 * 무너지는 게 아니다.
 *
 * 두 함수 다 목록 순서를 그대로 믿는다(첫 항목 = 최신 글). 최신 글 하나만
 * 있으면 "새 글이 생겼는가"는 판단할 수 있으므로, 전체를 다 못 뽑아도 된다.
 */

/**
 * knu.ac.kr 계열 대학 본부 게시판(wbbs).
 *
 *   <td class="subject">
 *     <a href="...doc_no=1337856..." onclick="...">제목</a>
 *   </td>
 */
function parseWbbsBoard(html: string): ParsedNotice[] {
  const results: ParsedNotice[] = [];
  const re =
    /<td class="subject">\s*<a href="([^"]*doc_no=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const title = match[3]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!title) continue;

    results.push({
      externalId: match[2],
      title,
      url: `https://www.knu.ac.kr${match[1].replace(/&amp;/g, "&")}`,
    });
  }
  return results;
}

/**
 * en.knu.ac.kr 영문 홈페이지 게시판. 옛 방식이라 링크가
 * `mv_data=<base64(idx=...&...)>` 로 문서 식별자를 인코딩해 둔다.
 */
function parseEnBoard(html: string): ParsedNotice[] {
  const results: ParsedNotice[] = [];
  const re = /<a href="(\/board\/notice01\.htm\?mode=view&amp;mv_data=([A-Za-z0-9+/=]+))">([^<]*)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const title = match[3].replace(/\s+/g, " ").trim();
    if (!title) continue;

    let externalId = match[2];
    try {
      externalId = new URLSearchParams(
        Buffer.from(match[2], "base64").toString("utf8"),
      ).get("idx") ?? match[2];
    } catch {
      // 디코딩이 안 되면 인코딩된 토큰 자체를 식별자로 쓴다 — 그래도 값이
      // 바뀌면 "새 글"로는 정확히 잡힌다.
    }

    results.push({
      externalId,
      title,
      url: `https://en.knu.ac.kr${match[1].replace(/&amp;/g, "&")}`,
    });
  }
  return results;
}

const PARSERS: Record<BoardParser, (html: string) => ParsedNotice[]> = {
  wbbs: parseWbbsBoard,
  "en-board": parseEnBoard,
};

/** 목록 중 최신 글 하나. 못 찾으면 null — 예외는 던지지 않는다. */
export function parseLatestNotice(
  parser: BoardParser,
  html: string,
): ParsedNotice | null {
  return PARSERS[parser](html)[0] ?? null;
}
