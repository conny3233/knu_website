import type { Category, CategoryMeta } from "./types";

/**
 * Record<Category, …> 라서, Category에 새 값을 더하면
 * 여기 라벨을 채우기 전까지 컴파일이 통과하지 않는다.
 */
export const CATEGORIES: Record<Category, CategoryMeta> = {
  core: {
    label: "핵심 시스템",
    blurb: "수강신청부터 증명발급까지, 매 학기 반드시 들르는 곳",
    order: 1,
  },
  learning: {
    label: "수업 · 학습",
    blurb: "강의 자료와 과제가 오가는 자리",
    order: 2,
  },
  library: {
    label: "도서관 · 학술",
    blurb: "자료를 찾고 자리를 잡는 곳",
    order: 3,
  },
  support: {
    label: "학생 지원",
    blurb: "장학금, 생활관, 진로와 취업",
    order: 4,
  },
  college: {
    label: "단과대학",
    blurb: "약칭이 제각각이라 가장 찾기 어려운 링크들",
    order: 5,
  },
  department: {
    label: "학과 · 전공",
    blurb: "학부·학과 홈페이지. 주소가 학과 이름과 무관한 곳이 많다",
    order: 6,
  },
  admission: {
    label: "입학 · 대학원 · 국제",
    blurb: "들어오는 길과 넓히는 길",
    order: 7,
  },
  institute: {
    label: "부속 · 지원기관",
    blurb: "정보화본부, 산학협력단, 그 밖의 살림",
    order: 8,
  },
  hospital: {
    label: "부속병원",
    blurb: "별도 법인이라 도메인부터 다르다",
    order: 9,
  },
  media: {
    label: "언론 · 소셜",
    blurb: "학내 소식이 흐르는 통로",
    order: 10,
  },
};

/** 섹션 렌더 순서 */
export const CATEGORY_ORDER: readonly Category[] = (
  Object.keys(CATEGORIES) as Category[]
).sort((a, b) => CATEGORIES[a].order - CATEGORIES[b].order);

export const CAMPUS_LABEL = {
  both: "공통",
  daegu: "대구",
  sangju: "상주",
} as const;

/**
 * 헬스체크 예외를 사람 말로. 카드의 배지 툴팁에 그대로 쓴다.
 * "링크가 깨졌다"가 아니라 "이렇게 보일 수 있다"를 알려주는 것이 목적.
 */
export const HEALTH_NOTE = {
  "blocks-bots":
    "자동 점검 도구에는 오류를 돌려주지만 브라우저에서는 정상 접속됩니다.",
  "tls-mismatch":
    "보안 인증서의 이름이 주소와 달라 경고가 뜰 수 있습니다. 사이트 자체는 정상입니다.",
} as const;
