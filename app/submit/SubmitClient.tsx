"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, CirclePlus, Music4 } from "lucide-react";
import { isSubmissionOpen } from "@/config";
import { CURRENT_SEASON, SONGS_TABLE } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";
import { DEFAULT_TIME_THEME } from "@/lib/timeTheme";

const SUBMIT_THEME = {
  ...DEFAULT_TIME_THEME,
  background: "#f8f9fb",
  backgroundImage:
    "radial-gradient(circle at 50% 16%, rgba(255,255,255,0.92), transparent 32%), radial-gradient(circle at 18% 86%, rgba(165,183,196,0.16), transparent 28%), linear-gradient(145deg, #ffffff 0%, #f8f9fb 52%, #eef1f4 100%)",
  panel: "rgba(255,255,255,0.72)",
  panelStrong: "rgba(255,255,255,0.82)",
  border: "rgba(88,108,127,0.14)",
  input: "rgba(255,255,255,0.72)",
};

function getYouTubeThumbnail(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.slice(1);
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    return "";
  } catch {
    return "";
  }
}

function normalizeNickname(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

async function getYouTubeTitle(url: string) {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      return "YouTube Video";
    }

    const data = await response.json();
    return data.title ?? "YouTube Video";
  } catch {
    return "YouTube Video";
  }
}

export default function SubmitClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nickname, setNickname] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [comment, setComment] = useState("");
  const hasInitializedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSongId, setEditSongId] = useState<number | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submitTheme = SUBMIT_THEME;

  const pageStyle = {
    "--frisson-bg": submitTheme.background,
    "--frisson-bg-image": submitTheme.backgroundImage,
    "--frisson-text": submitTheme.text,
    "--frisson-muted": submitTheme.mutedText,
    "--frisson-faint": submitTheme.faintText,
    "--frisson-panel": submitTheme.panel,
    "--frisson-panel-strong": submitTheme.panelStrong,
    "--frisson-border": submitTheme.border,
    "--frisson-grid": submitTheme.grid,
    "--frisson-accent-rgb": submitTheme.accentRgb,
    "--frisson-button": submitTheme.button,
    "--frisson-button-hover": submitTheme.buttonHover,
    "--frisson-button-text": submitTheme.buttonText,
    "--frisson-input": submitTheme.input,
    backgroundColor: "var(--frisson-bg)",
    backgroundImage: "var(--frisson-bg-image)",
  } as CSSProperties;
  const fieldClassName =
    "w-full rounded-2xl border border-[var(--frisson-border)] bg-[var(--frisson-input)] px-4 text-[15px] text-[var(--frisson-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(20,26,32,0.07)] outline-none transition placeholder:text-[var(--frisson-faint)] focus:border-[rgba(var(--frisson-accent-rgb),0.34)] focus:bg-[var(--frisson-panel-strong)] focus:ring-4 focus:ring-[rgba(var(--frisson-accent-rgb),0.12)]";
  const labelClassName =
    "mb-2 block text-sm font-semibold text-[var(--frisson-muted)]";

  useEffect(() => {
    async function initialize() {
      if (hasInitializedRef.current) {
        return;
      }

      hasInitializedRef.current = true;
      const savedNickname = sessionStorage.getItem("nickname");

      if (!savedNickname) {
        alert("먼저 홈에서 닉네임을 입력해주세요.");
        window.location.href = "/";
        return;
      }

      setNickname(savedNickname);

      // Check if in edit mode
      const editParam = searchParams.get("edit");
      if (editParam) {
        setIsEditMode(true);
        const songId = parseInt(editParam, 10);
        setEditSongId(songId);

        // Fetch existing song data
        const { data: existingSong, error } = await supabase
          .from(SONGS_TABLE)
          .select("*")
          .eq("id", songId)
          .eq("season", CURRENT_SEASON)
          .maybeSingle();

        if (error || !existingSong) {
          alert("곡을 불러오는 중 오류가 발생했습니다.");
          router.push("/songs");
          return;
        }

        if (normalizeNickname(existingSong.nickname) !== normalizeNickname(savedNickname)) {
          alert("이번 시즌 내 곡만 수정할 수 있습니다.");
          router.push("/songs");
          return;
        }

        // Load existing song data
        setYoutubeUrl(existingSong.youtube_url);
        setComment(existingSong.comment);
      }

      setIsPageLoading(false);
    }

    initialize();
  }, [searchParams, router]);

  async function handleSubmit() {
    if (!nickname.trim() || !youtubeUrl.trim() || !comment.trim()) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    // If in edit mode, show confirmation modal
    if (isEditMode) {
      setShowConfirmModal(true);
      return;
    }

    // Create mode: proceed directly
    await performSubmit();
  }

  async function handleConfirmEdit() {
    setShowConfirmModal(false);
    await performSubmit();
  }

  async function performSubmit() {
    setIsSubmitting(true);

    try {
      if (isEditMode && editSongId) {
        // Edit mode: Update the current user's Season 4 song only.
        const thumbnailUrl = getYouTubeThumbnail(youtubeUrl);
        const title = await getYouTubeTitle(youtubeUrl);

        const updatePayload = {
          youtube_url: youtubeUrl,
          comment: comment,
          thumbnail_url: thumbnailUrl,
          title,
        };

        console.log("Edit mode - Update payload:", updatePayload);
        console.log("Song ID:", editSongId);

        const { data: updateData, error: updateError } = await supabase
          .from(SONGS_TABLE)
          .update(updatePayload)
          .eq("id", editSongId)
          .eq("season", CURRENT_SEASON)
          .eq("nickname", nickname)
          .select();

        console.log("Supabase update response:", { data: updateData, error: updateError });

        if (updateError) {
          console.error("Song edit failed - Supabase error:", {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
          });
          alert("곡 수정 중 오류가 발생했습니다. " + (updateError.message || ""));
          setIsSubmitting(false);
          return;
        }

        if (!updateData || updateData.length === 0) {
          console.error("Song edit failed - No data returned from update");
          alert("곡 수정에 실패했습니다. 존재하지 않는 곡입니다.");
          setIsSubmitting(false);
          return;
        }

        console.log("Song edit successful:", updateData[0]);
        alert("곡이 성공적으로 수정되었습니다.");
        router.push("/songs");
      } else {
        // Create mode: Insert new song
        const thumbnailUrl = getYouTubeThumbnail(youtubeUrl);
        const title = await getYouTubeTitle(youtubeUrl);

        console.log("Create mode - Checking for existing song with nickname:", nickname);

        const { data: existingSong, error: checkError } = await supabase
          .from(SONGS_TABLE)
          .select("id")
          .eq("season", CURRENT_SEASON)
          .eq("nickname", nickname)
          .maybeSingle();

        if (checkError) {
          console.error("Failed to check existing song:", {
            message: checkError.message,
            code: checkError.code,
          });
          alert("기존 제출 여부를 확인하는 중 오류가 발생했습니다.");
          setIsSubmitting(false);
          return;
        }

        if (existingSong) {
          console.log("Song already exists for this nickname:", existingSong.id);
          alert("이미 이번 시즌에 곡을 제출했습니다. 시즌마다 한 곡씩 등록할 수 있어요.");
          setIsSubmitting(false);
          return;
        }

        const insertPayload = {
          season: CURRENT_SEASON,
          nickname,
          youtube_url: youtubeUrl,
          comment,
          thumbnail_url: thumbnailUrl,
          title,
          votes: 0,
          voters: [],
          time_slot: null,
          time_minute: null,
        };

        console.log("Create mode - Insert payload:", insertPayload);

        const { data: insertData, error: insertError } = await supabase
          .from(SONGS_TABLE)
          .insert([insertPayload])
          .select();

        console.log("Supabase insert response:", { data: insertData, error: insertError });

        if (insertError) {
          console.error("Song insert failed - Supabase error:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
          });
          alert("곡 저장 중 오류가 발생했습니다. " + (insertError.message || ""));
          setIsSubmitting(false);
          return;
        }

        if (!insertData || insertData.length === 0) {
          console.error("Song insert failed - No data returned from insert");
          alert("곡 저장에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        console.log("Song insert successful:", insertData[0]);

        setYoutubeUrl("");
        setComment("");
        alert("곡이 성공적으로 등록되었습니다.");
        router.push("/songs");
      }
    } catch (error) {
      console.error("Unexpected error in performSubmit:", {
        error,
        errorString: String(error),
        errorMessage: error instanceof Error ? error.message : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert("알 수 없는 오류가 발생했습니다: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSubmissionOpen && !isEditMode) {
    return (
      <main
        data-time-theme={submitTheme.name}
        className="min-h-screen px-5 py-10 text-[var(--frisson-text)] transition-colors duration-[850ms]"
        style={pageStyle}
      >
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(var(--frisson-grid)_1px,transparent_1px),linear-gradient(90deg,var(--frisson-grid)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70" />
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl items-center justify-center">
          <div className="relative w-full rounded-[32px] border border-[var(--frisson-border)] bg-[var(--frisson-panel)] p-8 text-center shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--frisson-border)] bg-[var(--frisson-button)] text-[var(--frisson-button-text)]">
              <Music4 size={24} />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--frisson-faint)]">
              Frisson Season 4
            </p>
            <h1 className="m-0 text-3xl font-semibold tracking-tight text-[var(--frisson-text)] md:text-4xl">
              이번 시즌 제출이 마감되었습니다
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--frisson-muted)] md:text-base">
              현재는 새로운 곡을 제출할 수 없습니다.
              <br />
              곡 목록에서 이번 시즌의 frisson 곡들을 감상해보세요.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-panel-strong)] px-5 py-3 text-sm font-semibold text-[var(--frisson-muted)] transition hover:bg-[var(--frisson-input)]"
              >
                <ArrowLeft size={16} />
                홈으로
              </Link>

              <Link
                href="/songs"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-button)] px-5 py-3 text-sm font-semibold text-[var(--frisson-button-text)] transition hover:bg-[var(--frisson-button-hover)]"
              >
                <Music4 size={16} />
                곡 목록 보기
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      data-time-theme={submitTheme.name}
      className="min-h-screen px-5 py-10 text-[var(--frisson-text)] transition-colors duration-[850ms] sm:px-8"
      style={pageStyle}
    >
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(var(--frisson-grid)_1px,transparent_1px),linear-gradient(90deg,var(--frisson-grid)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70" />
      <div className="relative mx-auto max-w-2xl">
        <section className="rounded-[32px] border border-[var(--frisson-border)] bg-[var(--frisson-panel)] p-5 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors duration-[850ms] sm:p-7 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
              <div className="space-y-4 sm:space-y-6">
                <button
                  onClick={() => router.push("/songs")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-panel-strong)] text-[var(--frisson-muted)] transition hover:bg-[var(--frisson-input)] hover:text-[var(--frisson-text)]"
                  type="button"
                  aria-label="곡 목록으로 돌아가기"
                >
                  <ArrowLeft size={18} />
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--frisson-faint)]">
                    Frisson Season 4
                  </p>
                  <h1 className="m-0 mt-4 text-3xl font-semibold tracking-tight text-[var(--frisson-text)] md:text-4xl">
                    {isEditMode ? "나의 프리송 다시 남기기" : "나의 프리송 남기기"}
                  </h1>
                  <p className="mt-5 text-sm leading-7 text-[var(--frisson-muted)] md:text-base">
                    이번 시즌,
                    <br />
                    당신의 전율을 일으키는 곡을 남겨주세요.
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--frisson-faint)] md:text-base">
                    @{nickname} 님의 이번 시즌 프리송을 남겨주세요.
                    <br />
                    시즌마다 한 곡씩 등록할 수 있어요.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClassName}>
                  닉네임
                </label>
                <input
                  value={nickname}
                  disabled
                  placeholder="닉네임"
                  className={`${fieldClassName} h-14 cursor-not-allowed opacity-70`}
                />
              </div>

              <div>
                <label className={labelClassName}>
                  유튜브 링크
                </label>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`${fieldClassName} h-14`}
                />
              </div>

              <div>
                <label className={labelClassName}>
                  한 줄 코멘트
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="이 곡이 당신에게 전율을 주는 이유를 남겨주세요."
                  rows={4}
                  className={`${fieldClassName} resize-none py-4`}
                />
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => router.push("/songs")}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-panel-strong)] px-5 text-[15px] font-semibold text-[var(--frisson-muted)] transition hover:bg-[var(--frisson-input)] hover:text-[var(--frisson-text)]"
                >
                  <ArrowLeft size={16} />
                  돌아가기
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isPageLoading}
                  className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[var(--frisson-border)] px-5 text-[15px] font-semibold shadow-[0_14px_32px_rgba(20,24,28,0.16)] transition duration-300 ${
                    isSubmitting || isPageLoading
                      ? "cursor-not-allowed bg-[var(--frisson-panel-strong)] text-[var(--frisson-faint)]"
                      : "bg-[var(--frisson-button)] text-[var(--frisson-button-text)] hover:-translate-y-0.5 hover:bg-[var(--frisson-button-hover)] hover:shadow-[0_18px_38px_rgba(20,24,28,0.2)] active:translate-y-0"
                  }`}
                >
                  <CirclePlus size={17} />
                  {isPageLoading
                    ? "로딩 중..."
                    : isSubmitting
                    ? isEditMode
                      ? "수정 중..."
                      : "제출 중..."
                    : isEditMode
                    ? "수정하기"
                    : "제출하기"}
                </button>
              </div>
            </div>
          </section>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-sm rounded-[28px] border border-[var(--frisson-border)] bg-[var(--frisson-panel-strong)] p-6 shadow-2xl backdrop-blur-2xl md:p-8">
            <h2 className="m-0 mb-3 text-xl font-semibold text-[var(--frisson-text)]">
              곡을 수정하시겠습니까?
            </h2>
            <p className="mb-6 text-sm leading-6 text-[var(--frisson-muted)]">
              곡을 수정하면 현재의 곡 정보가 새로운 정보로 대체되며, 기존의 모든 투표가 초기화됩니다. 이 작업은 되돌릴 수 없습니다. 정말 계속하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-panel)] px-4 py-3 text-sm font-semibold text-[var(--frisson-muted)] transition hover:bg-[var(--frisson-input)]"
              >
                취소
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={isSubmitting}
                className="flex-1 rounded-full border border-[var(--frisson-border)] bg-[var(--frisson-button)] px-4 py-3 text-sm font-semibold text-[var(--frisson-button-text)] transition hover:bg-[var(--frisson-button-hover)] disabled:bg-[var(--frisson-panel-strong)] disabled:text-[var(--frisson-faint)]"
              >
                {isSubmitting ? "수정 중..." : "수정하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
