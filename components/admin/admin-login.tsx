"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (response.ok) {
        // 서버 컴포넌트(app/admin/page.tsx)를 다시 렌더시켜 쿠키를 반영한다
        router.refresh();
      } else {
        const body: { error?: string } = await response.json().catch(() => ({}));
        setError(body.error ?? "로그인에 실패했습니다.");
        setPending(false);
      }
    } catch {
      setError("네트워크에 문제가 있습니다.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-lg font-bold">제보 관리</h1>
      <p className="mb-6 text-[0.8125rem] text-muted">비밀번호를 입력하세요.</p>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-knu-red"
        />
        <button
          type="submit"
          disabled={pending || secret.length === 0}
          className="w-full cursor-pointer bg-knu-red px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-knu-red-deep disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "확인 중…" : "로그인"}
        </button>
        {error && (
          <p role="alert" className="text-[0.8125rem] text-knu-red-ink">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
