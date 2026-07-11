/**
 * 공지사항 감시의 데이터 계약.
 *
 * lib/links/data.ts 와 마찬가지로 감시 대상 목록은 코드에 박아 둔 SSOT다.
 * DB는 "마지막으로 본 글이 무엇이었는지"만 기억한다.
 */

/** 지금 다룰 줄 아는 게시판 형식. 늘어날 때마다 lib/notices/parse.ts 에 분기를 더한다. */
export type BoardParser = "wbbs" | "en-board";

export interface NoticeSource {
  /** lib/links/data.ts 의 KnuLink.id 와 같다 — 배지를 그 링크 카드에 붙이기 위해서다. */
  readonly linkId: string;
  /** 사람이 읽을 이름. 로그·에러 메시지에만 쓰인다. */
  readonly label: string;
  /** 목록 페이지 URL. 상세글이 아니라 리스트 페이지여야 한다. */
  readonly listUrl: string;
  readonly parser: BoardParser;
}

/** 파서가 목록에서 뽑아낸 글 한 건. */
export interface ParsedNotice {
  /** 그 게시판 안에서 이 글을 가리키는 안정적인 값 (문서번호 등). URL 전체보다 짧고 늘 있다. */
  readonly externalId: string;
  readonly title: string;
  readonly url: string;
}
