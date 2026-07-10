"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CommandPalette } from "@/components/command-palette";

interface PaletteContextValue {
  open: () => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette 는 PaletteProvider 안에서만 쓸 수 있다");
  return ctx;
}

/** 사용자가 이미 글을 치고 있는 중인가 */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K. preventDefault 하지 않으면 일부 브라우저가 주소창으로 가져간다.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }
      // '/' 한 글자로도 연다. 단, 어딘가에 글을 치고 있는 중이면 건드리지 않는다.
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !isTyping(e.target)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
    </PaletteContext.Provider>
  );
}
