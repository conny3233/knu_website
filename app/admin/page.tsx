import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { adminEnabled, isAdminSession } from "@/lib/admin/auth";
import { githubEnabled } from "@/lib/admin/github";
import { LINKS } from "@/lib/links/data";

export const metadata: Metadata = {
  title: "제보 관리",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * 제보받은 링크를 모아 보고, 생존을 확인하고, GitHub에 바로 커밋하거나
 * lib/links/data.ts에 붙여넣을 TS 코드로 내보내는 화면.
 * ADMIN_SECRET이 없으면 존재 자체를 감춘다.
 */
export default async function AdminPage() {
  if (!adminEnabled()) notFound();

  const authed = await isAdminSession();
  if (!authed) return <AdminLogin />;

  const existingIds = LINKS.map((l) => l.id);
  return <AdminDashboard existingIds={existingIds} githubEnabled={githubEnabled()} />;
}
