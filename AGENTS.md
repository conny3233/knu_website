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

**확인법**: `data/knu.db`를 지우고 홈을 새로고침한다. 링크 227개·검색·즐겨찾기가
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
- `department`(학과·전공) 91개는 단과대학 홈페이지에서 링크를 열거해
  전부 curl로 생존 확인한 뒤 넣었다(`dept-<slug>` id). 대부분
  `home.knu.ac.kr/HOME/<code>`를 프레임으로 감싼 학과 도메인이다.
  BK21 사업단·개인 연구실·영문 미러·동창회는 의도적으로 제외했다 —
  일반 학생의 목적지가 아니거나 수명이 짧다. 24개를 넘겨 `LinkIndex`
  (목차식)로 렌더된다.

## 6. 공지사항 감시 (`lib/notices/`)

`lib/notices/sources.ts`에 등록된 사이트만 감시한다. **전체가 아니다.**
227개 중 대부분(포털·수강신청·통합정보시스템·웹메일·LMS 등)은 로그인
게이트 뒤에 있어 비로그인으로는 공지 목록 자체를 볼 수 없고, 도서관·챗봇은
SPA라 서버 렌더링된 HTML이 없다. 지금은 `knu-main`·`knu-en` 둘뿐이다.

- 파서(`lib/notices/parse.ts`)는 정규식이다. 학교가 게시판 마크업을 바꾸면
  조용히 빈 배열을 돌려주게 되고, 그 실패는 cron 라우트가 삼킨다 — 배지
  하나가 안 뜨는 것이지 사이트가 죽는 게 아니다. 새 사이트를 추가할 땐
  실제 목록 페이지를 curl로 받아 마크업을 먼저 확인하고 정규식을 맞춘다.
- `/api/cron/check-notices`는 `CRON_SECRET` 환경변수가 있으면 그 값으로
  `Authorization: Bearer` 헤더를 검증한다. 로컬에서는 이 변수를 안 두는
  편이 curl로 바로 찔러보기 편하다.
- `vercel.json`의 cron 스케줄은 UTC 기준이다(`0 21 * * *` = KST 06:00).
  Vercel Hobby 플랜은 크론을 하루 1회로 제한한다.
- "새 글" 판정은 `NOTICE_NEW_WINDOW_MS`(`lib/db/adapter.ts`, 기본 3일) 이내에
  발견된 것만이다. 사용자별 열람 여부를 추적하지 않는다 — 로그인이 없는
  사이트라 "누가 봤는지"를 알 방법이 없다.

## 7. 제보 관리 (`/admin`)

`ADMIN_SECRET` 환경변수가 없으면 `/admin`은 `notFound()`다 — 기능 자체가 감춰진다.
있으면 비밀번호 로그인 뒤 대기 중인 제보를 보여준다(`lib/admin/auth.ts`,
`app/api/admin/*`, `components/admin/*`).

- 세션 쿠키는 비밀번호 원문이 아니라 `HMAC(ADMIN_SECRET, "admin-session")`이다.
  `ADMIN_SECRET`을 바꾸면 기존 로그인이 전부 자동으로 풀린다.
- URL 생존 확인 로직(`lib/health/probe.ts`)은 `scripts/healthcheck.ts`와
  공유한다. 판정 규칙(5xx=UP, TLS 오류=WARN)을 한 곳에서만 바꾸면 된다.
- `id`·`buildSnippet` 등 KnuLink 코드 생성 로직은 `lib/admin/snippet.ts`에 모아
  뒀다 — 미리보기("코드로 내보내기")와 자동 커밋이 같은 함수를 쓴다.
  `uniqueId()`가 기존 id와 겹치면 `-2`, `-3`…을 자동으로 붙이므로 충돌은
  구조적으로 나지 않는다(id는 클릭 통계의 키라 §5).

**GitHub 자동 반영** (`GITHUB_TOKEN` 환경변수, `lib/admin/github.ts`)

- `/admin`에서 제보를 선택해 "바로 반영"을 누르면 서버가 GitHub Contents API로
  `lib/links/data.ts`를 직접 읽어 새 항목을 끼워 넣고 `main`에 즉시 커밋한다.
  Vercel이 그 커밋을 자동 배포한다. `GITHUB_TOKEN`이 없으면 이 버튼은 아예
  숨고, "코드로 내보내기"(사람이 직접 붙여넣기)만 남는다 — 공개 웹 화면이
  저장소 쓰기 토큰을 못 쥔 채로도 항상 동작해야 한다.
- **`GITHUB_TOKEN`은 반드시 이 저장소 하나만 건드릴 수 있는 fine-grained PAT**여야
  한다(Contents: Read and write만, 다른 권한·저장소는 전부 제외). 비밀번호로
  보호돼 있다지만 공개 웹 화면이 쥔 토큰이라, 새는 경우의 피해 범위를 의도적으로
  이 저장소로 좁혀 둔 것이다.
- 자동 커밋 경로엔 사람이 검토하는 눈이 없으므로, `/api/admin/commit`이 대신
  `lib/health/probe.ts`로 각 URL을 다시 확인해 응답 없는 것은 걸러내고 산 것만
  커밋한다(§5 "접속을 확인한 URL만" 원칙을 자동화 안에서도 지키는 장치).
  일부만 죽었으면 나머지만 커밋되고, 죽은 것은 대기중 목록에 그대로 남는다.
- 그래도 `campus`(기본 `"both"`)와 `keywords`(빈 배열)는 커밋 후 사람이 데이터를
  더 다듬고 싶으면 별도로 고쳐야 한다 — 제보자가 알 수 없는 정보라 자동화 대상이
  아니다.

## 8. 명령

```bash
npm run check        # 타입 + 린트 + 단위 테스트
npm run healthcheck  # 링크 227개 생존 확인
```
