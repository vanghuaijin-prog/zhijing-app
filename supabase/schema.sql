create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  district text not null,
  address text not null,
  latitude numeric(10, 6) not null default 0,
  longitude numeric(10, 6) not null default 0,
  distance_km numeric(10, 2) not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  phone text not null unique,
  email text unique,
  password_hash text not null,
  display_name text not null,
  avatar_url text not null,
  city text not null default '深圳市',
  district text not null default '南山区',
  member_since timestamptz not null default now(),
  wallet_balance numeric(10, 2) not null default 0,
  wash_credits integer not null default 0,
  agreement_accepted boolean not null default false,
  default_station_id uuid references stations(id) on delete set null,
  time_card_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id uuid primary key references app_users(id) on delete cascade,
  tier text not null check (tier in ('silver', 'gold', 'platinum')),
  label text not null,
  growth_value integer not null default 0,
  next_tier_growth_value integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists membership_benefits (
  id uuid primary key default gen_random_uuid(),
  membership_user_id uuid not null references memberships(user_id) on delete cascade,
  title text not null,
  description text not null,
  icon text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  code text not null,
  name text not null,
  status text not null check (status in ('idle', 'reserved', 'busy', 'maintenance', 'offline')),
  current_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, code)
);

create table if not exists wash_packages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('wash_card', 'time_card')),
  title text not null,
  subtitle text not null default '',
  price numeric(10, 2) not null,
  original_price numeric(10, 2),
  credits integer,
  duration_days integer,
  highlight text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recharge_offers (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fixed', 'custom')),
  amount numeric(10, 2) not null,
  bonus numeric(10, 2) not null default 0,
  label text not null,
  highlighted boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recharge_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  offer_id uuid references recharge_offers(id) on delete set null,
  amount numeric(10, 2) not null,
  bonus numeric(10, 2) not null default 0,
  final_amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  station_id uuid not null references stations(id) on delete cascade,
  device_id uuid not null references devices(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null check (status in ('upcoming', 'checked_in', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  station_id uuid not null references stations(id) on delete cascade,
  device_id uuid not null references devices(id) on delete cascade,
  status text not null check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer not null default 0,
  amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  type text not null check (type in ('system', 'promotion', 'order')),
  title text not null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists feedback_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  type text not null,
  description text not null,
  phone text not null,
  status text not null check (status in ('submitted', 'processing', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedback_tickets(id) on delete cascade,
  name text not null,
  mime_type text not null default 'external',
  created_at timestamptz not null default now()
);

create table if not exists control_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  station_id uuid not null references stations(id) on delete cascade,
  device_id uuid not null references devices(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  active_mode text check (active_mode in ('water', 'foam', 'vacuum', 'handwash')),
  is_paused boolean not null default false,
  duration_minutes integer not null default 0,
  amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_codes (
  id uuid primary key default gen_random_uuid(),
  target text not null,
  scene text not null check (scene in ('register', 'reset_password')),
  method text not null check (method in ('phone', 'email')),
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_devices_station_id on devices(station_id);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_recharge_records_user_id on recharge_records(user_id);
create index if not exists idx_control_sessions_user_id on control_sessions(user_id);

drop trigger if exists set_updated_at_stations on stations;
create trigger set_updated_at_stations before update on stations for each row execute function set_updated_at();
drop trigger if exists set_updated_at_app_users on app_users;
create trigger set_updated_at_app_users before update on app_users for each row execute function set_updated_at();
drop trigger if exists set_updated_at_memberships on memberships;
create trigger set_updated_at_memberships before update on memberships for each row execute function set_updated_at();
drop trigger if exists set_updated_at_devices on devices;
create trigger set_updated_at_devices before update on devices for each row execute function set_updated_at();
drop trigger if exists set_updated_at_wash_packages on wash_packages;
create trigger set_updated_at_wash_packages before update on wash_packages for each row execute function set_updated_at();
drop trigger if exists set_updated_at_recharge_offers on recharge_offers;
create trigger set_updated_at_recharge_offers before update on recharge_offers for each row execute function set_updated_at();
drop trigger if exists set_updated_at_bookings on bookings;
create trigger set_updated_at_bookings before update on bookings for each row execute function set_updated_at();
drop trigger if exists set_updated_at_orders on orders;
create trigger set_updated_at_orders before update on orders for each row execute function set_updated_at();
drop trigger if exists set_updated_at_feedback_tickets on feedback_tickets;
create trigger set_updated_at_feedback_tickets before update on feedback_tickets for each row execute function set_updated_at();
drop trigger if exists set_updated_at_control_sessions on control_sessions;
create trigger set_updated_at_control_sessions before update on control_sessions for each row execute function set_updated_at();

insert into stations (id, name, city, district, address, latitude, longitude, distance_km, tags)
values
  ('11111111-1111-1111-1111-111111111111', '科技园站', '深圳市', '南山区', '深圳市南山区科苑路15号', 22.540200, 113.954400, 1.20, array['24小时', '自助洗车', '扫码即用']),
  ('22222222-2222-2222-2222-222222222222', '会展中心站', '深圳市', '福田区', '深圳市福田区福华三路88号', 22.536800, 114.059600, 6.80, array['商圈站点', '停车方便'])
on conflict (id) do nothing;

insert into app_users (
  id, username, phone, email, password_hash, display_name, avatar_url, city, district, member_since, wallet_balance, wash_credits, agreement_accepted, default_station_id, time_card_expires_at
)
values (
  '33333333-3333-3333-3333-333333333333',
  'zhangzhijie',
  '13800138000',
  'demo@zhijing.app',
  '1a2b3c4d5e6f77889900aabbccddeeff:372c7a7c39588d2ddc737a5ce977425eb17d9c65d279dbc44de9dd28cd3b106034031cbeed95d79bd5c967eb88df901753647c2cae79648a34b77f574f5e0fa0',
  '张智捷',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDb_PgR8LXe0CjYMo6H2lrsNCNY2qZ8eigDIR5LKuUHlp2a84TP-jqNQugMFwgennq2uommwdVXtR7ou_CmLjj1M7aCBKAWNzDOGNZR4LZR_I4Ln4kRAqWa4neEyvSiE_i3qq2IeCeJe378qOqbaw_XNCPJ2gInG1DIuQwiNjMHX3fTdWkR0-c5ONnPaevW0AHAKCRGkkxPU3Pdru_oBetB5kxaMh_aSJRnYLmZ3I3TQPU8JrbqY9H-t1w3HOnlFCvQs1rr7F02wTcd',
  '深圳市',
  '南山区',
  now() - interval '11 months',
  156.00,
  8,
  true,
  '11111111-1111-1111-1111-111111111111',
  null
)
on conflict (id) do nothing;

insert into memberships (user_id, tier, label, growth_value, next_tier_growth_value)
values ('33333333-3333-3333-3333-333333333333', 'gold', '金卡会员', 2500, 3000)
on conflict (user_id) do nothing;

insert into membership_benefits (id, membership_user_id, title, description, icon, sort_order)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', '洗车 9 折', '所有标准洗车订单享受 9 折优惠。', 'discount', 1),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', '生日免单', '生日当月赠送 1 次免费标准洗车。', 'cake', 2),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', '专属客服', '享受 7x24 快速响应售后服务。', 'support_agent', 3)
on conflict (id) do nothing;

insert into devices (id, station_id, code, name, status, current_order_id)
values
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'A01', 'A01 智能洗车机', 'reserved', null),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'B02', 'B02 智能洗车机', 'idle', null),
  ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 'C03', 'C03 智能洗车机', 'idle', null),
  ('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', 'D04', 'D04 智能洗车机', 'maintenance', null)
on conflict (id) do nothing;

insert into wash_packages (id, kind, title, subtitle, price, original_price, credits, duration_days, highlight)
values
  ('66666666-6666-6666-6666-666666666661', 'wash_card', '单次体验', '随时随地 即刻洗净', 15, 20, 1, null, null),
  ('66666666-6666-6666-6666-666666666662', 'wash_card', '家庭5次卡', '全家共享 经济实惠', 59, null, 5, null, null),
  ('66666666-6666-6666-6666-666666666663', 'wash_card', '至尊10次洗车卡', 'Popular Choice', 99, null, 10, null, '热门选择'),
  ('66666666-6666-6666-6666-666666666664', 'time_card', 'PREMIUM BLACK', '365 DAYS UNLIMITED', 1999, null, null, 365, '年度无限次')
on conflict (id) do nothing;

insert into recharge_offers (id, kind, amount, bonus, label, highlighted)
values
  ('77777777-7777-7777-7777-777777777771', 'fixed', 100, 10, '充100送10', false),
  ('77777777-7777-7777-7777-777777777772', 'fixed', 500, 60, '充500送60', true),
  ('77777777-7777-7777-7777-777777777773', 'fixed', 1000, 150, '充1000送150', false)
on conflict (id) do nothing;

insert into recharge_records (id, user_id, offer_id, amount, bonus, final_amount, created_at)
values
  ('88888888-8888-8888-8888-888888888881', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777772', 500, 60, 560, now() - interval '4 days')
on conflict (id) do nothing;

insert into bookings (id, user_id, station_id, device_id, scheduled_at, status, created_at)
values
  ('99999999-9999-9999-9999-999999999991', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', now() + interval '1 day', 'upcoming', now() - interval '30 minutes')
on conflict (id) do nothing;

insert into orders (id, user_id, station_id, device_id, status, started_at, ended_at, duration_minutes, amount)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'completed', now() - interval '4 days', now() - interval '4 days' + interval '25 minutes', 25, 25.00)
on conflict (id) do nothing;

insert into notifications (id, user_id, type, title, content, read, created_at)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '33333333-3333-3333-3333-333333333333', 'system', '系统通知', '您的洗车预约（科技园站 A01设备）即将开始，请提前5分钟到达门店。', false, now() - interval '10 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '33333333-3333-3333-3333-333333333333', 'promotion', '优惠活动', '充值500元送60元活动仍在进行中，欢迎参与。', false, now() - interval '1 day'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '33333333-3333-3333-3333-333333333333', 'order', '订单完成', '您在科技园站的洗车订单已完成，感谢您的使用，期待您的评价。', true, now() - interval '4 days')
on conflict (id) do nothing;
