-- Frisson Season 6: allow songs from every season to be added or edited until
-- 2026-12-12 23:59:59 Korea Standard Time. Likes remain available afterwards.

create or replace function public.enforce_song_edit_deadline()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if now() > timestamptz '2026-12-12 23:59:59+09' then
    raise exception '곡 추가 및 수정은 2026년 12월 12일에 마감되었습니다.'
      using errcode = 'check_violation';
  end if;

  if new.season < 1 or new.season > 6 then
    raise exception '시즌은 1부터 6까지만 지정할 수 있습니다.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists songs_enforce_edit_deadline on public.songs;

create trigger songs_enforce_edit_deadline
before insert or update of season, nickname, youtube_url, title, thumbnail_url, comment, time_slot, time_minute
on public.songs
for each row
execute function public.enforce_song_edit_deadline();
