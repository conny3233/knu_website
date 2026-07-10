import type { KnuLink } from "../links/types";

/**
 * 검색 랭커. 자기완결 모듈이다 — 런타임 import가 하나도 없다.
 * (`import type`은 실행 시점에 지워지므로 node --test 가 그대로 실행할 수 있다.)
 *
 * 라이브러리를 쓰지 않는 이유: 링크가 50개라 O(n) 스캔이 사실상 공짜고,
 * 범용 퍼지 검색기는 한글 초성을 모른다. 어차피 초성 문자열을 우리가 만들어
 * 먹여야 하므로, 그럴 바에는 점수 체계 전체를 직접 쥐는 편이 단순하다.
 */

/** 유니코드 한글 음절 U+AC00–U+D7A3의 초성 19자, 인덱스 순서 그대로 */
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const SYLLABLE_BASE = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
const JUNG_JONG_SPAN = 588; // 21 중성 × 28 종성

/**
 * 호환 자모 블록(U+3131–U+314E)에는 초성이 될 수 없는 겹받침이 섞여 있다.
 * ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ 은 종성 전용이다.
 * 그래서 "키보드로 친 자모"와 "음절에서 뽑은 초성"은 1:1이 아니다.
 * 초성이 될 수 있는 자모만 통과시킨다.
 */
const CHOSEONG_SET: ReadonlySet<string> = new Set(CHOSEONG);

/** 자모만으로 이루어진 입력인지 (초성 검색 모드 판별) */
const JAMO_ONLY = /^[ㄱ-ㅎ]+$/;

/** 문자열의 각 한글 음절을 초성으로 바꾼다. 한글이 아니면 그대로 둔다. */
export function toChoseong(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    out +=
      code >= SYLLABLE_BASE && code <= SYLLABLE_LAST
        ? CHOSEONG[Math.floor((code - SYLLABLE_BASE) / JUNG_JONG_SPAN)]
        : ch;
  }
  return out;
}

/** 초성 검색으로 해석해야 하는 질의인가. 'ㄳ' 처럼 종성 전용 자모는 제외한다. */
export function isChoseongQuery(query: string): boolean {
  return JAMO_ONLY.test(query) && [...query].every((c) => CHOSEONG_SET.has(c));
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 매칭 종류별 배점. 큰 값일수록 사용자의 의도에 가깝다고 본다. */
const SCORE = {
  nameExact: 100,
  namePrefix: 80,
  nameIncludes: 60,
  choseongPrefix: 55,
  keyword: 45,
  choseongIncludes: 40,
  host: 30,
} as const;

/** 이 점수 미만은 결과에서 뺀다. 스쳐 지나가는 매칭까지 보여주면 신뢰를 잃는다. */
const THRESHOLD = 30;

/** 링크 하나에 대해 미리 뽑아 둔 검색 대상 문자열들 */
interface SearchIndex {
  name: string;
  nameEn: string;
  host: string;
  choseong: string;
  keywords: readonly string[];
  /** 별칭까지 초성으로 펼친 것 — 'ㅅㄱ'로 '수강'을 찾으려면 필요하다 */
  keywordChoseong: readonly string[];
}

const INDEX_CACHE = new WeakMap<KnuLink, SearchIndex>();

function indexOf(link: KnuLink): SearchIndex {
  const cached = INDEX_CACHE.get(link);
  if (cached) return cached;

  const name = normalize(link.name);
  const index: SearchIndex = {
    name,
    nameEn: normalize(link.nameEn ?? ""),
    host: hostOf(link.url),
    choseong: toChoseong(name),
    keywords: link.keywords.map(normalize),
    keywordChoseong: link.keywords.map((k) => toChoseong(normalize(k))),
  };
  INDEX_CACHE.set(link, index);
  return index;
}

/** 링크가 질의에 얼마나 부합하는지. 0이면 결과에서 뺀다. */
export function scoreLink(link: KnuLink, rawQuery: string): number {
  const q = normalize(rawQuery);
  if (!q) return 0;

  const idx = indexOf(link);

  // 자모만 입력했다면 사용자는 초성을 친 것이다. 다른 필드를 볼 이유가 없다.
  if (isChoseongQuery(q)) {
    if (idx.choseong.startsWith(q)) return SCORE.choseongPrefix;
    if (idx.choseong.includes(q)) return SCORE.choseongIncludes;
    if (idx.keywordChoseong.some((k) => k.startsWith(q))) return SCORE.keyword;
    return 0;
  }

  if (idx.name === q) return SCORE.nameExact;
  if (idx.name.startsWith(q)) return SCORE.namePrefix;
  if (idx.name.includes(q)) return SCORE.nameIncludes;
  if (idx.keywords.some((k) => k === q || k.startsWith(q))) return SCORE.keyword;
  if (idx.nameEn.includes(q) || idx.host.includes(q)) return SCORE.host;
  if (idx.keywords.some((k) => k.includes(q))) return THRESHOLD;

  return 0;
}

export interface RankOptions {
  /**
   * 링크 id → 클릭 수. 동점일 때만 쓴다.
   * 통계는 선택 사항이라, 없으면 그냥 무시된다 (DB가 없어도 검색은 온전하다).
   */
  popularity?: ReadonlyMap<string, number>;
  limit?: number;
}

/** 질의에 맞는 링크를 점수 순으로. 질의가 비면 빈 배열. */
export function rankLinks(
  links: readonly KnuLink[],
  query: string,
  { popularity, limit }: RankOptions = {},
): KnuLink[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const scored: { link: KnuLink; score: number }[] = [];
  for (const link of links) {
    const score = scoreLink(link, trimmed);
    if (score >= THRESHOLD) scored.push({ link, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const popA = popularity?.get(a.link.id) ?? 0;
    const popB = popularity?.get(b.link.id) ?? 0;
    if (popB !== popA) return popB - popA;

    const featA = a.link.featured ? 1 : 0;
    const featB = b.link.featured ? 1 : 0;
    if (featB !== featA) return featB - featA;

    return a.link.name.localeCompare(b.link.name, "ko");
  });

  const result = scored.map((s) => s.link);
  return limit === undefined ? result : result.slice(0, limit);
}
