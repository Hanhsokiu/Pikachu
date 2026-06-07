-- ====================================================================
-- THIẾT LẬP CƠ SỞ DỮ LIỆU PIKACHU WEB ONLINE
-- Copy toàn bộ nội dung file này dán vào ô "SQL Editor" trong Supabase Console và chạy "Run"
-- ====================================================================

-- 1. Tạo bảng Leaderboard (Bảng xếp hạng)
create table if not exists public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  score integer not null,
  elapsed_time integer not null,
  category text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Kích hoạt Row Level Security (RLS) để bảo mật bảng
alter table public.leaderboard enable row level security;

-- Tạo chính sách (Policies) cho bảng Leaderboard
create policy "Cho phép mọi người đọc bảng xếp hạng"
  on public.leaderboard for select
  using (true);

create policy "Cho phép mọi người thêm điểm số"
  on public.leaderboard for insert
  with check (true);


-- 2. Tạo bảng User Achievements (Thành tựu người chơi)
create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- Kích hoạt RLS cho bảng Achievements
alter table public.user_achievements enable row level security;

-- Tạo chính sách (Policies) cho bảng Achievements
create policy "Người dùng chỉ đọc thành tựu của chính mình"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Người dùng chỉ thêm thành tựu cho chính mình"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);
