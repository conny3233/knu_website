"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { CATEGORIES } from "@/lib/links/categories";
import { CATEGORY_VALUE_LIST, submissionFields } from "@/lib/validation/submit";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

const FIELD =
  "w-full border border-rule bg-paper px-3 py-2 text-sm outline-none transition-colors placeholder:text-knu-gray focus:border-knu-red";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="label-ko mb-1.5 block text-knu-gray">
      {children}
    </label>
  );
}

export function SubmitSection() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // 폼이 화면에 뜬 순간. 봇은 사람보다 훨씬 빨리 제출한다.
  // Date.now() 는 렌더 중에 부를 수 없으므로(순수하지 않다) 마운트 후에 적는다.
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const note = String(data.get("note") ?? "").trim();
    const candidate = {
      name: String(data.get("name") ?? ""),
      url: String(data.get("url") ?? ""),
      category: String(data.get("category") ?? ""),
      note: note || undefined,
    };

    // 서버에 가기 전에 같은 규칙으로 먼저 걸러 즉시 알려준다
    const parsed = submissionFields.safeParse(candidate);
    if (!parsed.success) {
      setStatus({
        kind: "error",
        message: parsed.error.issues[0]?.message ?? "입력을 확인해주세요.",
      });
      return;
    }

    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          homepage: String(data.get("homepage") ?? ""),
          elapsedMs: Date.now() - shownAt.current,
        }),
      });

      const body: { ok?: boolean; message?: string } = await response
        .json()
        .catch(() => ({}));

      if (response.ok && body.ok) {
        setStatus({ kind: "done", message: body.message ?? "고맙습니다." });
        form.reset();
      } else {
        // 실패해도 입력값은 그대로 둔다. 다시 치게 만들지 않는다.
        setStatus({
          kind: "error",
          message: body.message ?? "제보를 보내지 못했습니다.",
        });
      }
    } catch {
      setStatus({
        kind: "error",
        message: "네트워크에 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  }

  return (
    <section id="submit" data-fx className="scroll-mt-24 space-y-6" aria-labelledby="submit-title">
      <SectionHeader
        titleId="submit-title"
        mark="＋"
        title="빠진 링크 제보"
        blurb="검토 후 반영합니다"
      />

      <div className="border border-rule border-l-2 border-l-knu-red bg-paper p-5 sm:p-7">
        {status.kind === "done" ? (
          <div className="flex flex-col items-start gap-3 py-6">
            <p className="text-[0.9375rem] font-medium">{status.message}</p>
            <button
              type="button"
              onClick={() => {
                shownAt.current = Date.now();
                setStatus({ kind: "idle" });
              }}
              className="cursor-pointer border-b border-knu-red text-sm text-knu-red-ink transition-colors hover:border-knu-red-deep hover:text-knu-red-deep"
            >
              하나 더 제보하기
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="relative space-y-4">
            <p className="max-w-lg text-[0.8125rem] leading-relaxed text-muted">
              여기 없는 경북대 관련 사이트를 알고 계신가요? 검토 후 반영합니다.
            </p>

            {/*
              허니팟. 사람 눈과 스크린리더 모두에서 감춘다.
              display:none 대신 화면 밖으로 밀어낸다 — CSS를 읽는 봇이
              display:none 필드를 건너뛰기 때문이다. 클립과 오프스크린을
              함께 걸어 두어 둘 중 하나가 깨져도 노출되지 않게 한다.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 -left-[9999px] h-0 w-0 overflow-hidden"
            >
              <label htmlFor="homepage">이 칸은 비워두세요</label>
              <input
                id="homepage"
                name="homepage"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">사이트 이름</Label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={60}
                  placeholder="예: 공과대학 학생회"
                  className={FIELD}
                />
              </div>

              <div>
                <Label htmlFor="category">분류</Label>
                <select id="category" name="category" required defaultValue="" className={FIELD}>
                  <option value="" disabled>
                    선택해주세요
                  </option>
                  {CATEGORY_VALUE_LIST.map((value) => (
                    <option key={value} value={value}>
                      {CATEGORIES[value].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="url">주소</Label>
              <input
                id="url"
                name="url"
                type="url"
                required
                maxLength={300}
                placeholder="https://example.knu.ac.kr"
                className={`${FIELD} font-mono`}
              />
            </div>

            <div>
              <Label htmlFor="note">한 줄 설명 (선택)</Label>
              <input
                id="note"
                name="note"
                type="text"
                maxLength={300}
                placeholder="어떤 곳인지 짧게 적어주세요"
                className={FIELD}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={status.kind === "sending"}
                className="cursor-pointer bg-knu-red px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-knu-red-deep disabled:cursor-wait disabled:opacity-60"
              >
                {status.kind === "sending" ? "보내는 중…" : "제보하기"}
              </button>

              {status.kind === "error" && (
                <p role="alert" className="text-[0.8125rem] text-knu-red-ink">
                  {status.message}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
