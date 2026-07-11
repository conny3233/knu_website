import { isAdminSession } from "@/lib/admin/auth";
import { getStorage } from "@/lib/db";
import type { SubmissionStatus } from "@/lib/db/adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<SubmissionStatus>(["pending", "done", "rejected"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!(await isAdminSession())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  let body: { status?: unknown };
  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return Response.json({ error: "요청을 읽지 못했습니다." }, { status: 400 });
  }

  const status = body.status;
  if (typeof status !== "string" || !VALID_STATUSES.has(status as SubmissionStatus)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  const storage = await getStorage();
  const ok = await storage.updateSubmissionStatus(id, status as SubmissionStatus);
  if (!ok) {
    return Response.json({ error: "저장소에 반영하지 못했습니다." }, { status: 503 });
  }

  return Response.json({ ok: true });
}
