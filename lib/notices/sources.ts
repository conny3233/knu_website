import type { NoticeSource } from "./types";

/**
 * 공지사항을 감시할 사이트 목록.
 *
 * 227개 링크 중 이 둘만 있는 이유: 나머지 "핵심 시스템·자주 찾는 링크"는
 * 대부분 로그인 게이트 뒤(포털·수강신청·통합정보시스템·웹메일·LMS)에 있어
 * 비로그인 상태로는 공지 목록 자체를 볼 수 없다. 도서관(kudos)과 챗봇(knubot)은
 * 확인해보니 서버 렌더링 없이 SPA로 떠 있어 이 방식(HTML 파싱)으로는 못 읽는다.
 *
 * 넓히려면: 새 파서 하나(lib/notices/parse.ts)와 항목 하나면 된다.
 */
export const NOTICE_SOURCES: readonly NoticeSource[] = [
  {
    linkId: "knu-main",
    label: "경북대학교 홈페이지 · 학사공지",
    listUrl: "https://www.knu.ac.kr/wbbs/wbbs/bbs/btin/list.action?bbs_cde=1&menu_idx=67",
    parser: "wbbs",
  },
  {
    linkId: "knu-en",
    label: "영문 홈페이지 · Notice",
    listUrl: "https://en.knu.ac.kr/board/notice01.htm",
    parser: "en-board",
  },
];
