/**
 * 클릭 한 건을 서버에 흘려보낸다. 결과를 기다리지 않고, 실패해도 알리지 않는다.
 *
 * sendBeacon 은 페이지가 떠나는 중에도 전송을 보장한다. 다만 Content-Type을
 * 마음대로 정할 수 없어 text/plain 으로 나가므로, 서버는 본문을 text로 받아
 * 직접 JSON.parse 한다. (app/api/click/route.ts)
 */
export function trackClick(linkId: string): void {
  const payload = JSON.stringify({ id: linkId });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon("/api/click", blob)) return;
    }

    // sendBeacon이 없거나 큐가 가득 찼을 때
    void fetch("/api/click", {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    }).catch(() => {});
  } catch {
    // 통계는 있으면 좋은 것이다. 없다고 이동을 막을 이유는 없다.
  }
}
