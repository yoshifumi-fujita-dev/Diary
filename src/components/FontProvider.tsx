"use client";

import { useEffect } from "react";

const FONT_MAP: Record<string, string> = {
  "shippori": "var(--font-shippori)",
  "noto-sans": "var(--font-noto-sans)",
  "klee": "var(--font-klee)",
};

export function FontProvider() {
  useEffect(() => {
    fetch("/api/settings/font")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.font) return;
        const css = FONT_MAP[data.font] ?? FONT_MAP["shippori"];
        document.documentElement.style.setProperty("--app-font", css);
        document.body.style.fontFamily = css;
      })
      .catch(() => {});
  }, []);

  return null;
}
