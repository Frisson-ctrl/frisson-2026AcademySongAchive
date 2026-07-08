"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CircleHelp,
  Crown,
  ExternalLink,
  Heart,
  ListMusic,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import YouTube, { type YouTubeEvent, type YouTubeProps } from "react-youtube";
import FrissonLetterModal from "@/components/FrissonLetterModal";
import { CURRENT_SEASON, SONGS_TABLE } from "@/lib/currentSeason";
import {
  DEFAULT_DOCUMENT_TITLE,
  getNowPlayingDocumentTitle,
  getNowPlayingTitle,
} from "@/lib/nowPlaying";
import { supabase } from "@/lib/supabase";

type ViewSeason = 1 | 2 | 3 | typeof CURRENT_SEASON;
type CircularSong = {
  id: string;
  season: ViewSeason;
  nickname: string;
  title: string;
  comment: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  votes: number;
  createdAt?: string;
  updatedAt?: string;
  time?: string;
  trackOrder: number;
  voters: string[];
};

export type TimeMapSong = {
  id: number;
  season: ViewSeason;
  trackOrder: number;
  nickname: string;
  youtubeUrl: string;
  comment: string;
  thumbnailUrl: string;
  title: string;
  votes?: number;
  voters?: string[];
  createdAt?: string;
  updatedAt?: string;
  timeSlot: number;
  timeMinute?: number;
  timeReason?: string;
};

type SongRow = {
  id: number | string;
  season?: number | null;
  nickname?: string | null;
  title?: string | null;
  youtube_url?: string | null;
  comment?: string | null;
  thumbnail_url?: string | null;
  votes?: number | null;
  voters?: string[] | string | null;
  time_slot?: number | string | null;
  time_minute?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const SIZE = 620;
const CENTER = SIZE / 2;
const RADIUS = 232;
const MAJOR_TICK_INNER_RADIUS = 314;
const MAJOR_TICK_OUTER_RADIUS = 348;
const MINOR_TICK_INNER_RADIUS = 316;
const MINOR_TICK_OUTER_RADIUS = 334;
const LABEL_RADIUS = 360;
const PING_RADIUS = 300;
const PROGRESS_RADIUS = 286;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
const FLOATING_CARD_WIDTH = 292;
const FLOATING_CARD_HALF_HEIGHT = 134;
const FLOATING_CARD_HEIGHT = FLOATING_CARD_HALF_HEIGHT * 2;
const RECORD_OUTER_RADIUS = SIZE * 0.46;
const CARD_SAFE_GAP = 118;
const CARD_OUTWARD_DISTANCE = RECORD_OUTER_RADIUS + CARD_SAFE_GAP;
const CARD_RIM_GAP = 76;

const UI_FONT_STACK =
  "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Segoe UI, sans-serif";
const CENTER_LABEL_FALLBACK_IMAGE_PATH = "/frisson-center-label3.png";
const FALLBACK_THUMBNAIL_PATH = "/tape.png";
const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;
const NEW_SONG_WINDOW_DAYS = 7;

function getCenterLabelImagePath(season: ViewSeason) {
  return `/frisson-center-label${season}.png`;
}

type EnvironmentTheme = {
  name: "dawn" | "morning" | "day" | "sunset" | "evening" | "night";
  background: string;
  backgroundImage: string;
  text: string;
  mutedText: string;
  faintText: string;
  panel: string;
  panelStrong: string;
  border: string;
  grid: string;
  radialA: string;
  radialB: string;
  radialC: string;
  accentWash: string;
  lpShadow: string;
  lpHighlightOpacity: string;
  glowOpacity: string;
  progressGlowOpacity: string;
  pingGlowOpacity: string;
  accent: string;
  accentRgb: string;
  glowRgb: string;
  glass: string;
  glassStrong: string;
  connectorLine: string;
  archiveLabel: string;
};

const TIME_THEMES: Record<EnvironmentTheme["name"], EnvironmentTheme> = {
  dawn: {
    name: "dawn",
    background: "#111827",
    backgroundImage:
      "linear-gradient(145deg,#111827 0%,#172033 52%,#202b3f 100%)",
    text: "#eef6ff",
    mutedText: "rgba(218,231,244,0.72)",
    faintText: "rgba(200,218,235,0.5)",
    accent: "#b9d7f5",
    accentRgb: "185,215,245",
    glowRgb: "126,166,208",
    panel: "rgba(225,235,245,0.06)",
    panelStrong: "rgba(225,235,245,0.12)",
    border: "rgba(205,222,238,0.16)",
    grid: "rgba(205,222,238,0.018)",
    radialA: "rgba(110,132,158,0.18)",
    radialB: "rgba(211,226,240,0.06)",
    radialC: "rgba(54,68,92,0.18)",
    accentWash: "rgba(120,145,170,0.055)",
    lpShadow:
      "inset 0 0 46px rgba(255,255,255,0.03), inset 0 0 120px rgba(0,0,0,0.82), 0 28px 88px rgba(0,0,0,0.3)",
    lpHighlightOpacity: "0.58",
    glowOpacity: "0.12",
    progressGlowOpacity: "0.12",
    pingGlowOpacity: "0.08",
    glass: "rgba(18,24,31,0.28)",
    glassStrong: "rgba(230,238,248,0.1)",
    connectorLine: "rgba(226,234,242,0.44)",
    archiveLabel: "새벽의 기록",
  },
  morning: {
    name: "morning",
    background: "#edf4f8",
    backgroundImage:
      "linear-gradient(145deg,#f9fbfc 0%,#edf4f8 52%,#e2ebf1 100%)",
    text: "#142334",
    mutedText: "rgba(37,58,78,0.72)",
    faintText: "rgba(72,96,118,0.58)",
    accent: "#68acd8",
    accentRgb: "104,172,216",
    glowRgb: "96,158,206",
    panel: "rgba(255,255,255,0.48)",
    panelStrong: "rgba(255,255,255,0.64)",
    border: "rgba(78,111,138,0.16)",
    grid: "rgba(78,111,138,0.045)",
    radialA: "rgba(176,195,208,0.28)",
    radialB: "rgba(255,255,255,0.72)",
    radialC: "rgba(172,190,204,0.18)",
    accentWash: "rgba(104,140,164,0.055)",
    lpShadow:
      "inset 0 0 46px rgba(255,255,255,0.03), inset 0 0 116px rgba(0,0,0,0.78), 0 30px 68px rgba(40,70,96,0.2), 0 12px 28px rgba(40,70,96,0.12)",
    lpHighlightOpacity: "0.38",
    glowOpacity: "0.04",
    progressGlowOpacity: "0.045",
    pingGlowOpacity: "0.02",
    glass: "rgba(255,255,255,0.42)",
    glassStrong: "rgba(255,255,255,0.58)",
    connectorLine: "rgba(54,72,88,0.48)",
    archiveLabel: "아침의 기록",
  },
  day: {
    name: "day",
    background: "#f3f5f7",
    backgroundImage:
      "linear-gradient(145deg,#fbfcfd 0%,#f3f5f7 52%,#eceff2 100%)",
    text: "#171d24",
    mutedText: "rgba(42,53,64,0.72)",
    faintText: "rgba(72,86,99,0.6)",
    accent: "#7da9c9",
    accentRgb: "125,169,201",
    glowRgb: "118,158,190",
    panel: "rgba(255,255,255,0.46)",
    panelStrong: "rgba(255,255,255,0.62)",
    border: "rgba(88,108,127,0.16)",
    grid: "rgba(91,112,132,0.045)",
    radialA: "rgba(196,207,216,0.24)",
    radialB: "rgba(255,255,255,0.68)",
    radialC: "rgba(180,192,204,0.18)",
    accentWash: "rgba(150,166,181,0.05)",
    lpShadow:
      "inset 0 0 46px rgba(255,255,255,0.03), inset 0 0 120px rgba(0,0,0,0.78), 0 34px 74px rgba(34,45,56,0.2), 0 14px 30px rgba(34,45,56,0.12)",
    lpHighlightOpacity: "0.34",
    glowOpacity: "0.035",
    progressGlowOpacity: "0.035",
    pingGlowOpacity: "0.018",
    glass: "rgba(255,255,255,0.4)",
    glassStrong: "rgba(255,255,255,0.56)",
    connectorLine: "rgba(56,67,78,0.5)",
    archiveLabel: "오후의 기록",
  },
  sunset: {
    name: "sunset",
    background: "#dfe3e6",
    backgroundImage:
      "linear-gradient(145deg,#f0f1ef 0%,#dfe3e6 48%,#c9d0d7 100%)",
    text: "#1b2129",
    mutedText: "rgba(50,58,67,0.72)",
    faintText: "rgba(78,88,99,0.54)",
    accent: "#ff873d",
    accentRgb: "255,135,61",
    glowRgb: "255,108,38",
    panel: "rgba(255,255,255,0.36)",
    panelStrong: "rgba(255,255,255,0.5)",
    border: "rgba(84,92,102,0.16)",
    grid: "rgba(84,92,102,0.032)",
    radialA: "rgba(175,184,194,0.22)",
    radialB: "rgba(255,255,255,0.42)",
    radialC: "rgba(143,154,168,0.18)",
    accentWash: "rgba(130,140,152,0.05)",
    lpShadow:
      "inset 0 0 46px rgba(255,255,255,0.03), inset 0 0 120px rgba(0,0,0,0.8), 0 30px 74px rgba(48,55,64,0.22)",
    lpHighlightOpacity: "0.42",
    glowOpacity: "0.06",
    progressGlowOpacity: "0.08",
    pingGlowOpacity: "0.04",
    glass: "rgba(255,255,255,0.34)",
    glassStrong: "rgba(255,255,255,0.48)",
    connectorLine: "rgba(58,64,72,0.48)",
    archiveLabel: "해질녘의 기록",
  },
  evening: {
    name: "evening",
    background: "#1a2230",
    backgroundImage:
      "linear-gradient(145deg,#202938 0%,#1a2230 54%,#121927 100%)",
    text: "#f3f5ff",
    mutedText: "rgba(221,225,244,0.72)",
    faintText: "rgba(201,207,232,0.48)",
    accent: "#c5b9ff",
    accentRgb: "197,185,255",
    glowRgb: "150,142,220",
    panel: "rgba(226,230,248,0.06)",
    panelStrong: "rgba(226,230,248,0.12)",
    border: "rgba(210,214,245,0.16)",
    grid: "rgba(210,214,245,0.018)",
    radialA: "rgba(112,128,151,0.18)",
    radialB: "rgba(238,243,250,0.07)",
    radialC: "rgba(54,68,90,0.2)",
    accentWash: "rgba(128,142,160,0.055)",
    lpShadow:
      "inset 0 0 46px rgba(255,255,255,0.03), inset 0 0 120px rgba(0,0,0,0.82), 0 28px 88px rgba(0,0,0,0.32)",
    lpHighlightOpacity: "0.68",
    glowOpacity: "0.14",
    progressGlowOpacity: "0.16",
    pingGlowOpacity: "0.1",
    glass: "rgba(18,24,36,0.28)",
    glassStrong: "rgba(230,232,255,0.1)",
    connectorLine: "rgba(226,230,242,0.42)",
    archiveLabel: "저녁의 기록",
  },
  night: {
    name: "night",
    background: "#0b1019",
    backgroundImage:
      "linear-gradient(145deg,#090d14 0%,#0d1422 48%,#171f34 100%)",
    text: "#eef2f7",
    mutedText: "rgba(210,221,232,0.68)",
    faintText: "rgba(201,215,228,0.43)",
    accent: "#cad7e7",
    accentRgb: "202,215,231",
    glowRgb: "132,154,181",
    panel: "rgba(220,230,240,0.065)",
    panelStrong: "rgba(220,230,240,0.105)",
    border: "rgba(202,215,231,0.14)",
    grid: "rgba(210,221,232,0.018)",
    radialA: "rgba(93,117,145,0.2)",
    radialB: "rgba(220,230,240,0.06)",
    radialC: "rgba(64,83,105,0.16)",
    accentWash: "rgba(132,154,181,0.052)",
    lpShadow:
      "inset 0 0 46px rgba(255,255,255,0.03), inset 0 0 120px rgba(0,0,0,0.84), 0 28px 88px rgba(0,0,0,0.34)",
    lpHighlightOpacity: "0.75",
    glowOpacity: "0.15",
    progressGlowOpacity: "0.16",
    pingGlowOpacity: "0.11",
    glass: "rgba(18,24,31,0.28)",
    glassStrong: "rgba(230,238,248,0.09)",
    connectorLine: "rgba(226,234,242,0.42)",
    archiveLabel: "밤의 기록",
  },
};

const FIXED_LIGHT_THEME: EnvironmentTheme = {
  ...TIME_THEMES.day,
  background: "#f7f8fa",
  backgroundImage: "linear-gradient(145deg,#ffffff 0%,#f7f8fa 52%,#f0f2f4 100%)",
  accent: "#555555",
  accentRgb: "70,70,70",
  glowRgb: "70,70,70",
  connectorLine: "rgba(70,70,70,0.42)",
};

function getTimeTheme(timeValue: number): EnvironmentTheme {
  const hour = Math.floor(timeValue);
  if (hour >= 5 && hour < 7) return TIME_THEMES.dawn;
  if (hour >= 7 && hour < 12) return TIME_THEMES.morning;
  if (hour >= 12 && hour < 17) return TIME_THEMES.day;
  if (hour >= 17 && hour < 20) return TIME_THEMES.sunset;
  if (hour >= 20 && hour < 23) return TIME_THEMES.evening;
  return TIME_THEMES.night;
}

function getPosition(hour: number, radius = RADIUS) {
  const angle = (hour / 24) * 360 - 90;
  const radian = (angle * Math.PI) / 180;

  return {
    x: roundCoordinate(CENTER + radius * Math.cos(radian)),
    y: roundCoordinate(CENTER + radius * Math.sin(radian)),
  };
}

function getTrackPosition(index: number, total: number, radius = PING_RADIUS) {
  return getPosition((index / Math.max(total, 1)) * 24, radius);
}

function getExpansion(songIndex: number) {
  const distance = 74 + songIndex * 10;
  return {
    x: distance,
    y: songIndex * 12 - 14,
  };
}

function getFanPosition(timeValue: number, index: number, total: number) {
  const baseAngle = (timeValue / 24) * 360 - 90;
  const spread = Math.min(92, 28 + total * 24);
  const step = total <= 1 ? 0 : spread / (total - 1);
  const offset = total <= 1 ? 0 : -spread / 2 + index * step;
  const distance = 70 + Math.min(index, 2) * 8;
  const radian = ((baseAngle + offset) * Math.PI) / 180;

  return {
    x: roundCoordinate(distance * Math.cos(radian)),
    y: roundCoordinate(distance * Math.sin(radian)),
  };
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(3));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSongMinute(song: TimeMapSong | null) {
  if (typeof song?.timeMinute === "number") {
    return Math.min(59, Math.max(0, song.timeMinute));
  }

  if (!song?.createdAt) return 0;

  const parsedDate = new Date(song.createdAt);
  if (Number.isNaN(parsedDate.getTime())) return 0;

  return parsedDate.getMinutes();
}

function normalizeNickname(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function toTimeMapSongs(songs: CircularSong[], season: ViewSeason): TimeMapSong[] {
  return songs.map((song, index) => {
    const [hour, minute] = (song.time ?? "").split(":").map(Number);
    const fallbackTime = (index / Math.max(songs.length, 1)) * 24;
    const timeValue =
      season === 3 && Number.isInteger(hour) && Number.isInteger(minute)
        ? hour + minute / 60
        : fallbackTime;
    const timeSlot = Math.floor(timeValue);
    const timeMinute = Math.round((timeValue - timeSlot) * 60) % 60;

    return {
      id: Number(song.id),
      season,
      trackOrder: song.trackOrder,
      nickname: song.nickname,
      youtubeUrl: song.youtubeUrl,
      comment: song.comment,
      thumbnailUrl: song.thumbnailUrl ?? "",
      title: song.title,
      votes: song.votes,
      voters: song.voters,
      createdAt: song.createdAt,
      timeSlot,
      timeMinute,
    };
  });
}

function getSongTimeValue(song: TimeMapSong) {
  return Math.min(23.99, Math.max(0, song.timeSlot + getSongMinute(song) / 60));
}

function formatSongTime(song: TimeMapSong | null) {
  if (!song) return "--:--";

  return `${String(song.timeSlot).padStart(2, "0")}:${String(getSongMinute(song)).padStart(2, "0")}`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getSongThumbnail(thumbnailUrl: string) {
  return thumbnailUrl.trim() || FALLBACK_THUMBNAIL_PATH;
}

function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    if (hostname.endsWith("youtube.com")) {
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/").filter(Boolean)[1] ?? "";
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/").filter(Boolean)[1] ?? "";
      }

      return parsedUrl.searchParams.get("v") ?? "";
    }

    return "";
  } catch {
    return "";
  }
}

function parseSongVoters(value: SongRow["voters"]) {
  if (Array.isArray(value)) {
    return value.filter((voter): voter is string => typeof voter === "string");
  }

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((voter): voter is string => typeof voter === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeSeason(value: number | null | undefined): ViewSeason {
  return value === 1 || value === 2 || value === 3 || value === CURRENT_SEASON
    ? value
    : CURRENT_SEASON;
}

function toSeasonThreeTime(row: SongRow) {
  if (Number(row.season) !== 3) return undefined;

  const hour = Number(row.time_slot);
  const minute = Number(row.time_minute);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return undefined;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function orderSongsForSeason(songs: CircularSong[], season: ViewSeason) {
  const sortedSongs = [...songs].sort((a, b) => {
    if (season === 3) {
      const byTime = (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
      if (byTime !== 0) return byTime;
    } else {
      const byVotes = b.votes - a.votes;
      if (byVotes !== 0) return byVotes;
    }

    return (
      new Date(a.createdAt ?? 0).getTime() -
      new Date(b.createdAt ?? 0).getTime()
    );
  });

  return sortedSongs.map((song, index) => ({
    ...song,
    trackOrder: index + 1,
  }));
}

function toCircularSong(row: SongRow): CircularSong {
  const season = normalizeSeason(Number(row.season));

  return {
    id: String(row.id),
    season,
    nickname: row.nickname?.trim() ?? "",
    title: row.title?.trim() || "제목을 불러오지 못한 곡",
    comment: row.comment ?? "",
    youtubeUrl: row.youtube_url?.trim() ?? "",
    thumbnailUrl: row.thumbnail_url?.trim() || undefined,
    votes: Math.max(0, row.votes ?? 0),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    time: toSeasonThreeTime(row),
    trackOrder: 0,
    voters: parseSongVoters(row.voters),
  };
}

function DigitalTime({ value }: { value: string }) {
  return (
    <p
      className="font-mono text-[34px] font-black leading-none tabular-nums text-[var(--theme-text)]"
      style={{
        fontFamily: `${UI_FONT_STACK}, monospace`,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.08em",
        filter:
          "drop-shadow(0 0 6px rgba(var(--theme-accent-rgb),0.18))",
      }}
    >
      {value}
    </p>
  );
}

export default function CircularTimeMap() {
  const playerRef = useRef<any>(null);
  const pendingPlayRef = useRef(false);
  const readyVideoIdRef = useRef("");
  const transitionLockRef = useRef(false);
  const queueRef = useRef<TimeMapSong[]>([]);
  const commentPreviewRef = useRef<HTMLParagraphElement | null>(null);
  const [season, setSeason] = useState<ViewSeason>(CURRENT_SEASON);
  const [allSongs, setAllSongs] = useState<CircularSong[]>([]);
  const [displaySongs, setDisplaySongs] = useState<TimeMapSong[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentClockTime, setCurrentClockTime] = useState({
    timeValue: 14,
    minute: 0,
  });
  const [centerLabelImagePath, setCenterLabelImagePath] = useState(() =>
    getCenterLabelImagePath(CURRENT_SEASON)
  );
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [listSort, setListSort] = useState<"latest" | "popular">("popular");
  const [isLikedOnly, setIsLikedOnly] = useState(false);
  const [isFrissonLetterOpen, setIsFrissonLetterOpen] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<TimeMapSong | null>(null);
  const [playingSong, setPlayingSong] = useState<TimeMapSong | null>(null);
  const [playerMountVideoId, setPlayerMountVideoId] = useState("");
  const [nowPlayingSong, setNowPlayingSong] = useState<TimeMapSong | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [hasSeenCenterPlayHint, setHasSeenCenterPlayHint] = useState(false);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [canExpandComment, setCanExpandComment] = useState(false);
  const [songsLoadError, setSongsLoadError] = useState("");
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [likedSongIds, setLikedSongIds] = useState<Set<number>>(
    () => new Set()
  );
  const seasonOptions = useMemo(
    () => [1, 2, 3, CURRENT_SEASON] as ViewSeason[],
    []
  );
  useEffect(() => {
    setCenterLabelImagePath(getCenterLabelImagePath(season));
  }, [season]);
  const currentUserSeasonSong = useMemo(() => {
    const normalizedCurrentNickname = normalizeNickname(currentNickname);
    if (!normalizedCurrentNickname) return null;

    return (
      allSongs.find(
        (song) =>
          song.season === CURRENT_SEASON &&
          normalizeNickname(song.nickname) === normalizedCurrentNickname
      ) ?? null
    );
  }, [allSongs, currentNickname]);
  const shouldShowSubmitControl = season === CURRENT_SEASON;
  const submitHref = currentUserSeasonSong
    ? `/submit?edit=${encodeURIComponent(currentUserSeasonSong.id)}`
    : "/submit";

  const selectedTimeLabel = formatSongTime(selectedSong);
  const selectedVoteCount = selectedSong
    ? Math.max(0, selectedSong.votes ?? 0)
    : 0;
  const isSelectedLiked = selectedSong
    ? likedSongIds.has(selectedSong.id)
    : false;
  const selectedTimeValue = selectedSong
    ? getSongTimeValue(selectedSong)
    : currentClockTime.timeValue;
  const playingVideoId = playingSong
    ? getYouTubeVideoId(playingSong.youtubeUrl)
    : "";
  const isDisplayedRecordPlaying =
    isPlaying && playingSong !== null && playingSong.season === season;
  const nowPlayingTitle = nowPlayingSong
    ? getNowPlayingTitle(nowPlayingSong.title)
    : "";
  const currentTheme = FIXED_LIGHT_THEME;
  const environmentTheme = FIXED_LIGHT_THEME;
  const selectedPingPosition = getPosition(selectedTimeValue, PING_RADIUS);
  const selectedAngle = (selectedTimeValue / 24) * Math.PI * 2 - Math.PI / 2;
  const outwardVector = {
    x: Math.cos(selectedAngle),
    y: Math.sin(selectedAngle),
  };
  const selectedCardSide = selectedTimeValue > 12 ? "left" : "right";
  const sideDirection = selectedCardSide === "right" ? 1 : -1;
  const rawCardCenter = {
    x:
      CENTER +
      sideDirection *
        Math.max(CARD_OUTWARD_DISTANCE, Math.abs(outwardVector.x) * CARD_OUTWARD_DISTANCE),
    y: CENTER + outwardVector.y * CARD_OUTWARD_DISTANCE,
  };
  const rightCardLeftEdge = Math.max(
    rawCardCenter.x - FLOATING_CARD_WIDTH / 2,
    CENTER + RECORD_OUTER_RADIUS + CARD_RIM_GAP
  );
  const leftCardRightEdge = Math.min(
    rawCardCenter.x + FLOATING_CARD_WIDTH / 2,
    CENTER - RECORD_OUTER_RADIUS - CARD_RIM_GAP
  );
  const cardAnchorX =
    selectedCardSide === "right" ? rightCardLeftEdge : leftCardRightEdge;
  const cardCenter = {
    x:
      selectedCardSide === "right"
        ? cardAnchorX + FLOATING_CARD_WIDTH / 2
        : cardAnchorX - FLOATING_CARD_WIDTH / 2,
    y: clamp(
      rawCardCenter.y,
      FLOATING_CARD_HALF_HEIGHT,
      SIZE - FLOATING_CARD_HALF_HEIGHT
    ),
  };
  const cardTop = cardCenter.y;
  const dxToCard = cardCenter.x - selectedPingPosition.x;
  const dyToCard = cardCenter.y - selectedPingPosition.y;
  const absDxToCard = Math.max(Math.abs(dxToCard), 1);
  const absDyToCard = Math.max(Math.abs(dyToCard), 1);
  const hitVerticalSide =
    absDxToCard / (FLOATING_CARD_WIDTH / 2) >=
    absDyToCard / FLOATING_CARD_HALF_HEIGHT;
  const cardBorderX = hitVerticalSide
    ? cardCenter.x + (dxToCard > 0 ? -FLOATING_CARD_WIDTH / 2 : FLOATING_CARD_WIDTH / 2)
    : cardCenter.x + (dxToCard / absDyToCard) * FLOATING_CARD_HALF_HEIGHT;
  const cardBorderY = hitVerticalSide
    ? cardCenter.y + (dyToCard / absDxToCard) * (FLOATING_CARD_WIDTH / 2)
    : cardCenter.y + (dyToCard > 0 ? -FLOATING_CARD_HALF_HEIGHT : FLOATING_CARD_HALF_HEIGHT);
  const connectorKnee = {
    x: selectedPingPosition.x + dxToCard * 0.42,
    y: selectedPingPosition.y + dyToCard * 0.28,
  };
  const connectorEnd = {
    x: cardBorderX,
    y: cardBorderY,
  };
  const hasOpenFan = expandedSlot !== null;
  const hasOpenDropdown = isSearchOpen || isRankingOpen || isListOpen;

  function getSongsForSeason(targetSeason: ViewSeason): CircularSong[] {
    return allSongs.filter((song) => song.season === targetSeason);
  }

  function closePrimaryOverlays() {
    setIsSearchOpen(false);
    setIsRankingOpen(false);
    setIsListOpen(false);
    setIsCommentExpanded(false);
  }

  function openSearchPanel() {
    setIsSearchOpen(true);
    setIsRankingOpen(false);
    setIsListOpen(false);
    setIsCommentExpanded(false);
    setIsCardOpen(false);
  }

  function toggleListPanel() {
    const shouldOpenList = !isListOpen;
    setIsListOpen(shouldOpenList);
    setIsSearchOpen(false);
    setIsRankingOpen(false);
    setIsCommentExpanded(false);
  }

  function clearPlaylistSearch() {
    setPlaylistSearch("");
    setIsSearchOpen(false);
    setIsRankingOpen(false);
  }

  function getTimeMapSongsForSeason(targetSeason: ViewSeason) {
    return toTimeMapSongs(getSongsForSeason(targetSeason), targetSeason);
  }

  function stopYouTubePlayback() {
    if (!playerRef.current) return;

    try {
      playerRef.current.stopVideo?.();
    } catch {
      // Ignore player lifecycle races while the hidden iframe is changing songs.
    }

    setIsPlaying(false);
    setNowPlayingSong(null);
    setPlayingSong(null);
    pendingPlayRef.current = false;
  }

  function preparePlayerForPlayback(player = playerRef.current) {
    try {
      player?.unMute?.();
      player?.setVolume?.(100);
    } catch {
      // YouTube can briefly reject commands while swapping videos.
    }
  }

  function requestVideoPlayback(videoId: string, player = playerRef.current) {
    if (!videoId || !player) {
      pendingPlayRef.current = true;
      return false;
    }

    try {
      preparePlayerForPlayback(player);

      if (readyVideoIdRef.current === videoId) {
        player.playVideo?.();
      } else {
        readyVideoIdRef.current = videoId;
        player.loadVideoById?.(videoId);
      }

      return true;
    } catch {
      pendingPlayRef.current = true;
      setIsPlaying(false);
      return false;
    }
  }

  function switchTrack(song: TimeMapSong, queue = sortedPlaylistSongs) {
    const videoId = getYouTubeVideoId(song.youtubeUrl);
    if (!videoId) {
      alert("이 YouTube URL은 바로 재생할 수 없습니다. YouTube에서 듣기를 이용해주세요.");
      return;
    }

    queueRef.current = queue.length > 0 ? queue : [song];
    transitionLockRef.current = false;
    pendingPlayRef.current = true;
    setSelectedSong(song);
    setPlayingSong(song);
    setIsPlaying(false);
    setIsCardOpen(false);
    requestVideoPlayback(videoId);
  }

  function selectSong(song: TimeMapSong) {
    if (song.season !== season) {
      setSeason(song.season);
      setDisplaySongs(getTimeMapSongsForSeason(song.season));
    }

    setSelectedSong(song);
    setIsCardOpen(false);
    closePrimaryOverlays();
    queueRef.current =
      song.season === season
        ? sortedPlaylistSongs
        : getTimeMapSongsForSeason(song.season);
    transitionLockRef.current = false;
  }

  function handleBackgroundClick() {
    if (isCardOpen) {
      closePrimaryOverlays();
      setIsCardOpen(false);
      return;
    }

    setExpandedSlot(null);
    closePrimaryOverlays();
  }

  function handleYouTubeReady(event: YouTubeEvent) {
    playerRef.current = event.target;
    const mountedVideoId = playerMountVideoId || playingVideoId;
    const targetVideoId = playingVideoId || mountedVideoId;
    readyVideoIdRef.current = mountedVideoId;

    preparePlayerForPlayback(event.target);

    if (pendingPlayRef.current && targetVideoId) {
      requestVideoPlayback(targetVideoId, event.target);
    }
  }

  function handleYouTubeStateChange(event: { data: number }) {
    if (event.data === 1) {
      transitionLockRef.current = false;
      pendingPlayRef.current = false;
      setIsPlaying(true);
      setNowPlayingSong(playingSong);
      return;
    }

    if (event.data === 0 && !transitionLockRef.current) {
      transitionLockRef.current = true;
      setIsPlaying(false);
      const queue =
        queueRef.current.length > 0 ? queueRef.current : sortedPlaylistSongs;
      if (queue.length === 0) {
        setNowPlayingSong(null);
        return;
      }
      const currentIndex = queue.findIndex((song) => song.id === playingSong?.id);
      const nextSong =
        queue[((currentIndex >= 0 ? currentIndex : -1) + 1) % queue.length];

      if (nextSong) {
        switchTrack(nextSong, queue);
      } else {
        setNowPlayingSong(null);
      }
      return;
    }

    if ((event.data === 2 || event.data === 5) && pendingPlayRef.current) {
      requestVideoPlayback(playingVideoId);
      return;
    }

    if (event.data === 2 || event.data === 5) {
      setIsPlaying(false);
    }
  }

  function handleSelectedSongPlayPause() {
    if (!selectedSong) return;

    const videoId = getYouTubeVideoId(selectedSong.youtubeUrl);
    if (!videoId) {
      alert("이 YouTube URL은 바로 재생할 수 없습니다. YouTube에서 듣기를 이용해주세요.");
      return;
    }

    if (playingSong?.id !== selectedSong.id) {
      switchTrack(selectedSong, sortedPlaylistSongs);
      return;
    }

    if (!playerRef.current || readyVideoIdRef.current !== videoId) {
      pendingPlayRef.current = true;
      return;
    }

    try {
      const playerState = playerRef.current.getPlayerState?.();

      if (playerState === 1) {
        playerRef.current.pauseVideo?.();
        return;
      }

      requestVideoPlayback(videoId);
    } catch {
      pendingPlayRef.current = true;
      setIsPlaying(false);
    }
  }

  function togglePlayingSongPlayPause() {
    if (!playingSong) return;

    const videoId = getYouTubeVideoId(playingSong.youtubeUrl);
    if (!videoId) return;

    if (!playerRef.current || readyVideoIdRef.current !== videoId) {
      pendingPlayRef.current = true;
      return;
    }

    try {
      const playerState = playerRef.current.getPlayerState?.();

      if (playerState === 1) {
        playerRef.current.pauseVideo?.();
        return;
      }

      requestVideoPlayback(videoId);
    } catch {
      pendingPlayRef.current = true;
      setIsPlaying(false);
    }
  }

  function selectSeason(nextSeason: ViewSeason) {
    setSeason(nextSeason);
    setDisplaySongs(getTimeMapSongsForSeason(nextSeason));
    setSelectedSong(null);
    setExpandedSlot(null);
    setIsCardOpen(false);
    closePrimaryOverlays();
    // The playing iframe and its queue intentionally remain active until a new song is played.
  }

  function toggleLikedOnly() {
    if (!isLikedOnly && !currentNickname?.trim()) {
      alert("내 Like만 보려면 먼저 닉네임을 입력해주세요.");
      return;
    }
    setIsLikedOnly((current) => !current);
  }

  async function toggleSongLike(song: TimeMapSong) {
    const nickname = (currentNickname ?? sessionStorage.getItem("nickname"))?.trim();

    if (!nickname) {
      alert("먼저 닉네임을 입력하세요!");
      return;
    }

    if (normalizeNickname(song.nickname) === normalizeNickname(nickname)) {
      alert("자기 곡에는 투표할 수 없습니다.");
      return;
    }

    const voters = song.voters ?? [];
    const wasLiked = voters.includes(nickname);
    const updatedVoters = wasLiked
      ? voters.filter((voter) => voter !== nickname)
      : [...voters, nickname];
    const updatedVotes = wasLiked
      ? Math.max((song.votes ?? 0) - 1, 0)
      : (song.votes ?? 0) + 1;
    const nextSong = {
      ...song,
      voters: updatedVoters,
      votes: updatedVotes,
    };
    const applyTimeMapSongUpdate = (targetSong: TimeMapSong) => {
      setDisplaySongs((currentSongs) =>
        currentSongs.map((currentSong) =>
          currentSong.id === song.id ? targetSong : currentSong
        )
      );
      setSelectedSong((currentSong) =>
        currentSong?.id === song.id ? targetSong : currentSong
      );
      setPlayingSong((currentSong) =>
        currentSong?.id === song.id ? targetSong : currentSong
      );
      setNowPlayingSong((currentSong) =>
        currentSong?.id === song.id ? targetSong : currentSong
      );
    };
    const applyCircularSongUpdate = (votes: number, voters: string[]) => {
      setAllSongs((currentSongs) =>
        currentSongs.map((currentSong) =>
          Number(currentSong.id) === song.id
            ? {
                ...currentSong,
                votes,
                voters,
              }
            : currentSong
        )
      );
    };

    applyTimeMapSongUpdate(nextSong);
    applyCircularSongUpdate(updatedVotes, updatedVoters);

    const { error } = await supabase
      .from(SONGS_TABLE)
      .update({
        votes: updatedVotes,
        voters: updatedVoters,
      })
      .eq("id", song.id);

    if (error) {
      console.warn("Failed to update song like:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      applyTimeMapSongUpdate(song);
      applyCircularSongUpdate(song.votes ?? 0, voters);
      alert("Like 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    setCurrentClockTime({
      timeValue: Math.min(23.99, hour + minute / 60),
      minute,
    });
    setHasSeenCenterPlayHint(
      sessionStorage.getItem("frisson-label-play-hint-seen") === "true"
    );
  }, []);

  useEffect(() => {
    const previousBodyBackgroundColor = document.body.style.backgroundColor;
    const previousBodyBackgroundImage = document.body.style.backgroundImage;
    const previousHtmlBackgroundColor = document.documentElement.style.backgroundColor;
    const previousHtmlBackgroundImage = document.documentElement.style.backgroundImage;

    document.body.style.backgroundColor = environmentTheme.background;
    document.body.style.backgroundImage = environmentTheme.backgroundImage;
    document.documentElement.style.backgroundColor = environmentTheme.background;
    document.documentElement.style.backgroundImage = environmentTheme.backgroundImage;

    return () => {
      document.body.style.backgroundColor = previousBodyBackgroundColor;
      document.body.style.backgroundImage = previousBodyBackgroundImage;
      document.documentElement.style.backgroundColor = previousHtmlBackgroundColor;
      document.documentElement.style.backgroundImage = previousHtmlBackgroundImage;
    };
  }, [environmentTheme.background, environmentTheme.backgroundImage]);

  useEffect(() => {
    setCurrentNickname(sessionStorage.getItem("nickname"));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadSongs() {
      setSongsLoadError("");
      const { data, error } = await supabase
        .from(SONGS_TABLE)
        .select("*")
        .order("season", { ascending: true })
        .order("created_at", { ascending: true });

      if (isCancelled) return;

      if (error) {
        const message = error.message || "곡 데이터를 불러오지 못했습니다.";
        console.warn("Failed to load songs:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setSongsLoadError(message);
        setAllSongs([]);
        return;
      }

      const rows = ((data ?? []) as SongRow[]).map(toCircularSong);
      const orderedSongs = seasonOptions.flatMap((seasonNumber) =>
        orderSongsForSeason(
          rows.filter((song) => song.season === seasonNumber),
          seasonNumber
        )
      );
      setAllSongs(orderedSongs);
    }

    loadSongs();
    window.addEventListener("focus", loadSongs);
    window.addEventListener("pageshow", loadSongs);

    return () => {
      isCancelled = true;
      window.removeEventListener("focus", loadSongs);
      window.removeEventListener("pageshow", loadSongs);
    };
  }, [seasonOptions]);

  useEffect(() => {
    setDisplaySongs(toTimeMapSongs(getSongsForSeason(season), season));
  }, [allSongs, season]);

  useEffect(() => {
    function updateViewportSize() {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  useEffect(() => {
    document.title =
      nowPlayingSong
        ? getNowPlayingDocumentTitle(nowPlayingSong.title)
        : DEFAULT_DOCUMENT_TITLE;

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [nowPlayingSong]);

  useEffect(() => {
    if (!currentNickname) {
      setLikedSongIds(new Set());
      return;
    }

    setLikedSongIds(
      new Set(
        displaySongs
          .filter((song) =>
            (song.voters ?? []).some(
              (voter) => voter.trim() === currentNickname.trim()
            )
          )
          .map((song) => song.id)
      )
    );
  }, [currentNickname, displaySongs]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isFrissonLetterOpen) {
          setIsFrissonLetterOpen(false);
          return;
        }

        setIsCardOpen(false);
        setExpandedSlot(null);
        closePrimaryOverlays();
      }

      if (event.code !== "Space") return;
      if (event.repeat) return;
      if (isEditableShortcutTarget(event.target)) return;
      if (isFrissonLetterOpen) return;
      if (!playingSong) return;

      event.preventDefault();
      togglePlayingSongPlayPause();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (!playingVideoId) {
      readyVideoIdRef.current = "";
      setPlayerMountVideoId("");
      setIsPlaying(false);
      return;
    }

    if (!playerMountVideoId) {
      setPlayerMountVideoId(playingVideoId);
      return;
    }

    if (!playerRef.current || !pendingPlayRef.current) {
      setIsPlaying(false);
      return;
    }

    requestVideoPlayback(playingVideoId);
  }, [playerMountVideoId, playingVideoId]);

  const sortedPlaylistSongs = useMemo(() => {
    const songs = isLikedOnly
      ? displaySongs.filter((song) => likedSongIds.has(song.id))
      : [...displaySongs];
    if (listSort === "latest") {
      return songs.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }
    return songs.sort(
      (a, b) =>
        (b.votes ?? 0) - (a.votes ?? 0) ||
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
  }, [displaySongs, isLikedOnly, likedSongIds, listSort]);

  const isEmpty = sortedPlaylistSongs.length === 0;

  const allSeasonSongs = useMemo(
    () =>
      seasonOptions.flatMap((seasonNumber) =>
        toTimeMapSongs(
          allSongs.filter((song) => song.season === seasonNumber),
          seasonNumber
        )
      ),
    [allSongs, seasonOptions]
  );

  useEffect(() => {
    if (playingSong?.season === season) {
      queueRef.current = sortedPlaylistSongs;
    }
  }, [playingSong?.season, season, sortedPlaylistSongs]);

  const indicatorSong = selectedSong ?? playingSong ?? sortedPlaylistSongs[0] ?? null;
  const indicatorIndex = indicatorSong
    ? sortedPlaylistSongs.findIndex((song) => song.id === indicatorSong.id)
    : 0;
  const indicatorAngle = (Math.max(indicatorIndex, 0) / Math.max(sortedPlaylistSongs.length, 1)) * 360;
  const indicatorProgress = Math.max(indicatorIndex, 0) / Math.max(sortedPlaylistSongs.length, 1);

  const filteredPlaylistSongs = useMemo(() => {
    const query = normalizeSearchValue(playlistSearch);

    return allSeasonSongs.filter((song) => {
      if (!query) return true;
      return (
        normalizeSearchValue(song.nickname).includes(query) ||
        normalizeSearchValue(song.title).includes(query) ||
        normalizeSearchValue(song.comment).includes(query)
      );
    });
  }, [allSeasonSongs, playlistSearch]);

  const rankedSongs = useMemo(() => {
    return [...displaySongs].sort((a, b) => {
      const voteDifference = (b.votes ?? 0) - (a.votes ?? 0);

      if (voteDifference !== 0) return voteDifference;

      return getSongTimeValue(a) - getSongTimeValue(b);
    });
  }, [displaySongs]);

  const listSongs = useMemo(() => {
    const query = normalizeSearchValue(playlistSearch);
    const songs = sortedPlaylistSongs.filter((song) =>
      !query ||
      normalizeSearchValue(song.title).includes(query) ||
      normalizeSearchValue(song.nickname).includes(query) ||
      normalizeSearchValue(song.comment).includes(query)
    );
    return songs;
  }, [listSort, playlistSearch, sortedPlaylistSongs]);

  const playlistGroups = useMemo(() => {
    return filteredPlaylistSongs.reduce<
      Array<{ season: ViewSeason; songs: TimeMapSong[] }>
    >((groups, song) => {
      const currentGroup = groups[groups.length - 1];

      if (currentGroup?.season === song.season) {
        currentGroup.songs.push(song);
      } else {
        groups.push({ season: song.season, songs: [song] });
      }

      return groups;
    }, []).sort((a, b) => a.season - b.season);
  }, [filteredPlaylistSongs]);

  const pingGroups = useMemo(() => {
    const total = sortedPlaylistSongs.length;
    return sortedPlaylistSongs.map((song, index) => ({
        slot: song.id,
        songs: [song],
        index,
        total,
        timeValue: (index / Math.max(total, 1)) * 24,
        radius: PING_RADIUS,
      }));
  }, [sortedPlaylistSongs]);

  const youtubePlayerOptions: YouTubeProps["opts"] = {
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 0,
      controls: 0,
      rel: 0,
      playsinline: 1,
    },
  };

  const floatingSong = selectedSong ?? playingSong;
  const floatingComment = floatingSong?.comment?.trim() ?? "";
  const floatingThumbnailUrl = floatingSong?.thumbnailUrl.trim() ?? "";
  const showTopPlayHint = !floatingSong && !hasSeenCenterPlayHint;
  const recordPixelSize =
    viewportSize.width > 0 && viewportSize.height > 0
      ? Math.max(
          320,
          Math.min(viewportSize.width * 0.68, viewportSize.height * 0.68, 720)
        )
      : 0;

  useEffect(() => {
    setIsCommentExpanded(false);
    setCanExpandComment(false);
  }, [floatingSong?.id]);

  useEffect(() => {
    if (!floatingComment) {
      setCanExpandComment(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const element = commentPreviewRef.current;
      if (!element) return;
      setCanExpandComment(element.scrollWidth > element.clientWidth + 1);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [floatingComment, viewportSize.width]);

  function movePlaylist(direction: 1 | -1) {
    const currentSong = playingSong ?? selectedSong;
    if (!currentSong) {
      if (sortedPlaylistSongs[0]) switchTrack(sortedPlaylistSongs[0], sortedPlaylistSongs);
      return;
    }

    const queue = queueRef.current.length > 0 ? queueRef.current : sortedPlaylistSongs;
    const currentIndex = queue.findIndex((song) => song.id === currentSong.id);
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + direction + queue.length) % queue.length
        : direction === 1
          ? 0
          : queue.length - 1;
    const nextSong = queue[nextIndex];

    if (!nextSong) return;
    switchTrack(nextSong, queue);
  }

  function handleFloatingPlayPause() {
    if (!selectedSong && playingSong) {
      setSelectedSong(playingSong);
      const videoId = getYouTubeVideoId(playingSong.youtubeUrl);
      if (!playerRef.current || readyVideoIdRef.current !== videoId) {
        pendingPlayRef.current = true;
        return;
      }
      try {
        if (isPlaying) {
          playerRef.current?.pauseVideo?.();
        } else {
          requestVideoPlayback(videoId);
        }
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    handleSelectedSongPlayPause();
  }

  function handleCenterLabelPlayPause() {
    if (!floatingSong) return;

    setHasSeenCenterPlayHint(true);
    sessionStorage.setItem("frisson-label-play-hint-seen", "true");
    handleFloatingPlayPause();
  }

  return (
    <section
      onClick={handleBackgroundClick}
      data-environment={currentTheme.name}
      className="relative min-h-screen overflow-hidden px-5 py-6 text-[var(--theme-text)] transition-colors duration-[850ms] ease-out sm:px-8 lg:px-10"
      style={
        {
          fontFamily: UI_FONT_STACK,
          "--record-size": "clamp(320px, min(68vw, 68vh, 720px), 720px)",
          "--theme-bg": environmentTheme.background,
          "--theme-text": environmentTheme.text,
          "--theme-muted": environmentTheme.mutedText,
          "--theme-faint": environmentTheme.faintText,
          "--theme-accent": currentTheme.accent,
          "--theme-accent-rgb": currentTheme.accentRgb,
          "--theme-glow-rgb": currentTheme.glowRgb,
          "--theme-panel": environmentTheme.panel,
          "--theme-panel-strong": environmentTheme.panelStrong,
          "--theme-border": environmentTheme.border,
          "--theme-grid": environmentTheme.grid,
          "--theme-glass": environmentTheme.glass,
          "--theme-glass-strong": environmentTheme.glassStrong,
          "--connector-line": environmentTheme.connectorLine,
          "--theme-radial-a": environmentTheme.radialA,
          "--theme-radial-b": environmentTheme.radialB,
          "--theme-radial-c": environmentTheme.radialC,
          "--theme-accent-wash": environmentTheme.accentWash,
          "--lp-shadow": environmentTheme.lpShadow,
          "--lp-highlight-opacity": environmentTheme.lpHighlightOpacity,
          "--glow-opacity": environmentTheme.glowOpacity,
          "--progress-glow-opacity": environmentTheme.progressGlowOpacity,
          "--ping-glow-opacity": environmentTheme.pingGlowOpacity,
          backgroundColor: "var(--theme-bg)",
          backgroundImage: environmentTheme.backgroundImage,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_48%,var(--theme-radial-a),transparent_38%),radial-gradient(circle_at_18%_12%,var(--theme-radial-b),transparent_24%),radial-gradient(circle_at_82%_88%,var(--theme-radial-c),transparent_31%),linear-gradient(135deg,var(--theme-accent-wash),transparent_36%)] transition-colors duration-[850ms] ease-out" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(var(--theme-grid)_1px,transparent_1px),linear-gradient(90deg,var(--theme-grid)_1px,transparent_1px)] bg-[size:76px_76px] opacity-35 transition-colors duration-[850ms] ease-out" />
      {floatingThumbnailUrl && (
        <div
          key={`page-${floatingSong?.id}`}
          className="pointer-events-none fixed inset-[-55%] z-[1] bg-cover bg-center opacity-[0.3] transition-opacity duration-300"
          style={{
            backgroundImage: `url(${floatingThumbnailUrl})`,
            backgroundRepeat: "no-repeat",
            filter: "blur(40px) saturate(1.08)",
            maskImage:
              "radial-gradient(circle at 50% 52%, black 0%, black 42%, transparent 78%)",
            transform: "scale(1.1)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 52%, black 0%, black 42%, transparent 78%)",
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 min-h-[calc(100vh-48px)]">
        <div
          className="fixed left-5 top-5 z-[420] sm:left-8 sm:top-6"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--theme-faint)] transition-colors duration-[650ms]">
            Frisson Season {season}
          </p>
          <div className="relative mt-3 grid h-[148px] w-10 grid-rows-4 items-center justify-items-center overflow-hidden rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] p-1 text-xs font-bold tabular-nums shadow-[0_10px_24px_rgba(28,40,52,0.08)] backdrop-blur-2xl transition-colors duration-[650ms]">
            <span
              className="absolute left-1 top-1 w-8 rounded-full bg-[var(--theme-glass-strong)] shadow-[0_6px_14px_rgba(28,40,52,0.08)] transition-transform duration-[250ms] ease-out"
              style={{
                height: "calc((100% - 8px) / 4)",
                transform: `translateY(calc(${Math.max(
                  0,
                  seasonOptions.indexOf(season)
                )} * 100%))`,
              }}
              aria-hidden="true"
            />
            {seasonOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectSeason(item)}
                aria-label={`시즌 ${item} 선택`}
                aria-pressed={season === item}
                className={`relative z-10 flex h-full w-8 items-center justify-center bg-transparent text-center text-xs font-bold tabular-nums tracking-normal transition duration-200 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.16)] ${
                  season === item
                    ? "text-[var(--theme-text)]"
                    : "text-[var(--theme-faint)]"
                }`}
              >
                {String(item).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
        <div
          className="fixed left-1/2 top-[48px] z-[420] -translate-x-1/2 lg:hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="inline-flex rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] p-1 shadow-[0_8px_18px_rgba(28,40,52,0.07)] backdrop-blur-xl">
            {([
              ["popular", "인기순"],
              ["latest", "최신순"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setListSort(value)}
                aria-pressed={listSort === value}
                className={`h-9 min-w-14 rounded-full px-3 text-xs font-semibold transition ${
                  listSort === value
                    ? "bg-[var(--theme-glass-strong)] text-[var(--theme-text)]"
                    : "text-[var(--theme-faint)] hover:text-[var(--theme-text)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {currentNickname && (
          <div className="pointer-events-none fixed right-5 top-5 z-[420] max-w-[42vw] truncate text-right text-xs font-semibold text-[var(--theme-faint)] transition-colors duration-[650ms] sm:right-8">
            @{currentNickname}
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleLikedOnly();
          }}
          aria-pressed={isLikedOnly}
          className={`fixed right-5 top-[53px] z-[420] flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold shadow-[0_8px_18px_rgba(28,40,52,0.07)] backdrop-blur-xl transition sm:right-8 lg:hidden ${
            isLikedOnly
              ? "border-[rgba(var(--theme-accent-rgb),0.36)] bg-[rgba(var(--theme-accent-rgb),0.14)] text-[var(--theme-text)]"
              : "border-[var(--theme-border)] bg-[var(--theme-glass)] text-[var(--theme-faint)] hover:text-[var(--theme-text)]"
          }`}
        >
          <Heart size={14} fill={isLikedOnly ? "currentColor" : "none"} />
          내 Like만
        </button>
        <div
          className="fixed right-8 top-[53px] z-[420] hidden items-center gap-3 lg:flex"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="inline-flex rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] p-1 shadow-[0_8px_18px_rgba(28,40,52,0.07)] backdrop-blur-xl">
            {([
              ["popular", "인기순"],
              ["latest", "최신순"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setListSort(value)}
                aria-pressed={listSort === value}
                className={`h-9 min-w-14 rounded-full px-3 text-xs font-semibold transition ${
                  listSort === value
                    ? "bg-[var(--theme-glass-strong)] text-[var(--theme-text)]"
                    : "text-[var(--theme-faint)] hover:text-[var(--theme-text)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleLikedOnly}
            aria-pressed={isLikedOnly}
            className={`flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold shadow-[0_8px_18px_rgba(28,40,52,0.07)] backdrop-blur-xl transition ${
              isLikedOnly
                ? "border-[rgba(var(--theme-accent-rgb),0.36)] bg-[rgba(var(--theme-accent-rgb),0.14)] text-[var(--theme-text)]"
                : "border-[var(--theme-border)] bg-[var(--theme-glass)] text-[var(--theme-faint)] hover:text-[var(--theme-text)]"
            }`}
          >
            <Heart size={14} fill={isLikedOnly ? "currentColor" : "none"} />
            내 Like만
          </button>
        </div>
        {(floatingSong || showTopPlayHint) && (
          <div className="pointer-events-none fixed left-1/2 top-[128px] z-[430] w-[min(560px,calc(100vw-48px))] -translate-x-1/2 text-center sm:top-[82px]">
            {floatingSong ? (
              <>
                <p className="truncate text-sm font-semibold leading-6 text-[var(--theme-text)] transition-colors duration-[650ms]">
                  {floatingSong.title}
                </p>
                {floatingComment && (
                  <>
                    <div className="mt-1 flex min-w-0 items-baseline justify-center gap-2">
                      <p
                        ref={commentPreviewRef}
                        className="min-w-0 truncate text-sm leading-6 text-[var(--theme-muted)] transition-colors duration-[650ms]"
                      >
                        “{floatingComment}”
                      </p>
                      {canExpandComment && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            closePrimaryOverlays();
                            setIsCommentExpanded(true);
                          }}
                          className="pointer-events-auto shrink-0 text-[11px] font-semibold text-[var(--theme-faint)] underline underline-offset-4 transition hover:text-[var(--theme-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-accent-rgb),0.18)]"
                        >
                          더 보기
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {isCommentExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                          onClick={(event) => event.stopPropagation()}
                          className="pointer-events-auto absolute left-1/2 top-[calc(100%+10px)] z-[430] w-[min(640px,calc(100vw-36px))] -translate-x-1/2 rounded-[16px] border border-[var(--theme-border)] bg-[rgba(248,250,252,0.92)] px-4 py-3 text-left text-sm leading-6 text-[var(--theme-muted)] shadow-[0_18px_48px_rgba(24,34,44,0.12)] backdrop-blur-2xl"
                        >
                          <p className="whitespace-pre-wrap break-words">
                            “{floatingComment}”
                          </p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setIsCommentExpanded(false);
                            }}
                            className="mt-2 text-[11px] font-semibold text-[var(--theme-faint)] underline underline-offset-4 transition hover:text-[var(--theme-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-accent-rgb),0.18)]"
                          >
                            닫기
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </>
            ) : (
              <p className="mx-auto max-w-[320px] text-sm font-medium leading-6 text-[var(--theme-faint)] transition-colors duration-[650ms] sm:max-w-none">
                닉네임을 누르고 LP의 라벨을 눌러 곡을 재생하세요.
              </p>
            )}
          </div>
        )}
        <div className="absolute left-0 right-0 top-0 flex items-start justify-between gap-8">
          <div
            className={`fixed bottom-[calc(18px+env(safe-area-inset-bottom))] left-1/2 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 ${
              hasOpenDropdown ? "z-[520]" : "z-[360]"
            }`}
          >
            <div
              className="relative flex w-full flex-col items-center gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <AnimatePresence initial={false}>
                {!isRankingOpen && (
                  <motion.label
                    key="nickname-search"
                    initial={{ opacity: 0, y: -8, maxHeight: 0 }}
                    animate={{ opacity: 1, y: 0, maxHeight: 48 }}
                    exit={{ opacity: 0, y: -8, maxHeight: 0 }}
                    transition={{ duration: 0.3, ease: SMOOTH_EASE }}
                    className="relative order-2 flex h-12 w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] py-0 pl-5 pr-14 text-[var(--theme-muted)] shadow-[0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition duration-[650ms] focus-within:border-[rgba(var(--theme-accent-rgb),0.34)] focus-within:bg-[var(--theme-glass-strong)] sm:order-1 sm:flex-1"
                    style={{ willChange: "transform, opacity, max-height" }}
                  >
                    <Search size={16} className="shrink-0 opacity-65" />
                    <input
                      value={playlistSearch}
                      onChange={(event) => {
                        setPlaylistSearch(event.target.value);
                        openSearchPanel();
                      }}
                      onFocus={() => {
                        openSearchPanel();
                      }}
                      onClick={() => {
                        openSearchPanel();
                      }}
                      placeholder="전체 시즌에서 검색"
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-faint)]"
                    />
                    {playlistSearch && (
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          clearPlaylistSearch();
                        }}
                        className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--theme-muted)] transition hover:bg-[rgba(var(--theme-accent-rgb),0.08)] hover:text-[var(--theme-text)] active:bg-[rgba(var(--theme-accent-rgb),0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-accent-rgb),0.2)]"
                        aria-label="검색어 지우기"
                      >
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    )}
                  </motion.label>
                )}
              </AnimatePresence>
              <div className="order-1 flex w-full items-center justify-end gap-2.5 sm:order-2 sm:w-auto sm:justify-start">
                <button
                  type="button"
                  onClick={() => {
                    toggleListPanel();
                  }}
                  className="order-1 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] text-[var(--theme-faint)] shadow-[0_10px_24px_rgba(28,40,52,0.08)] backdrop-blur-xl transition duration-[650ms] hover:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.24)]"
                  aria-label="곡 목록"
                  title="곡 목록"
                >
                  <ListMusic size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closePrimaryOverlays();
                    setIsFrissonLetterOpen(true);
                  }}
                  className="order-3 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] text-[var(--theme-faint)] shadow-[0_10px_24px_rgba(28,40,52,0.08)] backdrop-blur-xl transition duration-[650ms] hover:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.24)]"
                  aria-label="프리송의 편지"
                  title="프리송의 편지"
                >
                  <CircleHelp size={16} />
                </button>
                {shouldShowSubmitControl && (
                  <Link
                    href={submitHref}
                    onClick={() => {
                      sessionStorage.removeItem("frissonSelectedTime");
                      closePrimaryOverlays();
                    }}
                    className="order-2 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass)] text-[var(--theme-faint)] shadow-[0_10px_24px_rgba(28,40,52,0.08)] backdrop-blur-xl transition duration-[650ms] hover:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.24)]"
                    aria-label={currentUserSeasonSong ? "내 곡 수정" : "곡 추가"}
                    title={currentUserSeasonSong ? "내 곡 수정" : "곡 추가"}
                  >
                    {currentUserSeasonSong ? (
                      <Pencil size={15} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </Link>
                )}
              </div>
              </div>
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, maxHeight: 0 }}
                    animate={{ opacity: 1, y: 0, maxHeight: 360 }}
                    exit={{ opacity: 0, y: -8, maxHeight: 0 }}
                    transition={{ duration: 0.34, ease: SMOOTH_EASE }}
                    className="absolute bottom-[calc(100%+10px)] left-1/2 z-[320] w-[min(360px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-[18px] border border-[rgba(var(--theme-accent-rgb),0.12)] bg-[var(--theme-glass)] shadow-[0_18px_48px_rgba(0,0,0,0.11)] backdrop-blur-2xl transition-colors duration-[650ms]"
                    style={{ willChange: "transform, opacity, max-height" }}
                  >
                    <div className="max-h-[min(360px,calc(100vh-210px))] overflow-y-auto p-2 [scrollbar-color:rgba(var(--theme-accent-rgb),0.28)_transparent] [scrollbar-width:thin]">
                      {playlistGroups.length > 0 ? (
                        playlistGroups.map((group) => (
                          <div key={group.season} className="py-1.5">
                            <div className="sticky top-0 z-10 mb-1 rounded-[10px] bg-[var(--theme-glass)] px-2.5 py-1.5 text-[10px] font-semibold tabular-nums tracking-[0.18em] text-[var(--theme-faint)] backdrop-blur-xl">
                              SEASON {group.season}
                            </div>
                            <div className="space-y-1">
                              {group.songs.map((song) => {
                                const isSelected = selectedSong?.id === song.id;

                                return (
                                  <button
                                    key={song.id}
                                    type="button"
                                    onClick={() => {
                                      selectSong(song);
                                    }}
                                    className={`grid w-full grid-cols-[54px_minmax(0,1fr)] items-start gap-2 rounded-[12px] border px-2.5 py-2 text-left transition duration-300 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.2)] ${
                                      isSelected
                                        ? "border-[rgba(var(--theme-accent-rgb),0.32)] bg-[rgba(var(--theme-accent-rgb),0.1)]"
                                        : "border-transparent hover:border-[var(--theme-border)] hover:bg-[rgba(var(--theme-accent-rgb),0.045)]"
                                    }`}
                                  >
                                    <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-[var(--theme-muted)]">
                                      #{song.trackOrder}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-semibold leading-5 text-[var(--theme-text)]">
                                        {song.title}
                                      </span>
                                      <span className="block truncate text-[11px] font-medium text-[var(--theme-faint)]">
                                        @{song.nickname} · ♥ {song.votes ?? 0}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="px-3 py-6 text-center text-xs text-[var(--theme-faint)]">
                          검색된 러너가 없어요.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isRankingOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, maxHeight: 0 }}
                    animate={{ opacity: 1, y: 0, maxHeight: 380 }}
                    exit={{ opacity: 0, y: -8, maxHeight: 0 }}
                    transition={{ duration: 0.34, ease: SMOOTH_EASE }}
                    className="absolute bottom-[calc(100%+10px)] left-1/2 z-[320] w-[min(360px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-[18px] border border-[rgba(var(--theme-accent-rgb),0.12)] bg-[var(--theme-glass)] shadow-[0_18px_48px_rgba(0,0,0,0.11)] backdrop-blur-2xl transition-colors duration-[650ms]"
                    style={{ willChange: "transform, opacity, max-height" }}
                  >
                    <div className="max-h-[min(380px,calc(100vh-160px))] overflow-y-auto p-2 [scrollbar-color:rgba(var(--theme-accent-rgb),0.28)_transparent] [scrollbar-width:thin]">
                      <div className="mb-1 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-[var(--theme-faint)]">
                        프리송 랭킹
                      </div>
                      <div className="space-y-1">
                        {rankedSongs.map((song, index) => {
                          const isSelected = selectedSong?.id === song.id;
                          const voteCount = Math.max(0, song.votes ?? 0);

                          return (
                            <button
                              key={song.id}
                              type="button"
                              onClick={() => selectSong(song)}
                              className={`grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 rounded-[12px] border px-2.5 py-2.5 text-left transition duration-300 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.2)] ${
                                isSelected
                                  ? "border-[rgba(var(--theme-accent-rgb),0.32)] bg-[rgba(var(--theme-accent-rgb),0.1)]"
                                  : "border-transparent hover:border-[var(--theme-border)] hover:bg-[rgba(var(--theme-accent-rgb),0.045)]"
                              }`}
                            >
                              <span className="text-center text-[13px] font-bold tabular-nums text-[var(--theme-muted)]">
                                {index + 1}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold leading-5 text-[var(--theme-text)]">
                                  {song.title}
                                </span>
                                <span className="block truncate text-[11px] font-medium text-[var(--theme-faint)]">
                                  @{song.nickname} · ♥ {song.votes ?? 0}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass-strong)] px-2 py-1 text-[11px] font-semibold tabular-nums text-[var(--theme-muted)]">
                                <Heart size={11} fill="currentColor" />
                                {voteCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isListOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.24, ease: SMOOTH_EASE }}
                    className="absolute bottom-[calc(100%+10px)] left-1/2 z-[320] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[18px] border border-[rgba(var(--theme-accent-rgb),0.12)] bg-[var(--theme-glass)] shadow-[0_18px_48px_rgba(0,0,0,0.11)] backdrop-blur-2xl transition-colors duration-[650ms]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--theme-text)]">시즌 {season} 곡 목록</p>
                      <div className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass-strong)] p-1">
                        {([
                          ["popular", "인기순"],
                          ["latest", "최신순"],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setListSort(value)}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                              listSort === value
                                ? "bg-[var(--theme-glass)] text-[var(--theme-text)]"
                                : "text-[var(--theme-faint)] hover:text-[var(--theme-text)]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="max-h-[min(52vh,430px)] overflow-y-auto p-2 [scrollbar-color:rgba(var(--theme-accent-rgb),0.28)_transparent] [scrollbar-width:thin]">
                      {listSongs.map((song) => {
                        const isCurrent = song.id === playingSong?.id;
                        const createdAt = new Date(song.createdAt ?? 0);
                        const isNew = !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() <= NEW_SONG_WINDOW_DAYS * 86400000;
                        return (
                          <button
                            key={song.id}
                            type="button"
                            onClick={() => selectSong(song)}
                            className={`grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 rounded-[12px] border px-2.5 py-2.5 text-left transition duration-300 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.2)] ${
                              isCurrent
                                ? "border-[rgba(var(--theme-accent-rgb),0.38)] bg-[rgba(var(--theme-accent-rgb),0.1)]"
                                : "border-transparent hover:border-[var(--theme-border)] hover:bg-[rgba(var(--theme-accent-rgb),0.045)]"
                            }`}
                          >
                            <span className="text-center text-[11px] font-bold tabular-nums text-[var(--theme-muted)]">{song.trackOrder}</span>
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate text-sm font-semibold leading-5 text-[var(--theme-text)]">{song.title}</span>
                                {isNew && <span className="rounded-full border border-[rgba(var(--theme-accent-rgb),0.26)] px-1.5 py-0.5 text-[8px] font-bold tracking-[0.1em] text-[var(--theme-muted)]">NEW</span>}
                              </span>
                              <span className="block truncate text-[11px] font-medium text-[var(--theme-faint)]">@{song.nickname} · {song.comment}</span>
                            </span>
                            <span className="text-[10px] font-semibold tabular-nums text-[var(--theme-muted)]">
                              ♥ {song.votes ?? 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {isEmpty && (
          <div className="absolute bottom-5 left-0 z-[260] max-w-[min(320px,calc(100vw-40px))] rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-glass)] px-5 py-4 text-[var(--theme-text)] shadow-[0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-colors duration-[650ms]">
            <p className="text-sm font-semibold tracking-tight">
              {songsLoadError
                ? "곡 데이터를 불러오지 못했습니다."
                : isLikedOnly
                ? "아직 Like한 곡이 없어요."
                : "아직 남겨진 프리송이 없습니다."}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-[var(--theme-muted)]">
              {songsLoadError
                ? songsLoadError
                : isLikedOnly
                ? "마음에 드는 곡에 Like를 남겨보세요."
                : "첫 번째 시간의 노래를 남겨보세요."}
            </p>
            {songsLoadError ? null : isLikedOnly ? (
              <button
                type="button"
                onClick={() => setIsLikedOnly(false)}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass-strong)] px-3 text-xs font-semibold text-[var(--theme-muted)] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition duration-300 hover:bg-[rgba(var(--theme-accent-rgb),0.1)] hover:text-[var(--theme-text)]"
              >
                전체 곡 보기
              </button>
            ) : (
              <Link
                href="/submit"
                onClick={() => {
                  sessionStorage.removeItem("frissonSelectedTime");
                }}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-glass-strong)] px-3 text-xs font-semibold text-[var(--theme-muted)] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition duration-300 hover:bg-[rgba(var(--theme-accent-rgb),0.1)] hover:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.24)]"
              >
                <Plus size={13} />
                곡 추가
              </Link>
            )}
          </div>
        )}

        <div
          className="fixed left-1/2 top-1/2 z-[300] aspect-square w-[var(--record-size)] -translate-x-1/2 -translate-y-1/2"
          onClick={(event) => {
            event.stopPropagation();
            handleBackgroundClick();
          }}
        >
          {floatingThumbnailUrl && (
            <div
              key={floatingSong?.id}
              className="pointer-events-none absolute inset-[-52%] z-[5] rounded-full bg-cover bg-center transition-opacity duration-300"
              style={{
                backgroundImage: `url(${floatingThumbnailUrl})`,
                backgroundRepeat: "no-repeat",
                filter: "blur(38px) saturate(1.08)",
                maskImage:
                  "radial-gradient(circle at 50% 50%, black 0%, black 48%, transparent 76%)",
                opacity: hasOpenFan ? 0.12 : 0.3,
                transform: "scale(1.2)",
                WebkitMaskImage:
                  "radial-gradient(circle at 50% 50%, black 0%, black 48%, transparent 76%)",
              }}
              aria-hidden="true"
            />
          )}
          <div
            className="frisson-record-spin absolute inset-0 z-10"
            style={{
              animationPlayState: isDisplayedRecordPlaying ? "running" : "paused",
              opacity: hasOpenFan ? 0.44 : 1,
              transition: "opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div
              className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle_at_center,#252423_0%,#121417_42%,#070809_76%,#030303_100%)] transition-colors duration-[650ms]"
              style={{ boxShadow: "var(--lp-shadow)" }}
            />
            <div
              className="absolute inset-[4.4%] rounded-full bg-[conic-gradient(from_305deg_at_50%_50%,transparent_0deg,transparent_24deg,rgba(255,255,255,0.055)_34deg,rgba(var(--theme-accent-rgb),0.13)_48deg,rgba(255,255,255,0.04)_67deg,transparent_82deg,transparent_360deg)] mix-blend-screen transition-colors duration-[650ms]"
              style={{ opacity: "var(--lp-highlight-opacity)" }}
            />
            <div className="absolute inset-[4%] rounded-full border border-[rgba(var(--theme-accent-rgb),0.16)] bg-[repeating-radial-gradient(circle_at_center,transparent_0px,transparent_7px,rgba(255,255,255,0.055)_8px,transparent_9px)] opacity-80 transition-colors duration-[650ms]" />
            <div className="absolute inset-[5.5%] rounded-full border border-black/60 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.025),inset_0_0_22px_rgba(255,255,255,0.025)]" />
            <div className="absolute inset-[18%] rounded-full border border-white/[0.045]" />
            <div className="absolute inset-[30%] rounded-full border border-white/[0.035]" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCenterLabelPlayPause();
              }}
              disabled={!floatingSong}
              className="absolute left-1/2 top-1/2 h-[26.4%] w-[26.4%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-transparent bg-transparent shadow-none transition duration-200 hover:scale-[1.015] hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:hover:scale-100 disabled:hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[rgba(70,70,70,0.24)]"
              aria-label={
                selectedSong && playingSong?.id !== selectedSong.id
                  ? "선택 곡 재생"
                  : isPlaying
                  ? "일시정지"
                  : "재생"
              }
            >
              <img
                src={centerLabelImagePath}
                alt="Frisson"
                className="h-full w-full object-cover"
                onError={() => {
                  if (centerLabelImagePath !== CENTER_LABEL_FALLBACK_IMAGE_PATH) {
                    setCenterLabelImagePath(CENTER_LABEL_FALLBACK_IMAGE_PATH);
                  }
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </button>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[4.8%] w-[4.8%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/45 bg-[radial-gradient(circle,#0a0a0a_0%,#111_48%,#050505_100%)] shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]" />
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              movePlaylist(-1);
            }}
            className="absolute top-1/2 z-[420] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-[var(--theme-faint)] transition hover:opacity-70 active:opacity-55 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.18)]"
            style={{ left: "clamp(-104px, -15%, -40px)" }}
            aria-label="이전 곡"
          >
            <SkipBack size={22} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              movePlaylist(1);
            }}
            className="absolute top-1/2 z-[420] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-[var(--theme-faint)] transition hover:opacity-70 active:opacity-55 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.18)]"
            style={{ right: "clamp(-104px, -15%, -40px)" }}
            aria-label="다음 곡"
          >
            <SkipForward size={22} />
          </button>

          {isMounted && selectedSong && isCardOpen && (
            <svg
              className="pointer-events-none absolute inset-0 z-[430] hidden overflow-visible xl:block"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              aria-hidden="true"
              style={{ pointerEvents: "none" }}
            >
              <motion.polyline
                key={selectedSong.id}
                points={`${selectedPingPosition.x},${selectedPingPosition.y} ${connectorKnee.x},${connectorKnee.y} ${connectorEnd.x},${connectorEnd.y}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: hasOpenFan ? 0.16 : 0.72 }}
                transition={{ duration: 0.52, ease: SMOOTH_EASE }}
                stroke="var(--connector-line)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2 7"
                fill="none"
              />
              {[selectedPingPosition, connectorKnee, connectorEnd].map((point, index) => (
                <motion.circle
                  key={`${selectedSong.id}-connector-node-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={index === 1 ? 2.2 : 2.8}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: hasOpenFan ? 0.12 : 0.62, scale: 1 }}
                  transition={{ duration: 0.42, ease: SMOOTH_EASE }}
                  fill="var(--connector-line)"
                />
              ))}
            </svg>
          )}

          {isMounted && (
          <svg
            className="pointer-events-none absolute inset-0 z-30 overflow-visible"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
            style={{
              pointerEvents: "none",
              opacity: hasOpenFan ? 0.38 : 1,
              transition: "opacity 220ms ease",
            }}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={PROGRESS_RADIUS}
              fill="none"
              stroke="rgba(var(--theme-accent-rgb),0.08)"
              strokeWidth="8"
            />
            <motion.circle
              key={selectedSong?.id ?? "empty"}
              cx={CENTER}
              cy={CENTER}
              r={PROGRESS_RADIUS}
              fill="none"
              stroke="rgba(var(--theme-accent-rgb),0.78)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={PROGRESS_CIRCUMFERENCE}
              initial={{ strokeDashoffset: PROGRESS_CIRCUMFERENCE }}
              animate={{
                strokeDashoffset:
                  PROGRESS_CIRCUMFERENCE * (1 - indicatorProgress),
              }}
              transition={{ duration: 0.9, ease: SMOOTH_EASE }}
              style={{
                rotate: -90,
                transformOrigin: "center",
                filter:
                  "drop-shadow(0 0 10px rgba(var(--theme-glow-rgb),var(--progress-glow-opacity)))",
              }}
            />
          </svg>
          )}

          {isMounted && (
          <svg
            className="pointer-events-none absolute inset-0 z-30 overflow-visible"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
            style={{
              pointerEvents: "none",
              opacity: hasOpenFan ? 0.32 : 1,
              transition: "opacity 220ms ease",
            }}
          >
            {HOURS.map((hour) => {
              const isMajor = hour % 6 === 0;
              const inner = getPosition(
                hour,
                isMajor ? MAJOR_TICK_INNER_RADIUS : MINOR_TICK_INNER_RADIUS
              );
              const outer = getPosition(
                hour,
                isMajor ? MAJOR_TICK_OUTER_RADIUS : MINOR_TICK_OUTER_RADIUS
              );

              return (
                <line
                  key={hour}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="var(--theme-accent)"
                  strokeWidth={isMajor ? 2 : 1}
                  strokeLinecap="round"
                  opacity={isMajor ? 0.62 : 0.32}
                />
              );
            })}
          </svg>
          )}

          {isMounted && HOURS.map((hour) => {
            if (hour % 6 !== 0) return null;

            const label = getPosition(hour, LABEL_RADIUS);

            return (
              <span
                key={`label-${hour}`}
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-[17px] font-bold tabular-nums tracking-[0.04em] text-[var(--theme-faint)] transition-colors duration-[650ms]"
                style={{
                  left: `${(label.x / SIZE) * 100}%`,
                  top: `${(label.y / SIZE) * 100}%`,
                  opacity: hasOpenFan ? 0.22 : 0.38,
                  transition: "opacity 220ms ease, color 650ms ease",
                }}
              >
                {{ 0: 12, 6: 3, 12: 6, 18: 9 }[hour as 0 | 6 | 12 | 18]}
              </span>
            );
          })}

          {isMounted && (
          <svg
            className="pointer-events-none absolute inset-0 z-40 overflow-visible"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
            style={{
              pointerEvents: "none",
              opacity: hasOpenFan ? 0.42 : 1,
              transition: "opacity 220ms ease",
            }}
          >
            <g
              style={{
                transform: `rotate(${indicatorAngle}deg)`,
                transformOrigin: `${CENTER}px ${CENTER}px`,
                transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <line
                x1={CENTER}
                y1={CENTER + 28}
                x2={CENTER}
                y2={CENTER - 154}
                stroke="rgba(244,244,241,0.74)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <line
                x1={CENTER}
                y1={CENTER + 24}
                x2={CENTER}
                y2={CENTER - 146}
                stroke="rgba(16,17,18,0.28)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <path
                d={`M ${CENTER - 10} ${CENTER - 154} L ${CENTER + 10} ${CENTER - 154} L ${CENTER} ${CENTER - 174} Z`}
                fill="rgba(244,244,241,0.76)"
                stroke="rgba(15,15,16,0.3)"
                strokeWidth="0.8"
              />
              <line
                x1={CENTER}
                y1={CENTER + 9}
                x2={CENTER}
                y2={CENTER + 46}
                stroke="rgba(244,244,241,0.52)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <circle
              cx={CENTER}
              cy={CENTER}
              r="8"
              fill="rgba(16,17,18,0.86)"
              stroke="rgba(245,245,242,0.38)"
              strokeWidth="1.2"
            />
            <circle
              cx={CENTER}
              cy={CENTER}
              r="3"
              fill="rgba(245,245,242,0.72)"
            />
          </svg>
          )}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-50 h-[4.5%] w-[4.5%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.72),rgba(170,170,170,0.42)_28%,rgba(37,37,37,0.95)_70%)] transition-colors duration-[650ms]"
            style={{
              boxShadow:
                "0 0 24px rgba(var(--theme-glow-rgb),var(--glow-opacity)), inset 0 0 8px rgba(0,0,0,0.5)",
            }}
          />

          {pingGroups.map((group) => {
            const song = group.songs[0];
            const position = getTrackPosition(group.index, group.total, group.radius);
            const isCurrent = song.id === (selectedSong ?? playingSong)?.id;
            const markerSize = isCurrent
              ? Math.min(132, Math.max(112, song.nickname.length * 9 + 58))
              : Math.min(120, Math.max(54, song.nickname.length * 10 + 28));
            const desiredViewportCenter =
              recordPixelSize > 0
                ? (viewportSize.width - recordPixelSize) / 2 +
                  (position.x / SIZE) * recordPixelSize
                : 0;
            const safeViewportCenter =
              isCurrent && viewportSize.width > 0
                ? Math.min(
                    viewportSize.width - markerSize / 2 - 14,
                    Math.max(markerSize / 2 + 14, desiredViewportCenter)
                  )
                : desiredViewportCenter;
            const markerOffsetX =
              isCurrent && recordPixelSize > 0
                ? safeViewportCenter - desiredViewportCenter
                : 0;

            return (
              <div
                key={group.slot}
                className={`pointer-events-none absolute ${isCurrent ? "z-[380]" : "z-[300]"}`}
                style={{
                  left: `${(position.x / SIZE) * 100}%`,
                  top: `${(position.y / SIZE) * 100}%`,
                  opacity: hasOpenFan ? 0.22 : isCurrent ? 1 : 0.72,
                  transition: "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <motion.div
                  whileHover={{ scale: isCurrent ? 1.06 : 1.12 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.26, ease: SMOOTH_EASE }}
                  className={`absolute flex items-center justify-center rounded-full border backdrop-blur-xl transition-[border-color,box-shadow,opacity,transform] duration-150 ${
                    isCurrent
                      ? "border-[rgba(var(--theme-accent-rgb),0.9)] bg-[rgba(248,250,252,0.9)]"
                      : "border-transparent bg-transparent hover:border-[rgba(var(--theme-accent-rgb),0.35)] hover:bg-[rgba(248,250,252,0.5)]"
                  }`}
                  style={{
                    pointerEvents: "auto",
                    width: `${markerSize}px`,
                    height: isCurrent ? "50px" : "44px",
                    left: `${-markerSize / 2 + markerOffsetX}px`,
                    top: `${isCurrent ? -25 : -22}px`,
                    boxShadow:
                      isCurrent
                        ? "0 0 22px rgba(var(--theme-glow-rgb),0.36), 0 8px 20px rgba(24,34,44,0.1)"
                        : "0 0 18px rgba(var(--theme-glow-rgb),var(--ping-glow-opacity)), 0 10px 24px rgba(24,34,44,0.07)",
                  }}
                  aria-label={`${song.title}, ${song.nickname} 선택`}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      closePrimaryOverlays();
                      setExpandedSlot(null);
                      selectSong(song);
                    }}
                    className="flex h-full min-w-0 flex-1 items-center justify-center rounded-full px-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-accent-rgb),0.3)]"
                    aria-label={`${song.title}, ${song.nickname} 선택`}
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-center">
                    <span
                      className={`text-left font-semibold ${
                        isCurrent
                          ? "truncate text-xs text-[var(--theme-text)]"
                          : "max-w-[120px] whitespace-nowrap text-[9px] text-[var(--theme-muted)]"
                      }`}
                    >
                      @{song.nickname}
                    </span>
                    </span>
                  </button>
                  {isCurrent && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSongLike(song);
                      }}
                      className={`mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent transition hover:opacity-75 active:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--theme-accent-rgb),0.18)] ${
                        likedSongIds.has(song.id)
                          ? "text-[var(--theme-text)]"
                          : "text-[var(--theme-faint)]"
                      }`}
                      aria-label={likedSongIds.has(song.id) ? "좋아요 취소" : "좋아요"}
                      aria-pressed={likedSongIds.has(song.id)}
                    >
                      <Heart
                        size={14}
                        fill={likedSongIds.has(song.id) ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                </motion.div>
              </div>
            );
          })}

          <AnimatePresence mode="wait">
            {isMounted && selectedSong && isCardOpen && (
              <motion.aside
                key={selectedSong.id}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  x: selectedCardSide === "right" ? -14 : "calc(-100% + 14px)",
                  y: "-50%",
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: selectedCardSide === "right" ? 0 : "-100%",
                  y: "-50%",
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  x: selectedCardSide === "right" ? -12 : "calc(-100% + 12px)",
                  y: "-50%",
                }}
                transition={{ duration: 0.42, ease: SMOOTH_EASE }}
                className="absolute z-[460] w-[min(292px,80vw)] overflow-hidden rounded-[18px] border border-[rgba(var(--theme-accent-rgb),0.14)] bg-[var(--theme-glass)] px-5 py-4 shadow-[0_18px_46px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-colors duration-[650ms] will-change-transform"
                style={{
                  left: `${(cardAnchorX / SIZE) * 100}%`,
                  top: `${(cardTop / SIZE) * 100}%`,
                  width: `${FLOATING_CARD_WIDTH}px`,
                }}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-[var(--connector-line)] opacity-45" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-[var(--connector-line)] opacity-35" />
                <div className="mb-3 flex items-start justify-between gap-3">
                  <DigitalTime value={selectedTimeLabel} />
                  <p className="mt-1 max-w-[112px] truncate text-right text-xs font-semibold text-[var(--theme-faint)]">
                    @{selectedSong.nickname}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-[rgba(var(--theme-accent-rgb),0.12)] bg-[var(--theme-glass-strong)]">
                    <img
                      src={getSongThumbnail(selectedSong.thumbnailUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-[var(--theme-text)]">
                      {selectedSong.title}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-[12px] italic leading-[1.85] text-[var(--theme-muted)]">
                  &ldquo;{selectedSong.comment}&rdquo;
                </p>

                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
	                    onClick={(event) => {
	                      event.stopPropagation();
	                      setIsCardOpen(true);
	                      handleSelectedSongPlayPause();
	                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(var(--theme-accent-rgb),0.18)] bg-[var(--theme-glass-strong)] text-[var(--theme-text)] shadow-[0_8px_18px_rgba(0,0,0,0.1)] transition duration-300 hover:scale-105 hover:bg-[rgba(var(--theme-accent-rgb),0.12)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.3)]"
                    aria-label={isPlaying ? "미리듣기 일시정지" : "미리듣기 재생"}
                  >
                    {isPlaying ? (
                      <Pause size={16} fill="currentColor" />
                    ) : (
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSongLike(selectedSong);
                    }}
                    className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold tabular-nums shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.3)] ${
                      isSelectedLiked
                        ? "border-[rgba(var(--theme-accent-rgb),0.28)] bg-[rgba(var(--theme-accent-rgb),0.14)] text-[var(--theme-text)]"
                        : "border-[rgba(var(--theme-accent-rgb),0.14)] bg-[var(--theme-glass-strong)] text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                    }`}
                    aria-label={isSelectedLiked ? "좋아요 취소" : "좋아요"}
                  >
                    <Heart
                      size={15}
                      fill={isSelectedLiked ? "currentColor" : "none"}
                    />
                    {selectedVoteCount}
                  </button>
                  <a
                    href={selectedSong.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="ml-auto inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[rgba(var(--theme-accent-rgb),0.14)] bg-[var(--theme-glass-strong)] px-3 text-[11px] font-semibold text-[var(--theme-muted)] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition duration-300 hover:bg-[rgba(var(--theme-accent-rgb),0.1)] hover:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-accent-rgb),0.24)]"
                  >
                    <ExternalLink size={13} />
                    <span className="truncate">YouTube에서 듣기</span>
                  </a>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {playerMountVideoId && (
        <div
          className="fixed -left-[10000px] -top-[10000px] h-[200px] w-[200px] overflow-hidden opacity-0"
          aria-hidden="true"
        >
          <YouTube
            videoId={playerMountVideoId}
            onReady={handleYouTubeReady}
            onStateChange={handleYouTubeStateChange}
            opts={youtubePlayerOptions}
          />
        </div>
      )}

      <FrissonLetterModal
        isOpen={isFrissonLetterOpen}
        onClose={() => setIsFrissonLetterOpen(false)}
      />
    </section>
  );
}

/*
 * Legacy section-style implementation kept here temporarily for easy recovery
 * while Season 3 explores the full-screen Circular Time Map direction.
 */
export function CircularTimeMapSectionPrototype({ songs }: { songs: TimeMapSong[] }) {
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [selectedSong, setSelectedSong] = useState<TimeMapSong | null>(
    songs[0] ?? null
  );

  const songsByTimeSlot = useMemo(() => {
    return songs.reduce<Record<number, TimeMapSong[]>>((groupedSongs, song) => {
      const timeSlot = Math.min(23, Math.max(0, song.timeSlot));
      groupedSongs[timeSlot] = [...(groupedSongs[timeSlot] ?? []), song];
      return groupedSongs;
    }, {});
  }, [songs]);

  return (
    <section className="relative mb-10 overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 px-4 py-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(125,146,162,0.24),transparent_34%),radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.09),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-px rounded-[27px] border border-white/10" />

      <div className="relative z-10 grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-white/45">
                Season 3 Prototype
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                시간과 노래
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/48">
              하루의 둘레에 남겨진 노래들. 같은 시간대의 겹친 ping을 눌러 펼쳐보세요.
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[620px]">
            <div className="absolute inset-[9%] rounded-full border border-white/10 bg-white/[0.025] shadow-[inset_0_0_70px_rgba(255,255,255,0.04)]" />
            <div className="absolute inset-[20%] rounded-full border border-white/[0.06]" />
            <div className="absolute inset-[35%] rounded-full bg-white/[0.035] blur-xl" />
            <div className="absolute left-1/2 top-1/2 h-[1px] w-[76%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute left-1/2 top-1/2 h-[76%] w-[1px] -translate-y-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            {HOURS.map((hour) => {
              const marker = getPosition(hour, 275);
              const isMajor = hour % 6 === 0;

              return (
                <div
                  key={hour}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                  style={{
                    left: `${(marker.x / SIZE) * 100}%`,
                    top: `${(marker.y / SIZE) * 100}%`,
                  }}
                >
                  <span
                    className={`rounded-full ${
                      isMajor ? "h-1.5 w-1.5 bg-white/55" : "h-1 w-1 bg-white/20"
                    }`}
                  />
                  {isMajor && (
                    <span className="text-[10px] font-medium tabular-nums text-white/42">
                      {String(hour).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}

            <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">
                Archive
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-white/90">
                24 hours
              </p>
              <p className="mt-2 text-xs leading-5 text-white/38">
                {songs.length} songs mapped by memory
              </p>
            </div>

            {Object.entries(songsByTimeSlot).map(([slot, slotSongs]) => {
              const timeSlot = Number(slot);
              const position = getPosition(timeSlot);
              const isExpanded = expandedSlot === timeSlot;

              return (
                <div
                  key={slot}
                  className="absolute"
                  style={{
                    left: `${(position.x / SIZE) * 100}%`,
                    top: `${(position.y / SIZE) * 100}%`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSlot((currentSlot) =>
                        currentSlot === timeSlot ? null : timeSlot
                      )
                    }
                    className="absolute -left-7 -top-7 h-14 w-14 rounded-full border border-white/15 bg-white/10 shadow-[0_0_36px_rgba(168,185,202,0.22)] backdrop-blur-xl transition hover:border-white/35 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/35"
                    aria-label={`${timeSlot}시 노래 ${slotSongs.length}곡 펼치기`}
                  >
                    <span className="absolute inset-0 rounded-full bg-white/5 blur-md" />
                    {slotSongs.slice(0, 4).map((song, index) => (
                      <span
                        key={song.id}
                        className="absolute h-9 w-9 overflow-hidden rounded-full border border-white/35 bg-neutral-800 shadow-lg"
                        style={{
                          left: `${10 + index * 4}px`,
                          top: `${10 + index * 3}px`,
                          zIndex: 10 + index,
                        }}
                      >
                        <img
                          src={getSongThumbnail(song.thumbnailUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </span>
                    ))}
                    {slotSongs.length > 1 && (
                      <span className="absolute -right-1 -top-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/20 bg-neutral-950 px-1 text-[10px] font-semibold text-white/80">
                        {slotSongs.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded &&
                      slotSongs.map((song, index) => {
                        const expansion = getExpansion(index);

                        return (
                          <motion.button
                            key={song.id}
                            type="button"
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0.74 }}
                            animate={{
                              x: expansion.x,
                              y: expansion.y,
                              opacity: 1,
                              scale: 1,
                            }}
                            exit={{ x: 0, y: 0, opacity: 0, scale: 0.74 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 24,
                              delay: index * 0.035,
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedSong(song);
                            }}
                            className="absolute -left-6 -top-6 z-30 h-12 w-12 overflow-hidden rounded-full border border-white/45 bg-neutral-900 shadow-[0_14px_38px_rgba(0,0,0,0.38)] transition hover:border-white/75 focus:outline-none focus:ring-2 focus:ring-white/40"
                            aria-label={`${song.title} 상세 보기`}
                          >
                            <img
                              src={getSongThumbnail(song.thumbnailUrl)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </motion.button>
                        );
                      })}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedSong && (
            <motion.aside
              key={selectedSong.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-3xl border border-white/14 bg-white/[0.075] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-white/[0.04]" />
              <div className="relative z-10">
                <div className="mb-5 aspect-[16/10] overflow-hidden rounded-2xl border border-white/12 bg-neutral-900">
                  <img
                    src={getSongThumbnail(selectedSong.thumbnailUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/38">
                      {String(selectedSong.timeSlot).padStart(2, "0")}:00
                    </p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-white">
                      {selectedSong.title}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/62">
                    @{selectedSong.nickname}
                  </span>
                </div>
                <div className="space-y-4 text-sm leading-6 text-white/68">
                  <p>{selectedSong.timeReason}</p>
                  <p className="border-l border-white/18 pl-4 italic text-white/54">
                    &quot;{selectedSong.comment}&quot;
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
