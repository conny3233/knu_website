<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 경북대 링크 허브 — 지켜야 할 것들

## 1. 링크 렌더링 경로는 DB를 참조하지 않는다

이 프로젝트의 유일한 구조적 불변식이다.

`app/page.tsx`와 그 아래 서버 컴포넌트는 `lib/links/data.ts`만 읽는다.
`lib/db/`를 import 하는 순간 이 규칙이 깨진다. 통계·제보는 전부 클라이언트
컴포넌트가 `/api/*`를 호출해서 가져오고, 실패하면 그 구획만 사라진다.

`lib/db/index.ts`는 Turso(`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`이 있으면) → SQLite →
`NullAdapter` 순으로 떨어진다. 배포처는 Vercel + Turso로 결정했다(README 참고).
어댑터의 어떤 메서드도 예외를 던지지 않으며, 전부 `Promise`를 돌려준다
(Turso가 네트워크 호출이라 인터페이스 전체가 비동기다).

**확인법**: `data/knu.db`를 지우고 홈을 새로고침한다. 링크 50개·검색·즐겨찾기가
그대로여야 하고, "많이 찾는 링크" 구획만 사라져야 한다.

## 2. `lib/search/rank.ts`에 런타임 import를 넣지 말 것

`node --test`가 이 파일을 번들러 없이 그대로 실행한다. `import type`만 허용된다
(타입 import는 실행 시점에 지워진다). 그래서 `hostname()`이 `lib/links/url.ts`와
중복돼 있는데, 이건 의도된 것이다.

## 3. Tailwind v4 — `tailwind.config.ts`를 만들지 말 것

설정의 출처는 `app/globals.css`의 `@theme` 블록이다.

- 한글에 `meta`(IBM Plex Mono) 유틸리티를 걸지 말 것. 한글 글리프가 없어서
  대체 서체로 떨어지고 자간이 벌어진다. 한글 소형 라벨은 `label-ko`를 쓴다.
- `:focus-visible` 규칙은 반드시 `@layer base` 안에 둘 것. 레이어 밖에 두면
  `outline-none` 같은 유틸리티를 항상 이겨서 지울 수 없는 붉은 테가 남는다.
- `transition-colors`는 `outline-color`까지 포함한다. 포커스 링이 서서히
  물드는 게 싫으면 전이 대상을 좁혀라(`transition-[color]`).
- 스크롤 리빌 `data-fx`는 **서버가 그리는 정적 섹션에만** 붙인다.
  `ScrollFx`가 마운트 시점에 한 번만 관찰 대상을 수집하므로, fetch 뒤에
  나타나는 클라이언트 구획(PopularLinks·PinnedRows)에 붙이면 영영 숨는다.
  내용을 숨기는 CSS는 `html.js` 게이트 뒤에 있다 — JS가 없으면 전부 보인다.

## 4. 테스트는 `.ts` 확장자로 import 한다

`node --test`는 ESM 해석이라 확장자를 요구한다. 테스트 파일에서만
`import { rankLinks } from './rank.ts'` 처럼 쓴다
(`tsconfig.json`의 `allowImportingTsExtensions`). 앱 코드는 `@/lib/search/rank`.

## 5. 링크 데이터

- **접속을 확인한 URL만** `lib/links/data.ts`에 넣는다. 추측 금지.
- `id`는 클릭 통계의 키다. **절대 바꾸지 않는다.**
- 헬스체크에서 **5xx는 DOWN이 아니다.** `sugang`·`knuin`·`oz`는 봇 요청에
  500을 돌려주지만 살아 있다. `certpia`·`toegye`·`cmri`는 인증서 문제
  (이름 불일치 또는 만료)다. 이 여섯 곳에는 `healthException`이 붙어 있다.
- 일부 부설연구소(`sei`·`riss`·`care`·`msrc`·`nrs`·`a3di`)는 https 자체가
  응답하지 않아 `url`이 `http://`로 등록돼 있다. 인증서 문제가 아니라
  TLS를 아예 서비스하지 않는 것이라 `healthException`과는 다른 케이스다.

## 6. 명령

```bash
npm run check        # 타입 + 린트 + 단위 테스트
npm run healthcheck  # 링크 137개 생존 확인
```
