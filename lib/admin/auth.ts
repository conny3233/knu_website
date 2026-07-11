import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 제보 관리(/admin)용 단일 비밀번호 인증.
 *
 * `CRON_SECRET`(app/api/cron/check-notices)과 같은 결 — 사용자가 하나뿐인
 * 도구에 계정 시스템을 두는 건 과하다. `ADMIN_SECRET`이 없으면 기능 자체가
 * 꺼진다(라우트는 401, 페이지는 notFound).
 *
 * 세션 쿠키에는 비밀번호 원문 대신 HMAC 서명만 담는다. `ADMIN_SECRET`을
 * 바꾸면 기존 쿠키가 전부 자동으로 무효화되므로 별도 세션 저장소가 필요 없다.
 */

const COOKIE_NAME = "knu_admin";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7일

function sign(secret: string): string {
  return createHmac("sha256", secret).update("admin-session").digest("hex");
}

/** 길이가 달라도 타이밍 차이가 나지 않도록 먼저 고정 길이로 해시한다 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = createHash("sha256").update(a).digest();
  const bufB = createHash("sha256").update(b).digest();
  return timingSafeEqual(bufA, bufB);
}

/** ADMIN_SECRET 환경변수가 설정돼 있는가. 없으면 관리자 기능 전체가 숨는다. */
export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_SECRET);
}

/** 로그인 폼에서 받은 값이 실제 비밀번호와 일치하는가 */
export function checkSecret(candidate: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return timingSafeStringEqual(candidate, secret);
}

/** 요청에 유효한 관리자 세션 쿠키가 있는가 */
export async function isAdminSession(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return timingSafeStringEqual(token, sign(secret));
}

/** 로그인 성공 후 세션 쿠키를 심는다. Route Handler에서만 호출 가능(쿠키 쓰기 제약) */
export async function setAdminSession(): Promise<void> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return;
  const store = await cookies();
  store.set(COOKIE_NAME, sign(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
