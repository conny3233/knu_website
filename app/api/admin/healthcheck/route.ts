import { isAdminSession } from "@/lib/admin/auth";
import { probeUrl } from "@/lib/health/probe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isProbableUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** 제보 목록의 임의 URL을 그 자리에서 확인한다. 판정 규칙은 lib/health/probe.ts 참고. */
export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminSession())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return Response.json({ error: "요청을 읽지 못했습니다." }, { status: 400 });
  }

  const url = body.url;
  if (typeof url !== "string" || !isProbableUrl(url)) {
    return Response.json({ error: "invalid url" }, { status: 400 });
  }

  const result = await probeUrl(url);
  return Response.json(result);
}
