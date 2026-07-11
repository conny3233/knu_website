import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  NOTICE_NEW_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  type NoticeInput,
  type NoticeRow,
  type PopularRow,
  type StorageAdapter,
  type SubmissionInput,
} from "./adapter";

/**
 * node:sqlite 로 붙는 저장소.
 *
 * better-sqlite3 대신 Node 24 내장 모듈을 쓴다. 네이티브 리빌드가 없으니
 * Windows에서 Visual Studio Build Tools를 깔 일이 없다.
 * (아직 실험적 API라 실행 시 ExperimentalWarning 이 한 줄 뜬다.)
 */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS clicks (
    link_id    TEXT PRIMARY KEY,
    count      INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    category   TEXT NOT NULL,
    note       TEXT,
    status     TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rate_limit (
    key          TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count        INTEGER NOT NULL,
    PRIMARY KEY (key, window_start)
  );

  CREATE TABLE IF NOT EXISTS notices (
    link_id       TEXT PRIMARY KEY,
    external_id   TEXT NOT NULL,
    title         TEXT NOT NULL,
    url           TEXT NOT NULL,
    first_seen_at INTEGER NOT NULL,
    checked_at    INTEGER NOT NULL
  );
`;

export function createSqliteAdapter(dbPath: string): StorageAdapter {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  // 읽기와 쓰기가 서로를 막지 않도록
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 3000");
  db.exec(SCHEMA);

  // 지난 창의 찌꺼기를 치운다
  db.exec(
    `DELETE FROM rate_limit WHERE window_start < ${Date.now() - 86_400_000}`,
  );

  const insertClick = db.prepare(`
    INSERT INTO clicks (link_id, count, updated_at) VALUES (?, 1, ?)
    ON CONFLICT(link_id) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
  `);

  const selectPopular = db.prepare(`
    SELECT link_id, count FROM clicks
    WHERE count > 0 ORDER BY count DESC, link_id ASC LIMIT ?
  `);

  const insertSubmission = db.prepare(`
    INSERT INTO submissions (name, url, category, note, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `);

  const bumpRate = db.prepare(`
    INSERT INTO rate_limit (key, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
  `);

  const readRate = db.prepare(
    `SELECT count FROM rate_limit WHERE key = ? AND window_start = ?`,
  );

  const upsertNotice = db.prepare(`
    INSERT INTO notices (link_id, external_id, title, url, first_seen_at, checked_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(link_id) DO UPDATE SET
      external_id   = excluded.external_id,
      title         = excluded.title,
      url           = excluded.url,
      first_seen_at = CASE
        WHEN notices.external_id != excluded.external_id THEN excluded.first_seen_at
        ELSE notices.first_seen_at
      END,
      checked_at    = excluded.checked_at
  `);

  const selectRecentNotices = db.prepare(`
    SELECT link_id, title, url, first_seen_at FROM notices
    WHERE first_seen_at >= ? ORDER BY first_seen_at DESC
  `);

  return {
    kind: "sqlite",

    // node:sqlite 자체는 동기 API다. 인터페이스를 Turso(비동기)와 맞추기
    // 위해 async 함수로 감싸지만, 실제 호출은 여전히 동기·즉시 완료된다.

    async recordClick(linkId) {
      try {
        insertClick.run(linkId, Date.now());
      } catch {
        // 통계 한 건이다. 삼킨다.
      }
    },

    async getPopular(limit) {
      try {
        const rows = selectPopular.all(limit) as {
          link_id: string;
          count: number;
        }[];
        return rows.map<PopularRow>((r) => ({
          linkId: r.link_id,
          count: r.count,
        }));
      } catch {
        return [];
      }
    },

    async saveSubmission(input: SubmissionInput) {
      try {
        insertSubmission.run(
          input.name,
          input.url,
          input.category,
          input.note ?? null,
          Date.now(),
        );
        return true;
      } catch {
        return false;
      }
    },

    /**
     * 고정 창(fixed window) 카운터.
     *
     * 인메모리가 아니라 DB에 적는 이유는, 서버가 여러 벌 뜨는 환경에서
     * 프로세스마다 따로 세면 한도가 그만큼 배로 늘어나기 때문이다.
     *
     * 고정 창은 경계에서 최대 2×MAX 까지 새어 나간다 (창이 바뀌는 순간에
     * 걸쳐 몰아치면 앞 창 3건 + 뒤 창 3건). 슬라이딩 창이면 막히지만,
     * 링크 제보 폼에 그 정밀도는 필요 없다.
     */
    async isRateLimited(key, now) {
      try {
        const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
        bumpRate.run(key, windowStart);
        const row = readRate.get(key, windowStart) as
          | { count: number }
          | undefined;
        return (row?.count ?? 0) > RATE_LIMIT_MAX;
      } catch {
        // 카운터가 고장 났다고 제보를 막지는 않는다
        return false;
      }
    },

    async recordNotice(linkId: string, notice: NoticeInput, now: number) {
      try {
        upsertNotice.run(linkId, notice.externalId, notice.title, notice.url, now, now);
      } catch {
        // 배지 하나 못 다는 것이다. 삼킨다.
      }
    },

    async getRecentNotices(now: number) {
      try {
        const rows = selectRecentNotices.all(now - NOTICE_NEW_WINDOW_MS) as {
          link_id: string;
          title: string;
          url: string;
          first_seen_at: number;
        }[];
        return rows.map<NoticeRow>((r) => ({
          linkId: r.link_id,
          title: r.title,
          url: r.url,
          firstSeenAt: r.first_seen_at,
        }));
      } catch {
        return [];
      }
    },
  };
}
