-- 重新設計團隊共用資料庫：resume / jd 拆表，用 owner_id（Supabase Anonymous Auth 的
-- auth.uid()）關聯同一個使用者的多份資料，RLS 限定只能讀寫自己的 owner_id。
--
-- owner_id 對三人內部蒐集語料跟一般使用者是同一個欄位、同一個意義：
-- 「這筆資料屬於誰」，不特別區分用途。
--
-- submissions 這張表在這次改版前就存在（舊欄位是 resume_text/jd_text，沒有
-- owner_id），所以用 alter table 補欄位、backfill 舊資料，而不是 create table，
-- 避免舊資料被跳過或遺失。

-- owner_id 沒有 not null：backfill 進來的舊資料沒有 owner，合法地是 null；
-- 新資料由應用層（匿名登入後的 auth.uid()）保證一定會帶 owner_id，
-- RLS policy 本來就會擋掉 owner_id 跟 auth.uid() 對不上的存取。
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  label text,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists jds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  text text not null,
  created_at timestamptz not null default now()
);

-- 如果 resumes/jds 是上次跑失敗前就建立的，owner_id 當時還是 not null，
-- 這裡把既有的表也一併鬆綁，不然 backfill 塞 null 會繼續違反約束。
alter table resumes alter column owner_id drop not null;
alter table jds alter column owner_id drop not null;

-- submissions 補新欄位。owner_id / resume_id / jd_id 都不能在這裡直接設 not null，
-- 因為舊資料還沒有值——not null 留到 backfill 之後、且只對新資料生效（靠應用層保證）。
alter table submissions add column if not exists owner_id uuid default auth.uid();
alter table submissions add column if not exists resume_id uuid references resumes(id) on delete cascade;
alter table submissions add column if not exists jd_id uuid references jds(id) on delete cascade;
alter table submissions add column if not exists followups jsonb;
alter table submissions add column if not exists followups_status text;
alter table submissions add column if not exists followups_error text;
alter table submissions add column if not exists fit_score numeric;
alter table submissions add column if not exists fit_strong jsonb;
alter table submissions add column if not exists fit_weak jsonb;
alter table submissions add column if not exists fit_miss jsonb;

-- submissions 的舊欄位（member/label/resume_text/jd_text/notes/followups_status）
-- 建表時是 not null，新資料改用 resume_id/jd_id 關聯，不再填這些欄位，
-- 所以要鬆綁 not null，不然新的 insert 會被舊約束擋掉。
alter table submissions alter column member drop not null;
alter table submissions alter column label drop not null;
alter table submissions alter column resume_text drop not null;
alter table submissions alter column jd_text drop not null;
alter table submissions alter column notes drop not null;
alter table submissions alter column followups_status drop not null;

-- backfill：把舊的 resume_text/jd_text 各自搬進新的 resumes/jds table，
-- 再把 submissions.resume_id/jd_id 接上去。舊資料沒有 owner_id 可以歸屬，
-- 保持 null——RLS 底下這些舊資料對一般使用者是不可見的，但還在，
-- 資料庫管理員／service role 仍讀得到。
do $$
declare
  r record;
  new_resume_id uuid;
  new_jd_id uuid;
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'submissions' and column_name = 'resume_text'
  ) then
    for r in
      select id, resume_text, jd_text, label
      from submissions
      where resume_id is null or jd_id is null
    loop
      new_resume_id := null;
      new_jd_id := null;
      if r.resume_text is not null then
        insert into resumes (owner_id, label, text)
        values (null, r.label, r.resume_text)
        returning id into new_resume_id;
      end if;
      if r.jd_text is not null then
        insert into jds (owner_id, text)
        values (null, r.jd_text)
        returning id into new_jd_id;
      end if;
      update submissions
      set resume_id = coalesce(resume_id, new_resume_id),
          jd_id = coalesce(jd_id, new_jd_id)
      where id = r.id;
    end loop;
  end if;
end $$;

create index if not exists resumes_owner_id_idx on resumes(owner_id);
create index if not exists jds_owner_id_idx on jds(owner_id);
create index if not exists submissions_owner_id_idx on submissions(owner_id);
create index if not exists submissions_resume_id_idx on submissions(resume_id);
create index if not exists submissions_jd_id_idx on submissions(jd_id);

alter table resumes enable row level security;
alter table jds enable row level security;
alter table submissions enable row level security;

drop policy if exists "owner can read own resumes" on resumes;
drop policy if exists "owner can insert own resumes" on resumes;
drop policy if exists "owner can update own resumes" on resumes;
drop policy if exists "owner can delete own resumes" on resumes;
create policy "owner can read own resumes" on resumes for select using (owner_id = auth.uid());
create policy "owner can insert own resumes" on resumes for insert with check (owner_id = auth.uid());
create policy "owner can update own resumes" on resumes for update using (owner_id = auth.uid());
create policy "owner can delete own resumes" on resumes for delete using (owner_id = auth.uid());

drop policy if exists "owner can read own jds" on jds;
drop policy if exists "owner can insert own jds" on jds;
drop policy if exists "owner can update own jds" on jds;
drop policy if exists "owner can delete own jds" on jds;
create policy "owner can read own jds" on jds for select using (owner_id = auth.uid());
create policy "owner can insert own jds" on jds for insert with check (owner_id = auth.uid());
create policy "owner can update own jds" on jds for update using (owner_id = auth.uid());
create policy "owner can delete own jds" on jds for delete using (owner_id = auth.uid());

drop policy if exists "owner can read own submissions" on submissions;
drop policy if exists "owner can insert own submissions" on submissions;
drop policy if exists "owner can update own submissions" on submissions;
drop policy if exists "owner can delete own submissions" on submissions;
create policy "owner can read own submissions" on submissions for select using (owner_id = auth.uid());
create policy "owner can insert own submissions" on submissions for insert with check (owner_id = auth.uid());
create policy "owner can update own submissions" on submissions for update using (owner_id = auth.uid());
create policy "owner can delete own submissions" on submissions for delete using (owner_id = auth.uid());
