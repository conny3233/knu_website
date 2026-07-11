import { isAdminSession } from "@/lib/admin/auth";
import { commitLinksUpdate, githubEnabled } from "@/lib/admin/github";
import { getStorage } from "@/lib/db";
import { probeUrl } from "@/lib/health/probe";
import type { SubmissionRow } from "@/lib/db/adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 선택한 제보를 GitHub의 lib/links/data.ts에 직접 커밋하고 "완료"로 표시한다.
 *
 * 요청 본문의 id는 "무엇을 반영할지" 고르는 용도로만 쓰고, 실제 이름·url·
 * 분류는 반드시 서버가 DB에서 다시 읽는다 — 클라이언트가 보낸 값을 그대로
 * 커밋 내용에 쓰지 않는다.
 *
 * 죽은 URL은 여기서 걸러진다: 자동 커밋 경로엔 사람이 검토하는 눈이 없으므로
 * data.ts §5의 "접속을 확인한 URL만" 원칙을 이 라우트가 대신 지킨다.
 */
export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminSession())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!githubEnabled()) {
    return Response.json(
      { error: "GITHUB_TOKEN이 설정돼 있지 않아 자동 반영을 쓸 수 없습니다." },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const ids =
    body && typeof body === "object" && Array.isArray((body as { ids?: unknown }).ids)
      ? (body as { ids: unknown[] }).ids.filter((v): v is number => typeof v === "number")
      : [];
  if (ids.length === 0) {
    return Response.json({ error: "ids가 필요합니다." }, { status: 400 });
  }

  const storage = await getStorage();
  const pending = await storage.listSubmissions("pending");
  const idSet = new Set(ids);
  const requested = pending.filter((row) => idSet.has(row.id));

  if (requested.length === 0) {
    return Response.json(
      { error: "대기중인 제보 중에서 찾을 수 없습니다(이미 처리됐을 수 있습니다)." },
      { status: 404 },
    );
  }

  // 죽은 URL은 자동 커밋에서 제외한다 — 사람이 보는 눈이 없는 경로라 이 게이트가
  // data.ts의 "접속 확인된 URL만" 규칙을 대신 지킨다.
  const probed = await Promise.all(
    requested.map(async (row) => ({ row, result: await probeUrl(row.url) })),
  );
  const alive: SubmissionRow[] = probed
    .filter((p) => p.result.verdict !== "down")
    .map((p) => p.row);
  const skippedDead = probed
    .filter((p) => p.result.verdict === "down")
    .map((p) => ({ id: p.row.id, name: p.row.name, detail: p.result.detail }));

  if (alive.length === 0) {
    return Response.json(
      { error: "선택한 항목이 모두 응답하지 않습니다.", skippedDead },
      { status: 422 },
    );
  }

  const commit = await commitLinksUpdate(
    alive,
    `Add ${alive.length} submitted link(s) via /admin`,
  );
  if (!commit.ok) {
    return Response.json({ error: commit.error, skippedDead }, { status: 502 });
  }

  await Promise.all(alive.map((row) => storage.updateSubmissionStatus(row.id, "done")));

  return Response.json({
    ok: true,
    commitSha: commit.commitSha,
    committed: alive.map((row) => row.id),
    skippedDead,
  });
}
