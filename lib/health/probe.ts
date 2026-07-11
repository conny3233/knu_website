/**
 * 임의 URL의 생존을 확인하는 판정 로직.
 *
 * `scripts/healthcheck.ts`(136→227개 링크 전수 점검)와 관리자 페이지의
 * 온디맨드 확인이 같은 규칙을 쓰도록 여기 하나로 모았다.
 *
 *   HTTP 응답을 받았다 (2xx·3xx·4xx·5xx 무관)  → up
 *   TLS 인증서가 어긋났다                       → warn
 *   DNS 실패 / 연결 거부 / 타임아웃              → down
 *
 * **5xx는 절대 down이 아니다.** 서버가 무언가를 돌려줬다는 것은 서버가 살아
 * 있다는 뜻이다(sugang·knuin·oz가 봇 요청에 500을 돌려주는 것처럼).
 * `healthException` 같은 데이터 쪽 예외 판단은 호출부(scripts/healthcheck.ts)의
 * 몫이고, 이 모듈은 순수하게 "지금 이 URL이 어떻게 응답하는가"만 본다.
 */

export type Verdict = "up" | "warn" | "down";

export interface ProbeResult {
  verdict: Verdict;
  detail: string;
}

const TIMEOUT_MS = 12_000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

/** fetch 가 던진 것이 인증서 문제인가. 원인은 error.cause 사슬 깊은 곳에 있다. */
export function isTlsError(error: unknown): boolean {
  const parts: string[] = [];
  let cursor: unknown = error;
  while (cursor instanceof Error) {
    parts.push(cursor.message, (cursor as { code?: string }).code ?? "");
    cursor = cursor.cause;
  }
  return /CERT|SSL|TLS|ALT_NAME|DEPTH_ZERO|self.signed/i.test(parts.join(" "));
}

export function failureReason(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") return "응답 없음 (타임아웃)";
    const code = (error.cause as { code?: string } | undefined)?.code;
    return code ?? error.message;
  }
  return String(error);
}

export async function probeUrl(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { verdict: "up", detail: `HTTP ${response.status}` };
  } catch (error) {
    if (isTlsError(error)) {
      return { verdict: "warn", detail: "TLS 인증서 불일치" };
    }
    return { verdict: "down", detail: failureReason(error) };
  }
}
