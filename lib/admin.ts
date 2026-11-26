// Hanya admin yang boleh mengatur tampilan Beranda. Ganti lewat env ADMIN_EMAIL.
export const isAdmin = (email?: string | null) =>
  (email ?? "").toLowerCase() === (process.env.ADMIN_EMAIL ?? "dandy.pujist@gmail.com").toLowerCase();
