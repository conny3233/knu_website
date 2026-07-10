# 경북대 링크 허브

경북대학교 관련 사이트 137곳(핵심 시스템·단과대학·대학원·부설연구소 등)을 한 페이지에 모은 비공식 링크 허브.

수강신청은 `sugang`, 성적은 `knuin`, 강의는 `lms1`, 도서관은 `kudos`, 증명발급은 `certpia`.
경상대학은 `cec`, 사범대학은 `knutc`, 예술대학은 `mvarts`. 규칙이 없다.
그래서 매번 검색으로 찾아 들어가는 대신, 여기서 `⌘K` → `ㅅㄱㅅㅊ` → `Enter` 세 동작으로 간다.

```bash
npm install
npm run dev        # http://localhost:3000
```

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build && npm start` | 프로덕션 |
| `npm run check` | 타입 + 린트 + 단위 테스트 |
| `npm test` | 초성 검색 랭커 단위 테스트 |
| `npm run healthcheck` | 링크 137개가 살아 있는지 확인 |

## 구조

**링크 렌더링 경로는 데이터베이스를 참조하지 않는다.** 이게 이 프로젝트의 유일한 구조적 규칙이다.

```
app/page.tsx (서버 컴포넌트) ──→ lib/links/data.ts   137개 링크, 단일 진실 공급원
                                  DB 없음. 언제나 렌더된다.

components/popular-links.tsx ──→ GET  /api/stats  ─┐
components/tracked-link.tsx  ──→ POST /api/click  ─┼─→ StorageAdapter
components/submit-form.tsx   ──→ POST /api/submit ─┘        │
  (클라이언트 컴포넌트)                        TursoAdapter (Vercel) 우선
  실패하면 그 구획만 사라진다                    ↓ 없으면 SqliteAdapter (자체 호스팅)
                                                ↓ 그것도 안 되면
                                          NullAdapter (전부 no-op)
```

`data/knu.db`를 지워도, DB 초기화가 실패해도, 링크 목록·검색·즐겨찾기는 100% 동작한다.
어댑터의 모든 메서드는 예외를 던지지 않는다 — 읽기는 빈 배열, 쓰기는 실패를 조용히 돌려준다.
사라지는 것은 "많이 찾는 링크" 구획과 제보 기능뿐이다.

### 주요 파일

| 파일 | 역할 |
|---|---|
| `lib/links/data.ts` | 링크 137개. 실제로 접속을 확인한 URL만 넣는다. |
| `lib/links/types.ts` | `KnuLink` 타입. `Category`는 판별 유니온이라 카테고리를 추가하면 라벨 누락을 컴파일러가 잡는다. |
| `lib/search/rank.ts` | 초성 검색 랭커. 런타임 import가 하나도 없는 자기완결 모듈. |
| `lib/db/index.ts` | 어댑터 팩토리. graceful degradation이 보증되는 지점. |
| `scripts/healthcheck.ts` | 링크 생존 확인. 판정 규칙이 핵심이다(아래). |

## 링크를 추가하려면

`lib/links/data.ts`에 항목을 하나 더한다. 규칙은 네 가지다.

1. **접속을 확인한 URL만.** 있을 법한 주소를 추측해서 넣지 않는다.
2. **`id`는 절대 바꾸지 않는다.** 클릭 통계의 키다. 학교가 URL을 바꿔도 `id`는 그대로 둔다.
3. `keywords`에는 사람들이 실제로 칠 법한 말을 넣는다. 초성은 `name`과 `keywords`에서 자동으로 파생되므로 따로 적지 않는다.
4. 카테고리를 새로 만들면 `lib/links/categories.ts`가 컴파일 에러로 라벨을 요구한다.

## 헬스체크의 판정 규칙

`npm run healthcheck`가 하는 판정이다. 이 규칙이 이 스크립트의 존재 이유다.

```
HTTP 응답을 받았다 (2xx·3xx·4xx·5xx 무관)  → UP
TLS 인증서가 어긋났다                       → WARN
DNS 실패 / 연결 거부 / 타임아웃              → DOWN
```

**5xx는 DOWN이 아니다.** 서버가 무언가를 돌려줬다는 것은 서버가 살아 있다는 뜻이다.

실제로 `sugang`·`knuin`·`oz`는 브라우저가 아닌 요청에 HTTP 500을 돌려주지만 멀쩡히 서비스 중이고,
`certpia`는 CNAME이 `knu.certpia.com`이라 인증서 이름이 어긋난다.
"5xx = 죽은 링크"로 판정하면 이 넷을 매번 오탐한다.
그래서 이 링크들에는 `data.ts`에 `healthException`을 박아 두고, 헬스체크는 그 예외를 알고 넘어간다.

반대로 예외가 붙어 있는데 이제 정상 응답한다면 스크립트가 알려준다 — 학교가 고쳤다는 뜻이고, `healthException`을 지울 때다.

## 배포

**배포처: Vercel + Turso.** Next.js 배포의 사실상 표준이라 무료 티어·Git 푸시 자동 배포·프리뷰
환경·글로벌 CDN이 딸려 온다. 문제는 Vercel 서버리스가 파일시스템을 휘발시킨다는 것 — 그래서
`data/knu.db`가 유지되지 않는다. Turso(libSQL)는 SQLite와 SQL 방언이 호환되는 매니지드
서버리스 DB라서, `lib/db/turso-adapter.ts` 하나로 `StorageAdapter` 인터페이스를 그대로 구현했다.

### Vercel 설정

1. [turso.tech](https://turso.tech)에서 DB를 만들고 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`을 발급받는다.
2. Vercel 프로젝트 환경변수에 두 값을 등록한다.
3. 그걸로 끝이다. `lib/db/index.ts`가 두 값을 보고 자동으로 Turso 어댑터를 쓴다.

환경변수가 없거나 Turso 연결에 실패하면 SQLite로, SQLite도 열 수 없으면 `NullAdapter`로
조용히 떨어진다 — 어떤 경우든 링크 허브 본체(목록·검색·즐겨찾기)는 영향받지 않고,
사라지는 건 "많이 찾는 링크" 구획과 제보 기능뿐이다.

### 자체 호스팅을 원한다면

영속 볼륨이 있는 Node 런타임(Railway·Fly.io·VPS 등)이라면 Turso 없이도 `node:sqlite`가
그대로 동작한다. `TURSO_DATABASE_URL`을 설정하지 않으면 된다. DB 경로는 `KNU_DB_PATH`
환경변수로 옮길 수 있다(기본값 `data/knu.db`).

### 제보 검토

`submissions` 테이블에 `status='pending'`으로 쌓이기만 한다. 자동으로 게시되지 않는다. 검토는 직접 한다.

```bash
# SQLite (자체 호스팅)
sqlite3 data/knu.db "SELECT id, name, url, category, note FROM submissions WHERE status='pending';"

# Turso
turso db shell <db-이름> "SELECT id, name, url, category, note FROM submissions WHERE status='pending';"
```

## 만들면서 내린 선택

- **`node:sqlite`** (Node 24 내장). `better-sqlite3`는 네이티브 모듈이라 Windows에서 빌드 도구를 요구한다.
  아직 실험적 API라 실행할 때 경고가 한 줄 뜬다.
- **`node --test`가 TypeScript를 그대로 실행한다.** jest·vitest·tsx 전부 필요 없다.
  다만 `node --test`는 ESM 해석이라 확장자를 요구하므로 테스트 파일만 `./rank.ts`처럼 확장자를 적는다
  (`tsconfig.json`의 `allowImportingTsExtensions`).
- **검색 라이브러리를 쓰지 않는다.** 링크가 100여 개라 O(n) 스캔이 사실상 공짜고,
  범용 퍼지 검색기는 한글 초성을 모른다. 어차피 초성 문자열을 직접 만들어 먹여야 하므로,
  그럴 바에는 점수 체계 전체를 쥐는 편이 단순하다.
- **⌘K 팔레트는 `cmdk`를 쓰되 `shouldFilter={false}`로 필터링을 끈다.**
  포커스 트랩·`role=combobox`·키보드 내비게이션은 검증된 라이브러리에 맡기고,
  랭킹만 `lib/search/rank.ts`가 한다.
- **클릭 추적은 `onMouseDown` + `sendBeacon`.** `preventDefault`를 하지 않으므로 좌클릭·휠클릭·새 탭이
  전혀 방해받지 않는다. `sendBeacon`은 Content-Type을 정할 수 없어 본문이 `text/plain`으로 오므로,
  서버는 `req.text()`로 받아 직접 파싱한다.
- **즐겨찾기·최근 방문은 `useSyncExternalStore`.** 서버 스냅샷이 빈 배열이라 하이드레이션 불일치가 구조적으로 없다.

## 디자인

경북대 공식 CI는 CMYK와 Pantone만 공개하고 HEX는 공개하지 않는다. CMYK를 변환해 쓰되 역할별로 대비를 계산해 나눴다.

| 토큰 | HEX | 흰 배경 대비 | 용도 |
|---|---|---|---|
| `--color-knu-red` | `#E60000` | 4.61:1 | 브랜드 액센트, 대면적 |
| `--color-knu-red-ink` | `#B00000` | 7.07:1 (AAA) | 레드 텍스트·링크 |
| `--color-knu-gray` | `#797977` | 4.18:1 | **보더·큰 글자 전용.** 본문에 쓰면 AA 미달 |
| `--color-muted` | `#5C5650` | 6.94:1 | 보조 텍스트 |

공식 지정서체(윤고딕540 / DIN-Regular)는 둘 다 상용이라 쓸 수 없다.
국문은 **Pretendard**(OFL), 표제 숫자·영문은 **Newsreader**, 호스트명은 **IBM Plex Mono**가 맡는다.

로고는 공식 자산을 쓰지 않는다. 첨성대와 개교 당시 5개 단과대학·1개 대학원을 뜻하는 6개의 별을
원 안에 배치한 모티프를 직접 SVG로 그렸다(`components/cheomseongdae-mark.tsx`).

---

이 사이트는 학생이 만든 비공식 프로젝트이며 경북대학교의 공식 서비스가 아닙니다.
모든 링크는 각 기관의 공식 주소로 바로 이어집니다.
