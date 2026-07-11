import type { NoticeRow, PopularRow, StorageAdapter } from "./adapter";

/**
 * 저장소가 없을 때의 저장소.
 *
 * SQLite를 열지 못하는 환경(예: 파일시스템이 읽기 전용인 서버리스)에서
 * 자동으로 여기로 떨어진다. 사이트의 본체 — 링크 목록, 검색, 즐겨찾기 —
 * 는 저장소를 쓰지 않으므로 아무 일도 일어나지 않는다.
 * 통계와 제보만 조용히 비활성화된다.
 */
export const nullAdapter: StorageAdapter = {
  kind: "null",
  async recordClick() {},
  async getPopular(): Promise<PopularRow[]> {
    return [];
  },
  async saveSubmission() {
    return false;
  },
  async isRateLimited() {
    return false;
  },
  async recordNotice() {},
  async getRecentNotices(): Promise<NoticeRow[]> {
    return [];
  },
};
