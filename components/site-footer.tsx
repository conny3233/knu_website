import { CheomseongdaeMark } from "@/components/cheomseongdae-mark";
import { LINKS } from "@/lib/links/data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule bg-paper-sunk">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2.5">
              <CheomseongdaeMark className="size-7 text-knu-red" />
              <span className="text-base font-bold lowercase">knu 링크 허브</span>
            </div>
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
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-6 text-[0.6875rem] text-knu-gray sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono tracking-[0.04em]">
            {LINKS.length} links · unofficial · not affiliated with knu
          </p>
          <p>
            로고와 상징은 경북대학교 CI를 참고해 직접 그린 모티프이며, 공식
            로고 자산이 아닙니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
