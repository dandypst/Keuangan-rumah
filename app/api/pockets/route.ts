import { auth } from "@/auth";
import { db } from "@/lib/db";

const no = (s = "bad request", status = 400) => new Response(s, { status });

// Menyamakan saldo Kantong dengan app Jago: saldo baru jadi titik awal,
// email sebelum saat ini diabaikan, email sesudahnya dihitung sebagai perubahan.
async function write(req: Request, create: boolean) {
  if (!(await auth())) return no("unauthorized", 401);
  const b = await req.json();
  const name = String(b.name ?? "").trim().slice(0, 60);
  const balance = Math.round(Number(b.balance));
  if (!name || !(balance >= 0)) return no();
  const row = { name, opening_balance: balance, opening_at: new Date().toISOString() };
  if (create) {
    const { error } = await db.from("pockets").insert(row);
    if (error) return no(error.message, 500);
  } else {
    const { error } = await db.from("pockets").update(row).eq("name", name);
    if (error) return no(error.message, 500);
  }
  return Response.json({ ok: true });
}

export const POST = (req: Request) => write(req, true);
export const PATCH = (req: Request) => write(req, false);
