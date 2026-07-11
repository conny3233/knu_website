import { createClient } from "@libsql/client";
import {
  NOTICE_NEW_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  type NoticeInput,
  type NoticeRow,
  type PopularRow,
  type StorageAdapter,
  type SubmissionInput,
  type SubmissionRow,
  type SubmissionStatus,
} from "./adapter";

/**
 * Turso(libSQL)로 붙는 저장소. Vercel처럼 파일시스템이 휘발성인
 * 서버리스 런타임에서 통계·제보를 유지하려면 이 어댑터가 필요하다.
 *
 * SQL 방언이 SQLite와 호환이라 스키마와 쿼리는 sqlite-adapter.ts와 동일하다.
 * 다른 점은 모든 호출이 네트워크 왕복이라 실제로 비동기라는 것뿐이다.
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

export async function createTursoAdapter(
  url: string,
  authToken: string,
): Promise<StorageAdapter> {
  const client = createClient({ url, authToken });

  // 스키마 부트스트랩은 연결 시 한 번. 실패하면(권한 없음 등) 그대로
  // 예외를 던져 lib/db/index.ts 가 NullAdapter로 떨어지게 한다.
  await client.executeMultiple(SCHEMA);

  // 지난 창의 찌꺼기를 치운다 — 실패해도 어댑터 생성 자체는 막지 않는다
  try {
    await client.execute({
      sql: "DELETE FROM rate_limit WHERE window_start < ?",
      args: [Date.now() - 86_400_000],
    });
  } catch {
    // 청소 실패는 무해하다
  }

  return {
    kind: "turso",

    async recordClick(linkId) {
      try {
        await client.execute({
          sql: `
            INSERT INTO clicks (link_id, count, updated_at) VALUES (?, 1, ?)
            ON CONFLICT(link_id) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
          `,
          args: [linkId, Date.now()],
        });
      } catch {
        // 통계 한 건이다. 삼킨다.
      }
    },

    async getPopular(limit) {
      try {
        const result = await client.execute({
          sql: `
            SELECT link_id, count FROM clicks
            WHERE count > 0 ORDER BY count DESC, link_id ASC LIMIT ?
          `,
          args: [limit],
        });
        return result.rows.map<PopularRow>((r) => ({
          linkId: String(r.link_id),
          count: Number(r.count),
        }));
      } catch {
        return [];
      }
    },

    async saveSubmission(input: SubmissionInput) {
      try {
        await client.execute({
          sql: `
            INSERT INTO submissions (name, url, category, note, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', ?)
          `,
          args: [input.name, input.url, input.category, input.note ?? null, Date.now()],
        });
        return true;
      } catch {
        return false;
      }
    },

    async listSubmissions(status: SubmissionStatus) {
      try {
        const result = await client.execute({
          sql: `
            SELECT id, name, url, category, note, status, created_at
            FROM submissions WHERE status = ? ORDER BY created_at DESC
          `,
          args: [status],
        });
        return result.rows.map<SubmissionRow>((r) => ({
          id: Number(r.id),
          name: String(r.name),
          url: String(r.url),
          category: String(r.category),
          note: r.note != null ? String(r.note) : undefined,
          status: String(r.status) as SubmissionStatus,
          createdAt: Number(r.created_at),
        }));
      } catch {
        return [];
      }
    },

    async updateSubmissionStatus(id: number, status: SubmissionStatus) {
      try {
        const result = await client.execute({
          sql: `UPDATE submissions SET status = ? WHERE id = ?`,
          args: [status, id],
        });
        return result.rowsAffected > 0;
      } catch {
        return false;
      }
    },

    /** 고정 창(fixed window) 카운터. 경계에서 최대 2×MAX 까지 새는 특성은 sqlite-adapter와 동일. */
    async isRateLimited(key, now) {
      try {
        const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
        await client.execute({
          sql: `
            INSERT INTO rate_limit (key, window_start, count) VALUES (?, ?, 1)
            ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
          `,
          args: [key, windowStart],
        });
        const result = await client.execute({
          sql: `SELECT count FROM rate_limit WHERE key = ? AND window_start = ?`,
          args: [key, windowStart],
        });
        const count = result.rows[0] ? Number(result.rows[0].count) : 0;
        return count > RATE_LIMIT_MAX;
      } catch {
        // 카운터가 고장 났다고 제보를 막지는 않는다
        return false;
      }
    },

    async recordNotice(linkId: string, notice: NoticeInput, now: number) {
      try {
        await client.execute({
          sql: `
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
          `,
          args: [linkId, notice.externalId, notice.title, notice.url, now, now],
        });
      } catch {
        // 배지 하나 못 다는 것이다. 삼킨다.
      }
    },

    async getRecentNotices(now: number) {
      try {
        const result = await client.execute({
          sql: `
            SELECT link_id, title, url, first_seen_at FROM notices
            WHERE first_seen_at >= ? ORDER BY first_seen_at DESC
          `,
          args: [now - NOTICE_NEW_WINDOW_MS],
        });
        return result.rows.map<NoticeRow>((r) => ({
          linkId: String(r.link_id),
          title: String(r.title),
          url: String(r.url),
          firstSeenAt: Number(r.first_seen_at),
        }));
      } catch {
        return [];
      }
    },
  };
}
