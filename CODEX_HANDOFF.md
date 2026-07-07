# CODEX_HANDOFF

이 문서는 새 Codex 스레드에서 현재 프로젝트를 이어받기 위한 현재 상태 기록이다. 아래 내용은 2026-07-05 기준 코드베이스를 다시 읽고 작성했다.

## 1. 현재 프로젝트 구조

- Next.js App Router 프로젝트다. 주요 화면은 `app/page.tsx` 로그인 화면, `app/songs/page.tsx` LP 곡 목록 화면, `app/submit/page.tsx`/`app/submit/SubmitClient.tsx` 곡 제출 화면이다.
- `/songs`는 `components/CircularTimeMap.tsx` 하나가 대부분의 LP 인터페이스, 검색, 목록, 정렬, 좋아요, 재생 제어를 담당한다.
- 시즌 CSV 원본은 루트의 `songs-season1.csv`, `songs-season2.csv`, `songs-season3.csv`에 있고, 빌드 전 생성 스크립트가 `lib/seasonSongs.generated.ts`를 만든다.
- 정적 에셋은 `public/`에 있다. LP 중앙 라벨은 `public/frisson-center-label.png`를 사용한다.
- 보조 컴포넌트 `components/FrissonPlayer.tsx`, `components/CassettePlayerModal.tsx`, `components/SongCard.tsx`는 파일로 남아 있지만 현재 `/songs`에서 import되지 않는다.

## 2. 시즌1·2·3 CSV 통합 방식

- `package.json`의 `prebuild`가 `npm run generate:songs`를 실행한다.
- `scripts/generate-season-songs.mjs`가 루트 CSV 3개를 읽어 `lib/seasonSongs.generated.ts`를 생성한다.
- `csv-parse/sync`를 사용하며 `columns: true`, `bom: true`, `skip_empty_lines: true`, `relax_column_count: true` 설정이다.
- 시즌 3만 `time_slot`, `time_minute`를 `HH:mm` 형태의 `time`으로 변환한다. 시즌 1·2는 `time`이 없다.
- 생성 시 `orderSongs()`가 시즌별 정렬 후 `trackOrder`를 1부터 다시 매긴다.

## 3. 현재 Song 타입과 데이터 변환 구조

- `lib/seasonSongs.generated.ts`의 `Season`은 `1 | 2 | 3`이다.
- 생성 타입 `Song` 필드는 `id`, `season`, `nickname`, `title`, optional `artist`, `comment`, `youtubeUrl`, optional `thumbnailUrl`, `votes`, optional `createdAt`, optional `time`, `trackOrder`, `voters`다.
- `CircularTimeMap.tsx` 내부에서는 `TimeMapSong`으로 변환해 쓴다.
- `toTimeMapSongs(songs, season)`은 `id`를 `season * 10000 + trackOrder` 숫자로 만들고, 시즌3의 실제 시간 또는 시즌1·2의 균등 분포 fallback을 `timeSlot`, `timeMinute`로 만든다.

## 4. 시즌별 정렬 방식

- CSV 생성 단계에서 시즌3은 `time` 오름차순, 동률이면 `createdAt` 오름차순으로 정렬한다.
- CSV 생성 단계에서 시즌1·2는 `votes` 내림차순, 동률이면 `createdAt` 오름차순으로 정렬한다.
- 화면에서는 현재 시즌의 `displaySongs`를 다시 `listSort`에 따라 정렬한다. `popular`는 `votes` 내림차순 후 `createdAt` 오름차순, `latest`는 `createdAt` 내림차순이다.

## 5. 인기순/최신순/내 Like만 상태 구조

- `listSort` 상태가 `"popular" | "latest"`이며 기본값은 `"popular"`이다.
- `isLikedOnly`가 내 Like만 필터 상태다.
- `currentNickname`은 `sessionStorage.getItem("nickname")`에서 읽는다.
- `likedSongIds`는 현재 `displaySongs`의 `voters` 배열에 현재 닉네임이 있는 곡 id Set으로 계산된다.
- 내 Like만을 켤 때 닉네임이 없으면 alert를 띄운다.

## 6. 현재 LP 인터페이스 구조

- `/songs`는 `CircularTimeMap`이 전체 화면 fixed/absolute 레이어로 구성한다.
- LP 기준 크기는 CSS 변수 `--record-size: clamp(320px, min(68vw, 68vh, 720px), 720px)`이고, 중심 컨테이너는 `aspect-square`다.
- LP 원판 자체는 `.frisson-record-spin` 레이어 안에 있으며 재생 중일 때만 CSS animation이 running 상태가 된다.
- 시계 숫자, 눈금, 인디케이터, 닉네임 라벨, 이전/다음 버튼은 회전 레이어 밖에 있다.

## 7. 닉네임 원형 배치 방식

- `pingGroups`는 현재 정렬/필터된 `sortedPlaylistSongs`를 그대로 순서대로 펼친다.
- 각 곡은 `getTrackPosition(index, total, PING_RADIUS)`로 24시간 원 둘레에 균등 배치된다.
- 현재는 시즌3 시간값으로 직접 배치하지 않고, 정렬된 큐 순서 기반 원형 배치다.
- 일반 닉네임은 투명 배경의 작은 라벨로 표시되고, 최대 폭은 현재 `120px`까지 허용한다.

## 8. 선택 닉네임 capsule 구조

- 선택된 곡은 같은 원형 위치에 더 큰 capsule로 표시된다.
- capsule 안에는 `@닉네임` 버튼 영역과 오른쪽 Heart 좋아요 버튼이 있다.
- 선택 capsule 폭은 닉네임 길이에 따라 `Math.min(132, Math.max(112, nickname.length * 9 + 58))`로 계산한다.
- 모바일/좁은 화면에서 capsule 중심이 화면 밖으로 나가지 않도록 viewport 기준으로 좌우 clamp를 적용한다.
- 좋아요 버튼 클릭은 `event.stopPropagation()`을 사용해 곡 선택 이벤트와 충돌하지 않게 한다.

## 9. 중앙 LP 라벨 클릭 재생/일시정지 방식

- 중앙 라벨은 `button`이며 `CENTER_LABEL_IMAGE_PATH = "/frisson-center-label.png"` 이미지를 그대로 보여준다.
- `handleCenterLabelPlayPause()`가 호출되면 세션 힌트 플래그 `frisson-label-play-hint-seen`을 저장하고 `handleFloatingPlayPause()`로 넘긴다.
- 현재 선택/재생 곡이 없으면 아무 동작도 하지 않는다.
- 키보드 접근성은 기본 `button` semantics와 focus ring으로 처리된다.

## 10. 이전곡/다음곡 및 자동재생 방식

- LP 좌우에 `SkipBack`, `SkipForward` 아이콘 버튼이 있다.
- 버튼 위치는 LP 컨테이너 기준 absolute이며 `left/right: clamp(-104px, -15%, -40px)`를 사용한다.
- `movePlaylist(direction)`은 `queueRef.current`가 있으면 그것을 우선 사용하고, 없으면 현재 `sortedPlaylistSongs`를 사용한다.
- 곡 이동 시 `pendingPlayRef.current = true`, `selectedSong`, `playingSong`을 다음 곡으로 바꾸고 실제 YouTube iframe 준비 후 재생되도록 한다.

## 11. 곡 종료 후 연속재생 방식

- 숨겨진 `react-youtube` iframe의 `onStateChange`에서 `event.data === 0`이면 종료로 본다.
- `transitionLockRef`로 중복 종료 처리를 막는다.
- 현재 queue에서 현재 곡의 다음 곡을 찾고, 마지막 곡이면 첫 곡으로 순환한다.
- 다음 곡에 대해 `pendingPlayRef.current = true`, `selectedSong`, `playingSong`을 갱신한다.

## 12. Like 기능과 voters 처리

- `toggleSongLike(song)`이 현재 좋아요 토글 함수다.
- 닉네임은 `currentNickname ?? sessionStorage.getItem("nickname")`에서 가져온다.
- 닉네임이 없으면 alert, 자기 곡이면 alert다.
- `voters` 배열에 닉네임이 있으면 제거하고 `votes`를 1 감소, 없으면 추가하고 `votes`를 1 증가한다.
- 현재 구현은 정적 CSV 아카이브 기반의 로컬 상태 갱신만 한다. Supabase에 votes/voters를 쓰지 않는다.

## 13. thumbnail blurry backdrop 구조

- 현재 선택/재생 곡은 `floatingSong = playingSong ?? selectedSong`이다.
- `floatingSong.thumbnailUrl`이 있으면 페이지 전체 뒤쪽에 fixed backdrop을 하나 깐다. 위치는 `fixed inset-[-55%] z-[1]`, opacity `0.3`, filter `blur(40px) saturate(1.08)`이다.
- LP 바로 뒤에도 local backdrop이 있다. 위치는 record 컨테이너 안 `absolute inset-[-52%] z-[5]`, opacity는 보통 `0.3`, fan open 상태에서는 `0.12`, filter는 `blur(38px) saturate(1.08)`이다.
- 두 backdrop 모두 radial mask로 가장자리를 부드럽게 날린다.

## 14. 시즌 선택 capsule 구조

- 좌측 상단에 `FRISSON SEASON {season}`과 세로 capsule이 있다.
- 세로 capsule은 01/02/03 세 버튼을 grid rows 3으로 배치한다.
- 선택 indicator는 absolute span이며 `transform: translateY(calc(${season - 1} * 100%))`로 위아래 이동한다.
- 각 버튼은 `aria-label="시즌 N 선택"`과 `aria-pressed`를 가진다.
- `selectSeason(nextSeason)`은 `season`, `displaySongs`를 바꾸고 선택/패널 상태를 닫지만, 기존 재생 iframe과 queue는 새 곡이 재생될 때까지 의도적으로 유지한다.

## 15. 목록 패널 구조

- 하단 fixed control wrapper 안에 검색창, 목록 버튼, 곡 추가 버튼, 도움말 버튼이 있다.
- 모바일에서는 버튼 행이 검색창 위에 오고, `sm` 이상에서는 검색창과 버튼이 한 줄이다.
- 검색 패널은 `isSearchOpen`일 때 하단 컨트롤 위에 뜨며, 전체 시즌 곡을 검색하고 `SEASON 1`, `SEASON 2`, `SEASON 3`으로 그룹 표시한다.
- 목록 패널은 `isListOpen`일 때 현재 시즌 곡 목록만 보여준다. 패널 안에도 인기순/최신순 미니 토글이 있다.
- `isRankingOpen` 관련 랭킹 패널 코드가 남아 있지만 현재 렌더 트리에서 여는 버튼은 없다.

## 16. 코멘트 preview/전문 보기 구조

- 상단 중앙에는 현재 곡 제목 1줄과 코멘트 preview가 표시된다.
- 코멘트 preview는 현재 한 줄 `truncate`다.
- 실제 overflow 감지는 `commentPreviewRef.current.scrollWidth > clientWidth + 1`로 한다.
- 긴 코멘트일 때만 `더 보기` 텍스트 버튼을 보여준다.
- `더 보기`를 누르면 상단 영역 아래에 floating panel이 뜨고 전체 코멘트를 보여주며, `닫기`로 접는다.
- 곡이 바뀌면 `isCommentExpanded`와 `canExpandComment`를 초기화한다.

## 17. 현재 로그인 화면 상태

- `app/page.tsx`는 로그인/입장 화면이다.
- 시즌 표기는 `FRISSON SEASON 4`, 큰 제목은 `FRISSON`이다.
- 안내 문구는 `이번 시즌,` / `당신의 전율을 일으키는 곡은 무엇인가요?` 두 줄이다.
- 로그인 화면은 시간 기반 `getTimeTheme`를 사용하지 않고 `LOGIN_THEME` 밝은 테마로 고정되어 있다.
- 닉네임은 `sessionStorage.setItem("nickname", trimmedNickname)`로 저장하고 `/songs`로 이동한다.
- 이미 닉네임이 있으면 `useEffect`에서 바로 `/songs`로 redirect한다.

## 18. 모바일 반응형 처리

- LP 크기는 `min(68vw, 68vh)` 기반 clamp로 모바일과 데스크톱 모두 같은 비율을 유지한다.
- 하단 컨트롤은 `bottom: calc(18px + env(safe-area-inset-bottom))`로 safe area를 고려한다.
- 하단 컨트롤은 모바일에서 버튼 3개 행이 위, 검색창이 아래로 배치된다.
- 모바일/태블릿에서는 인기순/최신순이 상단 중앙, 내 Like만은 우측 상단에 따로 있고, 데스크톱에서는 우측 상단 그룹 안에서 인기순/최신순이 내 Like만 왼쪽에 있다.
- 선택 닉네임 capsule은 viewport width 기준으로 좌우 clamp한다.

## 19. 아직 해결되지 않은 버그와 TODO

- 일부 YouTube 영상은 브라우저/YouTube 정책 또는 영상 임베드 제한 때문에 `playVideo()`가 실패할 수 있다. 현재는 URL id가 없는 경우만 alert를 명시적으로 띄우고, 재생 실패 자체는 별도 세부 원인 표시가 없다.
- `getTimeTheme(timeValue: number)`라는 미사용 로컬 함수가 `CircularTimeMap.tsx`에 남아 있다. 현재 화면은 `FIXED_LIGHT_THEME`만 사용한다.
- `expandedSlot`, `isRankingOpen`, `isCardOpen` 기반의 일부 fan/detail/card 코드가 남아 있으나 현재 주요 UX에서는 거의 열리지 않는다. 삭제 전에는 실제 사용 여부를 다시 확인해야 한다.
- `FrissonPlayer`, `CassettePlayerModal`, `SongCard`, `CircularTimeMapSectionPrototype`은 현재 메인 경로에서 사용되지 않는 레거시/보조 코드다.
- 좋아요는 로컬 상태만 바꾸므로 새로고침하면 generated CSV의 원래 값으로 돌아간다.
- `app/submit/SubmitClient.tsx`는 여전히 Season 3/시간 중심 문구와 Supabase 제출 구조를 유지한다.

## 20. 절대 함부로 변경하면 안 되는 디자인/기능

- LP 크기와 중심 위치, 중앙 라벨 이미지 파일, 레코드 회전 레이어 구조.
- 닉네임 원형 배치 방식과 선택 capsule의 역할.
- 중앙 라벨 클릭으로 재생/일시정지하는 구조.
- 이전/다음 곡 이동, 곡 종료 후 연속재생, hidden YouTube iframe 연결 방식.
- 시즌 capsule의 기존 시즌 전환 기능.
- 인기순/최신순/내 Like만 상태와 큐 반영 방식.
- 검색창, 목록/추가/도움말 하단 컨트롤 구조.
- 시즌 CSV 원본과 `lib/seasonSongs.generated.ts` 생성 방식.
- `sessionStorage` 닉네임 저장 방식.

## 21. 주요 파일별 역할

- `app/page.tsx`: 시즌4 로그인 화면. 밝은 고정 테마, 닉네임 저장, `/songs` 이동.
- `app/songs/page.tsx`: generated 시즌 데이터를 import해 `CircularTimeMap`에 넘기는 얇은 페이지.
- `components/CircularTimeMap.tsx`: 현재 메인 LP UI, 시즌 전환, 정렬/필터, 검색/목록 패널, 재생 제어, 좋아요, thumbnail backdrop 전체 담당.
- `components/FrissonLetterModal.tsx`: 도움말/프리송의 편지 모달. 중앙 라벨 재생 안내 문구 포함.
- `app/submit/page.tsx`, `app/submit/SubmitClient.tsx`: 곡 제출/수정 화면. Supabase와 시간 선택 UI를 사용한다.
- `scripts/generate-season-songs.mjs`: 시즌 CSV를 읽어 generated TS 데이터로 변환한다.
- `lib/seasonSongs.generated.ts`: 빌드 전 생성되는 시즌 통합 데이터와 타입.
- `lib/nowPlaying.ts`: 문서 title과 now playing title fallback 유틸.
- `lib/timeTheme.ts`: 로그인/제출 화면용 시간 테마 유틸. 현재 로그인은 고정 테마만 사용하고 제출 화면은 시간 테마를 계속 사용한다.
- `lib/supabase.ts`: Supabase client 생성과 env 누락 메시지 유틸.
- `config.ts`: 제출 오픈 여부 `isSubmissionOpen`.
- `app/globals.css`: Tailwind import, 전역 배경, LP 회전 keyframes, 로그인 marquee keyframes.
- `public/frisson-center-label.png`: 현재 LP 중앙 라벨 이미지.
- `components/FrissonPlayer.tsx`, `components/CassettePlayerModal.tsx`, `components/SongCard.tsx`: 현재 `/songs` 메인 경로에서는 사용되지 않는 기존/보조 컴포넌트.
