import { getStorage } from "@/lib/db";
import { LINK_BY_ID } from "@/lib/links/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOP_N = 6;

/**
 * 많이 눌린 링크. 저장소가 없으면 빈 목록을 돌려주고, 화면은 그 구획을 통째로 감춘다.
 */
export async function GET(): Promise<Response> {
  let items: { id: string; name: string; url: string; count: number }[] = [];

  try {
    const storage = await getStorage();
    const popular = await storage.getPopular(TOP_N);
    items = popular
      // 데이터에서 링크를 빼도 옛 통계 행 때문에 깨지지 않도록 거른다
      .flatMap((row) => {
        const link = LINK_BY_ID.get(row.linkId);
        return link
          ? [{ id: link.id, name: link.name, url: link.url, count: row.count }]
          : [];
      });
  } catch {
    items = [];
  }

  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
