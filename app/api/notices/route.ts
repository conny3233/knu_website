import { getStorage } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 최근 발견된 공지. 저장소가 없으면 빈 목록을 돌려주고, 화면에서는
 * "NEW" 배지가 그냥 하나도 안 뜬다 — 링크 카드 자체는 아무 영향 없다.
 */
export async function GET(): Promise<Response> {
  let items: { linkId: string; title: string; url: string }[] = [];

  try {
    const storage = await getStorage();
    const rows = await storage.getRecentNotices(Date.now());
    items = rows.map((r) => ({ linkId: r.linkId, title: r.title, url: r.url }));
  } catch {
    items = [];
  }

  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
