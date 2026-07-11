"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/links/categories";
import type { Category } from "@/lib/links/types";
import type { SubmissionRow, SubmissionStatus } from "@/lib/db/adapter";
import { buildSnippet } from "@/lib/admin/snippet";

const TABS: { value: SubmissionStatus; label: string }[] = [
  { value: "pending", label: "대기중" },
  { value: "done", label: "완료" },
  { value: "rejected", label: "반려" },
];

type HealthState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "done"; verdict: "up" | "warn" | "down"; detail: string };

const VERDICT_LABEL: Record<"up" | "warn" | "down", string> = {
  up: "생존",
  warn: "경고",
  down: "응답없음",
};

const VERDICT_CLASS: Record<"up" | "warn" | "down", string> = {
  up: "text-green-700",
  warn: "text-amber-700",
  down: "text-knu-red-ink",
};

type CommitState =
  | { kind: "idle" }
  | { kind: "committing" }
  | {
      kind: "done";
      commitSha: string;
      committedCount: number;
      skippedDead: { id: number; name: string; detail: string }[];
    }
  | { kind: "error"; message: string };

export function AdminDashboard({
  existingIds,
  githubEnabled,
}: {
  existingIds: readonly string[];
  githubEnabled: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<SubmissionStatus>("pending");
  const [items, setItems] = useState<SubmissionRow[]>([]);
  const [loadedTab, setLoadedTab] = useState<SubmissionStatus | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [health, setHealth] = useState<Map<number, HealthState>>(new Map());
  const [checkingAll, setCheckingAll] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("복사");
  const [commit, setCommit] = useState<CommitState>({ kind: "idle" });

  const loading = loadedTab !== tab;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/submissions?status=${tab}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: SubmissionRow[] }) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setLoadedTab(tab);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setLoadedTab(tab);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  function switchTab(next: SubmissionStatus) {
    setTab(next);
    setSelected(new Set());
    setSnippet(null);
    setCommit({ kind: "idle" });
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  }

  async function checkAllHealth() {
    setCheckingAll(true);
    for (const item of items) {
      setHealth((prev) => new Map(prev).set(item.id, { kind: "checking" }));
      try {
        const res = await fetch("/api/admin/healthcheck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
        });
        const body: { verdict?: "up" | "warn" | "down"; detail?: string } = res.ok
          ? await res.json()
          : {};
        setHealth((prev) =>
          new Map(prev).set(item.id, {
            kind: "done",
            verdict: body.verdict ?? "down",
            detail: body.detail ?? "확인 실패",
          }),
        );
      } catch {
        setHealth((prev) =>
          new Map(prev).set(item.id, { kind: "done", verdict: "down", detail: "확인 실패" }),
        );
      }
    }
    setCheckingAll(false);
  }

  async function updateStatus(ids: number[], status: SubmissionStatus) {
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/submissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      ),
    );
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }

  function exportSelected() {
    const rows = items.filter((item) => selected.has(item.id));
    setSnippet(buildSnippet(rows, existingIds));
    setCopyLabel("복사");
  }

  async function copySnippet() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyLabel("복사됨");
      setTimeout(() => setCopyLabel("복사"), 1500);
    } catch {
      setCopyLabel("복사 실패");
    }
  }

  async function autoCommit() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setCommit({ kind: "committing" });
    try {
      const res = await fetch("/api/admin/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data: {
        ok?: boolean;
        error?: string;
        commitSha?: string;
        committed?: number[];
        skippedDead?: { id: number; name: string; detail: string }[];
      } = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        const committed = data.committed ?? [];
        setCommit({
          kind: "done",
          commitSha: data.commitSha ?? "",
          committedCount: committed.length,
          skippedDead: data.skippedDead ?? [],
        });
        setItems((prev) => prev.filter((item) => !committed.includes(item.id)));
        setSelected((prev) => {
          const next = new Set(prev);
          for (const id of committed) next.delete(id);
          return next;
        });
      } else {
        setCommit({ kind: "error", message: data.error ?? "반영에 실패했습니다." });
      }
    } catch {
      setCommit({ kind: "error", message: "네트워크에 문제가 있습니다." });
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold">제보 관리</h1>
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer text-[0.8125rem] text-muted transition-colors hover:text-knu-red-ink"
        >
          로그아웃
        </button>
      </div>

      <div className="mb-5 flex gap-1 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => switchTab(t.value)}
            className={`cursor-pointer border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.value
                ? "border-knu-red font-medium text-knu-red-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">
          {tab === "pending" ? "대기 중인 제보가 없습니다." : "항목이 없습니다."}
        </p>
      ) : (
        <>
          {tab === "pending" && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={checkAllHealth}
                disabled={checkingAll}
                className="cursor-pointer border border-rule px-3 py-1.5 text-[0.8125rem] transition-colors hover:border-knu-red-ink hover:text-knu-red-ink disabled:cursor-wait disabled:opacity-60"
              >
                {checkingAll ? "확인 중…" : "전체 생존 확인"}
              </button>
              {githubEnabled ? (
                <button
                  type="button"
                  onClick={autoCommit}
                  disabled={selected.size === 0 || commit.kind === "committing"}
                  className="cursor-pointer bg-knu-red px-3 py-1.5 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-knu-red-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {commit.kind === "committing"
                    ? "반영 중…"
                    : `선택 ${selected.size}건 바로 반영`}
                </button>
              ) : null}
              <button
                type="button"
                onClick={exportSelected}
                disabled={selected.size === 0}
                className={
                  githubEnabled
                    ? "cursor-pointer border border-rule px-3 py-1.5 text-[0.8125rem] transition-colors hover:border-knu-red-ink hover:text-knu-red-ink disabled:cursor-not-allowed disabled:opacity-40"
                    : "cursor-pointer bg-knu-red px-3 py-1.5 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-knu-red-deep disabled:cursor-not-allowed disabled:opacity-40"
                }
              >
                선택 {selected.size}건 코드로 내보내기
              </button>
              <button
                type="button"
                onClick={() => updateStatus([...selected], "done")}
                disabled={selected.size === 0}
                className="cursor-pointer border border-rule px-3 py-1.5 text-[0.8125rem] transition-colors hover:border-knu-red-ink hover:text-knu-red-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                완료로 표시
              </button>
              <button
                type="button"
                onClick={() => updateStatus([...selected], "rejected")}
                disabled={selected.size === 0}
                className="cursor-pointer border border-rule px-3 py-1.5 text-[0.8125rem] text-muted transition-colors hover:border-knu-red-ink hover:text-knu-red-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                반려
              </button>
            </div>
          )}

          <div className="overflow-x-auto border border-rule">
            <table className="w-full text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-rule bg-paper-sunk">
                  {tab === "pending" && (
                    <th className="w-8 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.size === items.length}
                        onChange={toggleAll}
                        aria-label="전체 선택"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 font-medium">이름</th>
                  <th className="px-3 py-2 font-medium">주소</th>
                  <th className="px-3 py-2 font-medium">분류</th>
                  <th className="px-3 py-2 font-medium">설명</th>
                  <th className="px-3 py-2 font-medium">접수</th>
                  {tab === "pending" && <th className="px-3 py-2 font-medium">생존</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const h = health.get(item.id);
                  return (
                    <tr key={item.id} className="border-b border-rule last:border-b-0">
                      {tab === "pending" && (
                        <td className="px-3 py-2 align-top">
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggle(item.id)}
                            aria-label={`${item.name} 선택`}
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 align-top">{item.name}</td>
                      <td className="max-w-[16rem] px-3 py-2 align-top">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono break-all text-knu-red-ink hover:underline"
                        >
                          {item.url}
                        </a>
                      </td>
                      <td className="px-3 py-2 align-top text-muted">
                        {CATEGORIES[item.category as Category]?.label ?? item.category}
                      </td>
                      <td className="max-w-[14rem] px-3 py-2 align-top text-muted">
                        {item.note ?? "—"}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap text-muted">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      {tab === "pending" && (
                        <td className="px-3 py-2 align-top whitespace-nowrap">
                          {!h || h.kind === "idle" ? (
                            <span className="text-muted">—</span>
                          ) : h.kind === "checking" ? (
                            <span className="text-muted">확인 중…</span>
                          ) : (
                            <span className={VERDICT_CLASS[h.verdict]} title={h.detail}>
                              {VERDICT_LABEL[h.verdict]}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {commit.kind === "done" && (
        <div className="mt-6 space-y-1.5 border border-rule border-l-2 border-l-knu-red bg-paper p-4 text-[0.8125rem]">
          <p className="font-medium text-ink">
            {commit.committedCount}건을 main에 커밋했습니다.{" "}
            {commit.commitSha && (
              <a
                href={`https://github.com/conny3233/knu_website/commit/${commit.commitSha}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-knu-red-ink hover:underline"
              >
                {commit.commitSha.slice(0, 7)}
              </a>
            )}
          </p>
          <p className="text-muted">Vercel이 몇 분 내로 자동 재배포합니다.</p>
          {commit.skippedDead.length > 0 && (
            <p className="text-knu-red-ink">
              응답 없어서 건너뛴 항목: {commit.skippedDead.map((d) => d.name).join(", ")}
              (대기중 목록에 그대로 남아있습니다)
            </p>
          )}
        </div>
      )}

      {commit.kind === "error" && (
        <div className="mt-6 border border-rule border-l-2 border-l-knu-red bg-paper p-4 text-[0.8125rem] text-knu-red-ink">
          {commit.message}
        </div>
      )}

      {snippet && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              lib/links/data.ts 에 붙여넣을 코드
            </h2>
            <button
              type="button"
              onClick={copySnippet}
              className="cursor-pointer border border-rule px-3 py-1 text-[0.8125rem] transition-colors hover:border-knu-red-ink hover:text-knu-red-ink"
            >
              {copyLabel}
            </button>
          </div>
          <textarea
            readOnly
            value={snippet}
            rows={Math.min(24, snippet.split("\n").length + 1)}
            className="w-full border border-rule bg-paper-sunk p-3 font-mono text-xs leading-relaxed"
            onFocus={(e) => e.currentTarget.select()}
          />
          <p className="text-[0.8125rem] text-muted">
            id·campus·keywords는 붙여넣기 전에 확인하세요. 붙여넣고 커밋한 뒤 위에서
            해당 항목을 &ldquo;완료로 표시&rdquo; 하면 목록에서 사라집니다.
          </p>
        </div>
      )}
    </main>
  );
}
