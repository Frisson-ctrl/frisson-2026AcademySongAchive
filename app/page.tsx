"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TIME_THEME } from "@/lib/timeTheme";

const LOGIN_THEME = {
  ...DEFAULT_TIME_THEME,
  background: "#f8f9fb",
  backgroundImage:
    "radial-gradient(circle at 50% 16%, rgba(255,255,255,0.92), transparent 32%), radial-gradient(circle at 18% 86%, rgba(165,183,196,0.16), transparent 28%), linear-gradient(145deg, #ffffff 0%, #f8f9fb 52%, #eef1f4 100%)",
  panel: "rgba(255,255,255,0.72)",
  panelStrong: "rgba(255,255,255,0.82)",
  border: "rgba(88,108,127,0.14)",
  grid: "rgba(91,112,132,0.04)",
  input: "rgba(255,255,255,0.72)",
};

const MARQUEE_COPY =
  "나의 프리송 · 하루의 한 곡 · 다시 듣는 기억 · PLAY A SONG · SAVE A MOMENT · FRISSON ·";
const SEASON_MARQUEE_COPY =
  "FRISSON SEASON 4 · PLAY A SONG · SAVE A MOMENT · 나의 프리송 · 다시 듣는 기억 · FRISSON ·";

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const loginTheme = LOGIN_THEME;

  useEffect(() => {
    const storedNickname = sessionStorage.getItem("nickname");
    if (storedNickname) {
      // Redirect directly to songs page if already logged in
      router.push("/songs");
    }
  }, [router]);

  function saveNickname() {
    if (!nickname.trim()) {
      alert("ADA 닉네임을 입력해주세요.");
      return;
    }

    const trimmedNickname = nickname.trim();
    sessionStorage.setItem("nickname", trimmedNickname);
    // Redirect to songs page after login
    router.push("/songs");
  }

  // Only show login form
  return (
    <main
      data-time-theme={loginTheme.name}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-24 text-[var(--frisson-text)] transition-colors duration-[850ms] sm:px-8"
      style={
        {
          "--frisson-bg": loginTheme.background,
          "--frisson-bg-image": loginTheme.backgroundImage,
          "--frisson-text": loginTheme.text,
          "--frisson-muted": loginTheme.mutedText,
          "--frisson-faint": loginTheme.faintText,
          "--frisson-panel": loginTheme.panel,
          "--frisson-panel-strong": loginTheme.panelStrong,
          "--frisson-border": loginTheme.border,
          "--frisson-grid": loginTheme.grid,
          "--frisson-accent-rgb": loginTheme.accentRgb,
          "--frisson-button": loginTheme.button,
          "--frisson-button-hover": loginTheme.buttonHover,
          "--frisson-button-text": loginTheme.buttonText,
          "--frisson-input": loginTheme.input,
          backgroundColor: "var(--frisson-bg)",
          backgroundImage: "var(--frisson-bg-image)",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--frisson-grid)_1px,transparent_1px),linear-gradient(90deg,var(--frisson-grid)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70" />

      <div className="pointer-events-none absolute left-0 right-0 top-0 overflow-hidden border-b border-[var(--frisson-border)] bg-[var(--frisson-panel)] py-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--frisson-faint)] backdrop-blur-sm">
        <div className="frisson-marquee-right flex w-max whitespace-nowrap">
          <span className="px-6">
            {MARQUEE_COPY}
            {MARQUEE_COPY}
            {MARQUEE_COPY}
            {MARQUEE_COPY}
          </span>
          <span className="px-6">
            {MARQUEE_COPY}
            {MARQUEE_COPY}
            {MARQUEE_COPY}
            {MARQUEE_COPY}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden border-t border-[var(--frisson-border)] bg-[var(--frisson-panel)] py-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--frisson-faint)] backdrop-blur-sm">
        <div className="frisson-marquee-left flex w-max whitespace-nowrap">
          <span className="px-6">
            {SEASON_MARQUEE_COPY}
            {SEASON_MARQUEE_COPY}
            {SEASON_MARQUEE_COPY}
          </span>
          <span className="px-6">
            {SEASON_MARQUEE_COPY}
            {SEASON_MARQUEE_COPY}
            {SEASON_MARQUEE_COPY}
          </span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveNickname();
        }}
        className="frisson-home-enter relative z-10 w-full max-w-[440px] rounded-[28px] border border-[var(--frisson-border)] bg-[var(--frisson-panel)] px-6 py-10 text-center shadow-[0_20px_50px_rgba(20,26,32,0.06)] backdrop-blur-2xl transition-colors duration-[850ms] sm:px-8 sm:py-12"
      >
        <div className="flex flex-col items-center gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--frisson-faint)]">
              FRISSON SEASON 4
            </p>
            <h1 className="mt-4 text-[2.25rem] font-semibold tracking-tight text-[var(--frisson-text)] sm:text-5xl">
              FRISSON
            </h1>
            <p className="mx-auto mt-5 max-w-[310px] text-sm leading-7 text-[var(--frisson-muted)]">
              이번 시즌,
              <br />
              당신의 전율을 일으키는 곡은 무엇인가요?
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <input
              placeholder="닉네임을 입력하세요(한글)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-[52px] w-full rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-input)] px-5 text-center text-[15px] font-medium text-[var(--frisson-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(20,26,32,0.08)] outline-none transition placeholder:text-[var(--frisson-faint)] focus:border-[rgba(var(--frisson-accent-rgb),0.34)] focus:bg-[var(--frisson-panel-strong)] focus:ring-4 focus:ring-[rgba(var(--frisson-accent-rgb),0.12)]"
            />

            <button
              type="submit"
              className="h-[52px] w-full rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-button)] px-5 text-[15px] font-semibold text-[var(--frisson-button-text)] shadow-[0_14px_32px_rgba(20,24,28,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--frisson-button-hover)] hover:shadow-[0_18px_38px_rgba(20,24,28,0.2)] active:translate-y-0"
            >
              들어가기
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
