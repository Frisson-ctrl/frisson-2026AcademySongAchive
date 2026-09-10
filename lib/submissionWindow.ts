export const SONG_EDIT_DEADLINE = new Date("2026-12-12T23:59:59+09:00");

export function isSongEditingOpen(now = new Date()) {
  return now.getTime() <= SONG_EDIT_DEADLINE.getTime();
}

export const SONG_EDIT_DEADLINE_LABEL = "2026년 12월 12일";
