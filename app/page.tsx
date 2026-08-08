"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TIME_THEME } from "@/lib/timeTheme";

const LOGIN_THEME = {
  ...DEFAULT_TIME_THEME,
  background: "#f8f9fb",
  backgroundImage:
    "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.96), transparent 34%), linear-gradient(145deg, #ffffff 0%, #f8f9fb 55%, #eef1f4 100%)",
  panel: "rgba(255,255,255,0.58)",
  panelStrong: "rgba(255,255,255,0.84)",
  border: "rgba(88,108,127,0.12)",
  grid: "rgba(91,112,132,0.035)",
  input: "rgba(255,255,255,0.76)",
};

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const loginTheme = LOGIN_THEME;

  useEffect(() => {
    const storedNickname = sessionStorage.getItem("nickname");
    if (storedNickname) {
      router.push("/songs");
    }
  }, [router]);

  function saveNickname() {
    if (!nickname.trim()) {
      alert("ADA 닉네임을 입력해주세요.");
      return;
    }

    sessionStorage.setItem("nickname", nickname.trim());
    router.push("/songs");
  }

  return (
    <main
      data-time-theme={loginTheme.name}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 text-[var(--frisson-text)] transition-colors duration-[850ms] sm:px-8"
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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--frisson-grid)_1px,transparent_1px),linear-gradient(90deg,var(--frisson-grid)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <header className="absolute left-5 right-5 top-6 z-20 flex items-center justify-between sm:left-8 sm:right-8 sm:top-8">
        <p className="text-[11px] font-bold tracking-[-0.02em] text-[var(--frisson-text)]">
          FRISSON
        </p>
        <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--frisson-faint)]">
          SEASON 05
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveNickname();
        }}
        className="frisson-home-enter relative z-10 w-full max-w-[370px] text-center"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--frisson-faint)]">
          A song for this challenge
        </p>
        <h1 className="mt-5 text-[2.75rem] font-semibold tracking-[-0.055em] text-[var(--frisson-text)] sm:text-[3.4rem]">
          FRISSON
        </h1>
        <p className="mx-auto mt-4 max-w-[300px] text-[13px] leading-6 text-[var(--frisson-muted)]">
          이번 챌린지 기간 동안 포항에서
          <br />
          당신의 전율을 일으키는 곡을 남겨주세요.
        </p>

        <div className="mt-10">
          <input
            aria-label="닉네임"
            placeholder="ADA 닉네임(한글)"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            autoComplete="off"
            className="h-[50px] w-full rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-input)] px-5 text-center text-[14px] font-medium text-[var(--frisson-text)] outline-none transition placeholder:text-[var(--frisson-faint)] focus:border-neutral-400/40 focus:bg-[var(--frisson-panel-strong)] focus:ring-4 focus:ring-black/[0.04]"
          />
          <button
            type="submit"
            className="mt-2.5 h-[50px] w-full rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(20,24,28,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_16px_34px_rgba(20,24,28,0.2)] active:translate-y-0"
          >
            들어가기
          </button>
        </div>
      </form>

      <p className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.3em] text-[var(--frisson-faint)] sm:bottom-8">
        Apple Developer Academy 5
      </p>
    </main>
  );
}
