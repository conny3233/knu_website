import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import { PaletteProvider } from "@/components/palette-provider";
import { ScrollFx } from "@/components/scroll-fx";
import "./globals.css";

/* 공식 지정서체 윤고딕540의 무료 대체 (OFL) */
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

/* 표제 숫자·영문. 학술지의 결 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

/* 공식 지정서체 DIN-Regular이 상용이라, 엔지니어링 결을 이쪽으로 잇는다 */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "경북대 링크 허브 — 흩어진 링크를 한 곳에",
    template: "%s · 경북대 링크 허브",
  },
  description:
    "수강신청, LMS, 도서관, 통합정보시스템, 단과대학, 부설연구소까지. 경북대학교 관련 사이트 136곳을 검색 한 번으로 찾습니다.",
  keywords: [
    "경북대",
    "경북대학교",
    "KNU",
    "수강신청",
    "LMS",
    "통합정보시스템",
    "중앙도서관",
    "바로가기",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "경북대 링크 허브",
    description: "경북대학교 관련 사이트 136곳을 검색 한 번으로.",
    siteName: "경북대 링크 허브",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#e60000",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {/*
          첫 페인트 전에 html.js 를 켠다. 스크롤 리빌(.fx)은 이 클래스가
          있을 때만 내용을 숨기므로, JS가 없는 환경에서는 전부 그냥 보인다.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("IntersectionObserver" in window)document.documentElement.classList.add("js")`,
          }}
        />
        {/* 첨성대 상단의 정자석(井字石)처럼, 붉은 띠가 지면을 인다 */}
        <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px] bg-knu-red" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          본문으로 건너뛰기
        </a>
        <ScrollFx />
        <PaletteProvider>{children}</PaletteProvider>
      </body>
    </html>
  );
}
