/**
 * 부가 데이터 저장소.
 *
 * 링크는 여기 없다. 링크는 lib/links/data.ts 에 있다.
 * 저장소가 담는 것은 클릭 수, 제보, 레이트리밋 카운터뿐이다.
 *
 * 규칙 하나: **어떤 메서드도 예외를 던지지 않는다.**
 * 읽기는 빈 값을, 쓰기는 실패를 조용히 돌려준다. 통계가 없다고 링크 허브가
 * 멈출 이유는 없기 때문이다.
 */

export interface PopularRow {
  linkId: string;
  count: number;
}

export interface SubmissionInput {
  name: string;
  url: string;
  category: string;
  note?: string;
}

export interface StorageAdapter {
  /** 무엇으로 붙었는지. UI가 "지금은 저장할 수 없다"를 말할 때 쓴다. */
  readonly kind: "sqlite" | "turso" | "null";

  /**
   * 모든 메서드가 Promise를 돌려준다 — Turso(libSQL)는 네트워크 호출이라
   * 동기일 수 없다. node:sqlite 어댑터는 동기 작업을 그냥 async 함수로
   * 감싸서 같은 인터페이스를 맞춘다.
   */

  /** 실패해도 알리지 않는다 */
  recordClick(linkId: string): Promise<void>;

  /** 실패하면 빈 배열 */
  getPopular(limit: number): Promise<PopularRow[]>;

  /** 저장에 성공했는가 */
  saveSubmission(input: SubmissionInput): Promise<boolean>;

  /** 이 키가 지금 창(window)에서 한도를 넘었는가 */
  isRateLimited(key: string, now: number): Promise<boolean>;
}

/** 제보 레이트리밋: 1분 창에 3건 */
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 3;
