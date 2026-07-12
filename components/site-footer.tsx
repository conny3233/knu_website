import { Hobanu, KnuSignature } from "@/components/knu-mark";
import { LINKS } from "@/lib/links/data";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-rule bg-paper-sunk">
      {/* 호반우가 오른쪽 아래에서 지면을 딛는다 — 스크롤로 나타난다 */}
      <div
        aria-hidden
        data-fx
        className="pointer-events-none absolute right-3 bottom-0 hidden w-24 opacity-90 md:block lg:right-8 lg:w-28"
      >
        <Hobanu className="h-auto w-full" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-3">
            <KnuSignature className="h-7 w-auto" />
            <p className="text-[0.8125rem] leading-relaxed text-muted">
              경북대학교 관련 사이트 {LINKS.length}곳을 모았습니다. 학생이 만든
              비공식 사이트이며, 대학의 공식 서비스가 아닙니다. 모든 링크는 각
              기관의 공식 주소로 바로 이어집니다.
            </p>
          </div>

          <div className="space-y-3 text-[0.8125rem]">
            <p className="label-ko text-knu-gray">바로가기</p>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://www.knu.ac.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition-colors hover:text-knu-red-ink"
                >
                  경북대학교 공식 홈페이지
                </a>
              </li>
              <li>
                <a
                  href="#submit"
                  className="text-muted transition-colors hover:text-knu-red-ink"
                >
                  빠진 링크 제보하기
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/conny3233"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition-colors hover:text-knu-red-ink"
                >
                  GitHub — 만든 사람
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/conny3233/knu_website#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition-colors hover:text-knu-red-ink"
                >
                  이 사이트는 어떻게 만들어졌나요?
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-6 text-[0.6875rem] text-knu-gray sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono tracking-[0.04em]">
            {LINKS.length} links · unofficial ·{" "}
            <a
              href="https://github.com/conny3233"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 align-baseline transition-colors hover:text-knu-red-ink"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-3 fill-current"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              conny3233
            </a>
          </p>
          <p className="max-w-md sm:text-right md:max-w-sm md:pr-32">
            교표·워드마크·마스코트(호반우)는 경북대학교 공식 UI 자산입니다.
            이 사이트는 학생이 만든 비공식 서비스로 대학과 무관합니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
