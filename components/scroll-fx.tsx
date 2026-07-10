"use client";

import { useEffect } from "react";

/**
 * 스크롤 연출의 유일한 배선함. 렌더는 하지 않는다.
 *
 *  1. [data-fx]        — 화면에 들어오면 .fx-in 을 붙여 한 번 떠오르게 한다.
 *                        서버가 그린 정적 섹션에만 쓴다. (늦게 마운트되는
 *                        클라이언트 구획은 관찰 목록에 없으므로 붙이지 말 것)
 *  2. [data-parallax]  — 값(예: -0.08)만큼 스크롤보다 느리게/빠르게 흐른다.
 *                        data-fade="600" 이면 600px에 걸쳐 사라진다.
 *  3. html[data-scrolled] — 헤더가 지면에서 떠오를 타이밍.
 *
 * JS가 없으면 html.js 클래스도 없으므로 모든 내용이 그냥 보인다.
 * prefers-reduced-motion 이면 시차 효과를 통째로 건너뛴다.
 */
export function ScrollFx() {
  useEffect(() => {
    const root = document.documentElement;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("fx-in");
            observer.unobserve(entry.target);
          }
        }
      },
      // 하단 8%를 남겨두면 "이미 다 보인 뒤에 뜨는" 어색함이 없다
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    for (const el of document.querySelectorAll("[data-fx]")) {
      observer.observe(el);
    }

    const parallaxEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;

        if (y > 8) root.setAttribute("data-scrolled", "");
        else root.removeAttribute("data-scrolled");

        if (reduced) return;
        for (const el of parallaxEls) {
          const speed = Number(el.dataset.parallax ?? "0");
          el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
          const fade = Number(el.dataset.fade ?? "0");
          if (fade > 0) {
            el.style.opacity = Math.max(0, 1 - y / fade).toFixed(3);
          }
        }
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
