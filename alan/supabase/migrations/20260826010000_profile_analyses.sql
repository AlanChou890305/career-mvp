-- 主頁「職涯目標／工作類型／技能雷達／資產與短板」原本讀 ALAN.dash 示範資料，
-- 不管使用者填了什麼 basics/履歷都不會變。這裡加一張表存 Claude 針對「這個人的
-- basics + 履歷」生成的真實分析結果，取代 ALAN.dash（有值時），沒有值/失敗時前端
-- 還是退回示範資料，邏輯比照 submissions.followups 那組欄位。

create table if not exists profile_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  resume_id uuid references resumes(id) on delete cascade,
  basics jsonb not null,
  goal3 text,
  goal5 text,
  ideal jsonb,
  target jsonb,
  accept jsonb,
  capabilities jsonb,
  radar jsonb,
  assets jsonb,
  gaps jsonb,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now()
);

create index if not exists profile_analyses_owner_id_idx on profile_analyses(owner_id);
create index if not exists profile_analyses_resume_id_idx on profile_analyses(resume_id);

alter table profile_analyses enable row level security;

drop policy if exists "owner can read own profile_analyses" on profile_analyses;
drop policy if exists "owner can insert own profile_analyses" on profile_analyses;
drop policy if exists "owner can update own profile_analyses" on profile_analyses;
create policy "owner can read own profile_analyses" on profile_analyses for select using (owner_id = auth.uid());
create policy "owner can insert own profile_analyses" on profile_analyses for insert with check (owner_id = auth.uid());
create policy "owner can update own profile_analyses" on profile_analyses for update using (owner_id = auth.uid());
