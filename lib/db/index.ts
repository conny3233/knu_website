import { join } from "node:path";
import type { StorageAdapter } from "./adapter";
import { nullAdapter } from "./null-adapter";

/**
 * 저장소를 고르는 단 하나의 지점 — graceful degradation 이 여기서 보증된다.
 *
 * 우선순위: Turso(TURSO_DATABASE_URL/TURSO_AUTH_TOKEN이 있으면) → SQLite →
 * NullAdapter. 무엇을 시도하든 실패하면(파일시스템이 읽기 전용이거나,
 * 볼륨이 없거나, node:sqlite 자체가 없거나, Turso 자격증명이 잘못됐거나)
 * 조용히 NullAdapter 로 떨어진다. 링크 목록·검색·즐겨찾기는 저장소를 아예
 * 참조하지 않으므로 영향이 없다.
 *
 * sqlite-adapter 를 정적으로 import 하지 않는 이유: node:sqlite 가 없는
 * 런타임에서는 import 자체가 모듈 로드 시점에 터진다. 동적 import 로 감싸야
 * 그 실패까지 try/catch 안으로 들어온다.
 *
 * 배포 주의: Vercel 같은 서버리스는 파일시스템이 휘발성이라 SQLite 파일이
 * 남지 않는다. 그래서 Vercel에서는 Turso 환경변수를 설정한다. README 참고.
 */

const DB_PATH = process.env.KNU_DB_PATH ?? join(process.cwd(), "data", "knu.db");

let resolved: StorageAdapter | undefined;
let pending: Promise<StorageAdapter> | undefined;

async function connect(): Promise<StorageAdapter> {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    try {
      const { createTursoAdapter } = await import("./turso-adapter");
      return await createTursoAdapter(tursoUrl, tursoToken);
    } catch (error) {
      console.warn(
        "[knu] Turso에 붙지 못했습니다. SQLite로 넘어갑니다:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  try {
    const { createSqliteAdapter } = await import("./sqlite-adapter");
    return createSqliteAdapter(DB_PATH);
  } catch (error) {
    console.warn(
      `[knu] SQLite를 열지 못했습니다. 통계와 제보만 비활성화됩니다 (${DB_PATH}):`,
      error instanceof Error ? error.message : error,
    );
    return nullAdapter;
  }
}

export async function getStorage(): Promise<StorageAdapter> {
  if (resolved) return resolved;
  pending ??= connect().then((adapter) => (resolved = adapter));
  return pending;
}
