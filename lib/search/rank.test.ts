import assert from "node:assert/strict";
import { test } from "node:test";

// node --test 는 ESM 해석이라 확장자를 요구한다. 앱 코드는 '@/lib/search/rank'로 쓴다.
import { LINKS } from "../links/data.ts";
import { isChoseongQuery, rankLinks, scoreLink, toChoseong } from "./rank.ts";

const idsFor = (q: string, limit = 3) =>
  rankLinks(LINKS, q, { limit }).map((l) => l.id);

test("toChoseong: 음절에서 초성을 뽑는다", () => {
  assert.equal(toChoseong("경북대"), "ㄱㅂㄷ");
  assert.equal(toChoseong("수강신청"), "ㅅㄱㅅㅊ");
  assert.equal(toChoseong("도서관"), "ㄷㅅㄱ");
});

test("toChoseong: 쌍자음 초성", () => {
  assert.equal(toChoseong("빠른"), "ㅃㄹ");
  assert.equal(toChoseong("따뜻한"), "ㄸㄸㅎ");
});

test("toChoseong: 종성은 초성 판단에 끼어들지 않는다", () => {
  assert.equal(toChoseong("값"), "ㄱ"); // 겹받침 ㅄ 이 있어도 초성은 ㄱ
  assert.equal(toChoseong("읽다"), "ㅇㄷ");
});

test("toChoseong: 한글이 아니면 그대로 둔다", () => {
  assert.equal(toChoseong("lms강의"), "lmsㄱㅇ");
  assert.equal(toChoseong("2026학년도"), "2026ㅎㄴㄷ");
});

test("isChoseongQuery: 종성 전용 자모는 초성 질의가 아니다", () => {
  assert.equal(isChoseongQuery("ㄱㅂㄷ"), true);
  assert.equal(isChoseongQuery("ㅃㄹ"), true);
  // ㄳ ㄵ ㄺ ㅄ 는 호환 자모 블록에 있지만 초성이 될 수 없다
  assert.equal(isChoseongQuery("ㄳ"), false);
  assert.equal(isChoseongQuery("ㄺ"), false);
  assert.equal(isChoseongQuery("ㄱㅂ대"), false);
  assert.equal(isChoseongQuery(""), false);
});

test("초성 전용 자모가 섞여도 터지지 않고 결과가 비어 있다", () => {
  assert.deepEqual(idsFor("ㄳ"), []);
});

test("초성 검색: 실제 데이터", () => {
  assert.equal(idsFor("ㅅㄱㅅㅊ")[0], "sugang");
  assert.equal(idsFor("ㄷㅅㄱ")[0], "library");
});

test("초성 동점이면 featured 링크가 앞선다", () => {
  // '경북대학교 홈페이지'와 '경북대학교병원' 둘 다 ㄱㅂㄷ 로 시작한다
  const ranked = idsFor("ㄱㅂㄷ", 5);
  assert.equal(ranked[0], "knu-main");
  assert.ok(ranked.includes("hospital-knuh"));
});

test("이름 부분 일치가 별칭 일치보다 앞선다", () => {
  assert.equal(idsFor("lms")[0], "lms");
});

test("별칭으로 찾는다 — 이름에 없는 말", () => {
  // '통합정보시스템'이라는 이름에는 '성적'이 없다
  assert.equal(idsFor("성적")[0], "knuin");
  assert.equal(idsFor("장바구니")[0], "sugang");
  assert.equal(idsFor("기숙사")[0], "dorm");
});

test("호스트명으로 찾는다 — 약칭이 제각각인 단과대학", () => {
  assert.equal(idsFor("cec")[0], "college-cec");
  assert.equal(idsFor("mvarts")[0], "college-arts");
  assert.equal(idsFor("경상")[0], "college-cec");
});

test("질의가 비면 결과도 비운다", () => {
  assert.deepEqual(rankLinks(LINKS, ""), []);
  assert.deepEqual(rankLinks(LINKS, "   "), []);
});

test("아무것도 안 걸리면 빈 배열", () => {
  assert.deepEqual(rankLinks(LINKS, "zxcvbnm"), []);
});

test("임계값 미만은 버린다", () => {
  const knuMain = LINKS.find((l) => l.id === "knu-main")!;
  assert.equal(scoreLink(knuMain, "zxcvbnm"), 0);
});

test("동점일 때 인기순으로 가른다", () => {
  const popular = new Map([["hospital-knuh", 999]]);
  // featured 인 knu-main 을 인기수로 밀어낼 수 있다
  const ranked = rankLinks(LINKS, "ㄱㅂㄷ", { popularity: popular, limit: 2 });
  assert.equal(ranked[0].id, "hospital-knuh");
});

test("limit 을 지킨다", () => {
  assert.equal(rankLinks(LINKS, "ㄱ", { limit: 4 }).length, 4);
});

test("대소문자·공백을 무시한다", () => {
  assert.equal(idsFor("LMS")[0], "lms");
  assert.equal(idsFor("수강 신청")[0], "sugang");
});
