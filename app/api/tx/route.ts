import { auth } from "@/auth";
import { db } from "@/lib/db";

// Transaksi manual untuk akun non-pasar (tunai, e-wallet). Akun Jago hanya dari email.
export async function POST(req: Request) {
  if (!(await auth())) return new Response("unauthorized", { status: 401 });
  const b = await req.json();
  const amount = Math.round(Number(b.amount));
  if (!(amount > 0) || !["expense", "income"].includes(b.kind) || b.accountId === "jago") return new Response("bad request", { status: 400 });
  const { data: a } = await db.from("accounts").select("balance,source").eq("id", b.accountId).single();
  if (!a || a.source) return new Response("bad account", { status: 400 });
  const category = String(b.category || "Lainnya");
  await db.from("transactions").insert({ kind: b.kind, amount, account_id: b.accountId, category, title: String(b.title || category) });
  await db.from("accounts").update({ balance: Number(a.balance) + (b.kind === "income" ? amount : -amount) }).eq("id", b.accountId);
  return Response.json({ ok: true });
}
