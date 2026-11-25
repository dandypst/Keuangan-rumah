# Keuangan Rumah

Dashboard keuangan rumah: total aset (bank, e-wallet, tunai, kripto, saham, emas), Kantong Bank Jago dari email notifikasi, aktivitas, dan laporan. Siklus gaji tanggal 25–24.

## Setup
1. **Supabase**: buat project, jalankan `supabase/schema.sql` di SQL Editor.
2. **Google Cloud**: aktifkan Gmail API → OAuth consent screen (status *Production*, scope `gmail.readonly`) → OAuth Client (Web).
   Redirect URI: `https://DOMAIN-KAMU/api/auth/callback/google` dan `http://localhost:3000/api/auth/callback/google`.
3. Salin `.env.example` ke `.env.local`, isi semua. Masukkan env yang sama di Vercel (Project → Settings → Environment Variables).
4. Push ke GitHub → Import di Vercel.
5. Buka web, login sebagai `OWNER_EMAIL` sekali (menyimpan refresh token terenkripsi). Email Jago langsung ter-index.

## Menambah akun dan aset
Lewat SQL Editor Supabase, contoh ada di bagian bawah `schema.sql`. Kolom `source` menentukan sumber harga realtime:
- `coingecko` — kripto, `symbol` = id CoinGecko (`bitcoin`, `ethereum`), `qty` = jumlah koin
- `yahoo` — saham IDX, `symbol` = `BBCA.JK`, `qty` = jumlah lembar (1 lot = 100 lembar)
- `gold` — emas, harga spot per gram (XAU × kurs). Atur `GOLD_PREMIUM` agar mendekati harga ritel/Antam
- Semua akun bertipe `crypto` otomatis dikelompokkan di bawah satu kartu dan satu baris "Kripto" (bisa dibuka untuk melihat tiap koin), satu baris `accounts` per koin
- kosong — tunai/e-wallet, saldo di kolom `balance`, diubah lewat tombol + di app

Harga diperbarui tiap 30 detik. Yahoo adalah endpoint tidak resmi dan CoinGecko versi gratis punya batas permintaan, jadi kalau harga kosong app memakai nilai terakhir di database.

## Catatan
- Hanya mailbox `OWNER_EMAIL` yang di-index (mencegah transaksi terhitung dobel). Istri tetap bisa login lewat `ALLOWED_EMAILS`.
- Halaman menarik email baru tiap dibuka dan tiap 60 detik. Cron harian di `vercel.json` hanya cadangan (plan Hobby membatasi cron sekali sehari).
- Email Jago yang polanya belum dikenali disimpan sebagai `unknown` di tabel `transactions`; kirim contohnya untuk ditambah ke `lib/parser.ts`.
- Pembaruan saldo awal Kantong: `update pockets set opening_balance=..., opening_at=now() where name='...';`

## Belum ada
Tambah akun lewat UI, transfer antar akun, foto struk, input suara, prediksi bensin, saran menu Makan via Claude API.
