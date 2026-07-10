import { getStorage } from "@/lib/db";
import { LINK_BY_ID } from "@/lib/links/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 클릭 한 건을 센다.
 *
 * navigator.sendBeacon 은 Content-Type 을 정할 수 없어 본문이 text/plain 으로
 * 온다. 그래서 req.json() 이 아니라 req.text() 로 받아 직접 파싱한다.
 *
 * 무슨 일이 있어도 204를 돌려준다. 사용자는 이미 다른 사이트로 떠나는 중이고,
 * 여기서 에러를 내봐야 아무도 보지 못한다.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = JSON.parse(await request.text());
    const id =
      typeof body === "object" && body !== null && "id" in body
        ? (body as { id: unknown }).id
        : undefined;

    // 우리가 아는 링크만 센다. 모르는 id로 테이블을 부풀리게 두지 않는다.
    if (typeof id === "string" && LINK_BY_ID.has(id)) {
      const storage = await getStorage();
      await storage.recordClick(id);
    }
  } catch {
    // 본문이 망가졌거나 저장소가 없다. 어느 쪽이든 조용히 지나간다.
  }

  return new Response(null, { status: 204 });
}
