import { Suspense } from "react";
import type { CSSProperties } from "react";
import SubmitClient from "./SubmitClient";
import { DEFAULT_TIME_THEME } from "@/lib/timeTheme";

function SubmitLoadingFallback() {
  const theme = DEFAULT_TIME_THEME;

  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 py-10 text-[var(--frisson-text)]"
      style={
        {
          "--frisson-bg": theme.background,
          "--frisson-bg-image": theme.backgroundImage,
          "--frisson-text": theme.text,
          "--frisson-muted": theme.mutedText,
          "--frisson-panel": theme.panel,
          backgroundColor: "var(--frisson-bg)",
          backgroundImage: "var(--frisson-bg-image)",
        } as CSSProperties
      }
    >
      <div className="text-center">
        <div className="mb-4 inline-block rounded-full bg-[var(--frisson-panel)] p-4">
          <div className="animate-spin">
            <div className="h-8 w-8 rounded-full border-3 border-[var(--frisson-muted)] border-t-[var(--frisson-text)]" />
          </div>
        </div>
        <p className="text-[var(--frisson-muted)]">페이지를 불러오는 중...</p>
      </div>
    </main>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<SubmitLoadingFallback />}>
      <SubmitClient />
    </Suspense>
  );
}
