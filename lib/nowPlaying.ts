export const DEFAULT_DOCUMENT_TITLE = "Frisson";
export const FALLBACK_NOW_PLAYING_TITLE = "재생 중인 곡";

export function getNowPlayingTitle(title?: string | null) {
  const trimmedTitle = title?.trim();
  return trimmedTitle || FALLBACK_NOW_PLAYING_TITLE;
}

export function getNowPlayingDocumentTitle(title?: string | null) {
  return `${getNowPlayingTitle(title)} | ${DEFAULT_DOCUMENT_TITLE}`;
}
