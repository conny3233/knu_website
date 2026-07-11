import { isAdminSession } from "@/lib/admin/auth";
import { getStorage } from "@/lib/db";
import type { SubmissionStatus } from "@/lib/db/adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<SubmissionStatus>(["pending", "done", "rejected"]);

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdminSession())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "pending";
  if (!VALID_STATUSES.has(statusParam as SubmissionStatus)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  const storage = await getStorage();
  const items = await storage.listSubmissions(statusParam as SubmissionStatus);
  return Response.json({ items });
}
