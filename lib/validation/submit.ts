import { z } from "zod";
import type { Category } from "@/lib/links/types";

/**
 * 제보 폼의 검증 규칙. 클라이언트와 서버가 같은 것을 쓴다.
 * 클라이언트 검증은 친절이고, 서버 검증이 신뢰 경계다.
 */

const CATEGORY_VALUES = [
  "core",
  "learning",
  "library",
  "admission",
  "college",
  "department",
  "support",
  "institute",
  "hospital",
  "media",
] as const satisfies readonly Category[];

/**
 * 도메인은 더 이상 제한하지 않는다 — 경북대와 직접 관련 없는 학생 단체·동아리
 * 사이트도 제보받기 위해서다. 대신 실제 반영은 관리자가 /admin에서 직접
 * 검토·승인해야만 일어난다(lib/admin/commit). 프로토콜만 http(s)로 제한해
 * javascript:·data: 같은 스킴은 막는다.
 */
export function isAllowedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return url.protocol === "https:" || url.protocol === "http:";
}

/**
 * 사람이 채우는 칸.
 *
 * 메시지를 전부 우리말로 적어 둔 이유: 실패 메시지가 그대로 사용자에게 간다.
 * 하나라도 비워 두면 zod 의 영어 원문("Invalid option: expected one of …")이
 * 화면에 튀어나온다.
 *
 * 봇 함정(허니팟·작성 시간)은 일부러 여기 두지 않는다. 그것들은 검증 실패가
 * 아니라 "조용히 흘려보낼 신호"이고, 스키마에 섞으면 400과 함께 탐지 사실을
 * 봇에게 알려주게 된다. app/api/submit/route.ts 에서 따로 읽는다.
 */
export const submissionFields = z.object({
  name: z
    .string({ error: "사이트 이름을 적어주세요." })
    .trim()
    .min(2, "사이트 이름을 2자 이상 적어주세요.")
    .max(60, "이름이 너무 깁니다."),
  url: z
    .url({ error: "주소 형식이 올바르지 않습니다." })
    .max(300, "주소가 너무 깁니다.")
    .refine(isAllowedUrl, "http:// 또는 https:// 주소만 받습니다."),
  category: z.enum(CATEGORY_VALUES, { error: "분류를 선택해주세요." }),
  note: z.string().trim().max(300, "설명이 너무 깁니다.").optional(),
});

export type SubmissionFields = z.infer<typeof submissionFields>;

/** 사람이 이 폼을 채우는 데 필요한 최소 시간 */
export const MIN_ELAPSED_MS = 2_000;

export const CATEGORY_VALUE_LIST: readonly Category[] = CATEGORY_VALUES;
