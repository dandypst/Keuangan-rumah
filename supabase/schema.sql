create table accounts (
  id text primary key,
  name text not null,
  type text not null check (type in ('bank','ewallet','cash','crypto','stock','gold')),
  sub text not null default '',
  balance numeric not null default 0,          -- akun non-pasar (tunai, e-wallet)
  qty numeric,                                  -- aset pasar: jumlah koin / lembar saham / gram
  symbol text,                                  -- coingecko id, kode Yahoo (BBCA.JK), atau 'gold'
  source text check (source in ('coingecko','yahoo','gold')),
  color text not null default '#3b82f6',
  sort int not null default 100
);
create table pockets (
  name text primary key,
  opening_balance bigint not null default 0,
  opening_at timestamptz not null default now()
);
create table transactions (
  id bigserial primary key,
  gmail_id text unique,
  occurred_at timestamptz not null default now(),
  kind text not null check (kind in ('expense','income','topup','unknown')),
  actor text,
  amount bigint not null default 0,
  pocket text,
  account_id text references accounts(id),
  category text,
  title text
);
create table google_tokens (
  email text primary key,
  refresh_token_enc text not null,
  updated_at timestamptz not null default now()
);
-- RLS aktif tanpa policy: hanya service_role (server) yang bisa akses.
alter table accounts enable row level security;
alter table pockets enable row level security;
alter table transactions enable row level security;
alter table google_tokens enable row level security;

insert into accounts (id, name, type, sub, color, sort) values
 ('jago', 'Bank Jago', 'bank', 'Kantong Bayar', '#f59e0b', 1);

-- Saldo awal Kantong = angka di app Jago pada 22 Nov 2026 20.59 WIB.
-- Nama harus persis sama dengan nama Kantong di email Jago.
insert into pockets (name, opening_balance, opening_at) values
 ('Bensin', 11267, '2026-11-22 20:59+07'),
 ('Kesehatan', 78226, '2026-11-22 20:59+07'),
 ('Lain lain', 204253, '2026-11-22 20:59+07'),
 ('Liburan', 988, '2026-11-22 20:59+07'),
 ('Makan dan grocery makan', 120943, '2026-11-22 20:59+07'),
 ('Perawatan Kendaraan', 998, '2026-11-22 20:59+07'),
 ('Perawatan rumah', 0, '2026-11-22 20:59+07'),
 ('WIFI PLN IPL', 5794, '2026-11-22 20:59+07');

-- Contoh menambah akun lain (hapus tanda -- lalu sesuaikan):
-- insert into accounts (id,name,type,sub,balance,color,sort) values ('gopay','GoPay','ewallet','Harian',0,'#06b6d4',2);
-- insert into accounts (id,name,type,sub,balance,color,sort) values ('cash','Dompet Tunai','cash','Pegangan harian',0,'#f97316',3);
-- insert into accounts (id,name,type,sub,qty,symbol,source,color,sort) values ('btc','Bitcoin','crypto','BTC',0.0042,'bitcoin','coingecko','#a855f7',4);
-- insert into accounts (id,name,type,sub,qty,symbol,source,color,sort) values ('bbca','BBCA','stock','20 lot',2000,'BBCA.JK','yahoo','#3b82f6',5);
-- insert into accounts (id,name,type,sub,qty,symbol,source,color,sort) values ('gold','Emas','gold','5 gram',5,'gold','gold','#eab308',6);

-- Pembaruan (jalankan juga di project yang sudah ada):
alter table accounts add column if not exists logo text;
create table if not exists settings (key text primary key, value jsonb not null);
alter table settings enable row level security;
