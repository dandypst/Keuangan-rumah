import { auth } from "@/auth";
import { db } from "@/lib/db";

// Samakan saldo Kantong dengan angka di app Jago: saldo awal diganti dan
// perhitungan transaksi dimulai lagi dari sekarang.
export async function PATCH(req: Request) {
  if (!(await auth())) return new Response("unauthorized", { status: 401 });
  const b = await req.json();
  const balance = Math.round(Number(b.balance));
  if (!b.name || !(balance >= 0)) return new Response("bad request", { status: 400 });
  const { data, error } = await db
    .from("pockets")
    .update({ opening_balance: balance, opening_at: new Date().toISOString() })
    .eq("name", b.name)
    .select("name");
  if (error) return new Response(error.message, { status: 500 });
  if (!data?.length) return new Response("not found", { status: 404 });
  return Response.json({ ok: true });
}
