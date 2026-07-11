import { probeUrl, type Verdict } from "../lib/health/probe.ts";
import { LINKS } from "../lib/links/data.ts";
import type { KnuLink } from "../lib/links/types.ts";

/**
 * 링크 50개가 아직 살아 있는지 확인한다.  `npm run healthcheck`
 *
 * 판정 규칙 — 이 스크립트의 존재 이유다.
 *
 *   HTTP 응답을 받았다 (2xx·3xx·4xx·5xx 무관)  → UP
 *   TLS 인증서가 어긋났다                       → WARN
 *   DNS 실패 / 연결 거부 / 타임아웃              → DOWN
 *
 * **5xx는 절대 DOWN이 아니다.** 서버가 무언가를 돌려줬다는 것은 서버가 살아
 * 있다는 뜻이다. 실제로 sugang·knuin·oz 는 브라우저가 아닌 요청에 500을
 * 돌려주지만 멀쩡히 서비스 중이다. "5xx = 죽은 링크"로 판정하면 이 셋을
 * 매번 오탐한다.
 *
 * data.ts 에 `healthException` 이 적힌 링크는 그 사정을 이미 아는 것이므로
 * 경고를 억누른다. 반대로, 예외가 적혀 있는데 멀쩡해졌다면 그것도 알려준다 —
 * 학교가 고쳤다는 뜻이고, 그러면 데이터에서 예외를 지워야 한다.
 */

interface Result {
  link: KnuLink;
  verdict: Verdict;
  detail: string;
  /** 데이터의 healthException 이 이 결과를 설명하는가 */
  expected: boolean;
}

const CONCURRENCY = 8;

const RED = "[31m";
const DIM = "[2m";
const RESET = "[0m";

const SIGIL: Record<Verdict, string> = { up: "✓", warn: "!", down: "✗" };

async function probe(link: KnuLink): Promise<Result> {
  const { verdict, detail } = await probeUrl(link.url);

  if (verdict === "up") {
    // 응답이 왔다. 상태 코드가 무엇이든 서버는 살아 있다.
    const serverError = detail.startsWith("HTTP 5");
    return {
      link,
      verdict,
      detail,
      expected: !serverError || link.healthException === "blocks-bots",
    };
  }
  if (verdict === "warn") {
    return { link, verdict, detail, expected: link.healthException === "tls-mismatch" };
  }
  return { link, verdict, detail, expected: false };
}

/** 학교 서버를 한꺼번에 두드리지 않는다 */
async function inBatches<T, R>(
  items: readonly T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return results;
}

async function main(): Promise<void> {
  console.log(`경북대 링크 ${LINKS.length}개를 확인합니다…\n`);

  const results = await inBatches(LINKS, CONCURRENCY, probe);

  for (const r of results) {
    // 5xx인데 UP으로 넘어간 것은 이유를 밝혀 준다. 안 그러면 오탐처럼 보인다.
    const needsNote = r.expected && (r.verdict !== "up" || r.detail.startsWith("HTTP 5"));
    const suffix = needsNote ? `${DIM} (알려진 예외 · 봇 차단/인증서)${RESET}` : "";
    const line = `${SIGIL[r.verdict]} ${r.link.id.padEnd(22)} ${r.detail}${suffix}`;
    const surprising = !r.expected;
    console.log(surprising ? `${RED}${line}${RESET}` : line);
  }

  const down = results.filter((r) => r.verdict === "down");
  const warn = results.filter((r) => r.verdict === "warn");
  const up = results.filter((r) => r.verdict === "up");

  console.log(`\n── UP ${up.length} · WARN ${warn.length} · DOWN ${down.length} ──`);

  // 예외를 적어 뒀는데 이제 멀쩡한 링크. data.ts 에서 healthException 을 지울 때가 됐다.
  const healed = results.filter(
    (r) =>
      r.link.healthException &&
      r.verdict === "up" &&
      !r.detail.startsWith("HTTP 5"),
  );
  if (healed.length > 0) {
    console.log(
      "\n예외 표시가 붙어 있으나 정상 응답합니다. data.ts 의 healthException 을 지워도 됩니다:",
    );
    for (const r of healed) console.log(`  · ${r.link.id} (${r.detail})`);
  }

  // 예상하지 못한 것만 실패로 친다
  const unexpected = [...down, ...warn.filter((r) => !r.expected)];
  if (unexpected.length > 0) {
    console.error(`\n확인이 필요한 링크 ${unexpected.length}개:`);
    for (const r of unexpected) {
      console.error(`  · ${r.link.id} — ${r.link.url} — ${r.detail}`);
    }
    process.exitCode = 1;
  }
}

await main();
