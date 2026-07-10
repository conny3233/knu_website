/**
 * 보여주기용 호스트명. "https://www.knuh.kr/" → "knuh.kr"
 *
 * 같은 함수가 lib/search/rank.ts 안에도 사본으로 있다. 랭커는 node --test 가
 * 그대로 실행할 수 있도록 런타임 import를 하나도 두지 않는다는 제약이 있어서다.
 * 네 줄짜리 중복이 그 제약을 지키는 값보다 싸다.
 */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
