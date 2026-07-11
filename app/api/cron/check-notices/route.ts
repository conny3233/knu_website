import { getStorage } from "@/lib/db";
import { parseLatestNotice } from "@/lib/notices/parse";
import { NOTICE_SOURCES } from "@/lib/notices/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TIMEOUT_MS = 10_000;

/** 봇 차단을 조금이라도 덜 받도록. scripts/healthcheck.ts 와 같은 UA */
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

interface SourceResult {
  linkId: string;
  status: "recorded" | "empty" | "error";
  detail?: string;
}

/**
 * lib/notices/sources.ts 에 등록된 사이트를 하루에 한 번 훑어, 최신 글이
 * 바뀌었으면 저장소에 기록한다. Vercel Cron이 이 라우트를 부른다
 * (vercel.json 참고).
 *
 * 한 사이트가 실패해도(사이트가 마크업을 바꿨다거나, 타임아웃이라거나)
 * 나머지는 계속 진행한다 — 배지 하나가 안 뜨는 것이지 cron 전체가
 * 죽을 이유는 없다.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const storage = await getStorage();
  const now = Date.now();
  const results: SourceResult[] = [];

  for (const source of NOTICE_SOURCES) {
    try {
      const response = await fetch(source.listUrl, {
        headers: HEADERS,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const html = await response.text();
      const notice = parseLatestNotice(source.parser, html);

      if (!notice) {
        results.push({ linkId: source.linkId, status: "empty" });
        continue;
      }

      await storage.recordNotice(source.linkId, notice, now);
      results.push({ linkId: source.linkId, status: "recorded" });
    } catch (error) {
      results.push({
        linkId: source.linkId,
        status: "error",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return Response.json({ checkedAt: now, results });
}
