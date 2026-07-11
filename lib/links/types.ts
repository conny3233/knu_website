/**
 * 링크 허브의 데이터 계약.
 *
 * lib/links/data.ts 가 단일 진실 공급원(SSOT)이다. DB에는 링크가 없다.
 * 그래서 DB가 죽어도 사이트는 온전히 렌더된다.
 */

/**
 * 링크가 어느 캠퍼스에 속하는지.
 * 본부 시스템(수강신청·LMS 등)은 두 캠퍼스 공통이라 'both'.
 */
export type Campus = "both" | "daegu" | "sangju";

export type Category =
  | "core" // 대표 홈페이지·통합포털·수강신청·성적·증명·웹메일
  | "learning" // LMS·이러닝
  | "library" // 도서관·학술
  | "admission" // 입학·대학원·국제교류
  | "college" // 단과대학
  | "department" // 학과·전공 홈페이지
  | "support" // 장학·생활관·취업
  | "institute" // 부속·지원기관
  | "hospital" // 부속병원 (별도 법인)
  | "media"; // 언론·공식 SNS

/**
 * 헬스체크 오탐을 억제하기 위한 표식. curl 실측으로 확인된 예외만 적는다.
 *
 * - blocks-bots:  브라우저가 아닌 요청에 5xx를 돌려준다. 사이트는 살아있다.
 * - tls-mismatch: 인증서의 이름이 도메인과 다르다. 사이트는 살아있다.
 */
export type HealthException = "blocks-bots" | "tls-mismatch";

export interface KnuLink {
  /**
   * 안정적인 슬러그. 클릭 통계의 키로 쓰이므로,
   * 학교가 URL을 바꿔도 이 값은 유지해야 통계가 끊기지 않는다.
   */
  readonly id: string;
  readonly name: string;
  readonly nameEn?: string;
  readonly url: string;
  readonly category: Category;
  readonly campus: Campus;
  /** 접속에 학내 계정이 필요한가 */
  readonly requiresLogin: boolean;
  /** 검색 별칭. 사람들이 실제로 칠 법한 말을 넣는다. */
  readonly keywords: readonly string[];
  readonly description?: string;
  readonly healthException?: HealthException;
  /** 상단 '자주 찾는 링크'에 노출 */
  readonly featured?: boolean;
}

export interface CategoryMeta {
  readonly label: string;
  readonly blurb: string;
  /** 성도 카탈로그 번호이자 섹션 정렬 순서 */
  readonly order: number;
}
