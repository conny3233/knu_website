import { getStorage } from "@/lib/db";
import { MIN_ELAPSED_MS, submissionFields } from "@/lib/validation/submit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function fail(message: string, status: number): Response {
  return Response.json({ ok: false, message }, { status });
}

const THANKS = "제보해주셔서 고맙습니다. 확인 후 반영하겠습니다.";

/**
 * 빠진 링크 제보를 받는다.
 *
 * 로그인이 없으므로 스팸 방어를 겹쳐 세운다.
 *   1. 허니팟 + 최소 작성 시간 — 봇을 조용히 흘려보낸다
 *   2. 도메인 허용목록        — 경북대와 무관한 링크를 잘라낸다
 *   3. 레이트리밋             — DB 카운터. 저장소가 없으면 이 층만 빠진다
 *
 * 받은 것은 status='pending' 으로 쌓아 두기만 한다. 자동으로 게시하지 않는다.
 */
export async function POST(request: Request): Promise<Response> {
  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("요청을 읽지 못했습니다.", 400);
  }

  /*
   * 봇 판정을 검증보다 먼저 한다.
   *
   * 그리고 걸린 봇에게도 성공을 돌려준다. 400과 "봇으로 판단했습니다"를
   * 주면, 봇을 짜는 쪽에 어느 칸이 함정인지 정확히 알려주는 꼴이 된다.
   * 아무 일도 없었던 것처럼 보내는 편이 함정을 오래 쓴다.
   */
  const honeypot = typeof raw.homepage === "string" ? raw.homepage : "";
  const elapsedMs = typeof raw.elapsedMs === "number" ? raw.elapsedMs : 0;
  if (honeypot.length > 0 || elapsedMs < MIN_ELAPSED_MS) {
    return Response.json({ ok: true, message: THANKS });
  }

  const parsed = submissionFields.safeParse(raw);
  if (!parsed.success) {
    // 스키마의 메시지는 전부 우리말이다 (lib/validation/submit.ts)
    return fail(parsed.error.issues[0]?.message ?? "입력을 확인해주세요.", 400);
  }

  const storage = await getStorage();

  if (await storage.isRateLimited(clientKey(request), Date.now())) {
    return fail("잠시 후 다시 시도해주세요.", 429);
  }

  const saved = await storage.saveSubmission({
    name: parsed.data.name,
    url: parsed.data.url,
    category: parsed.data.category,
    note: parsed.data.note || undefined,
  });

  if (!saved) {
    return fail(
      "지금은 제보를 저장할 수 없습니다. 잠시 후 다시 시도해주세요.",
      503,
    );
  }

  return Response.json({ ok: true, message: THANKS });
}
