import { adminEnabled, checkSecret, setAdminSession } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!adminEnabled()) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  let body: { secret?: unknown };
  try {
    body = (await request.json()) as { secret?: unknown };
  } catch {
    return Response.json({ error: "요청을 읽지 못했습니다." }, { status: 400 });
  }

  const secret = typeof body.secret === "string" ? body.secret : "";
  if (!secret || !checkSecret(secret)) {
    return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await setAdminSession();
  return Response.json({ ok: true });
}
