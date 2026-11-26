import { auth } from "@/auth";
import { db } from "@/lib/db";

const SRC: Record<string, string | null> = { bank: null, ewallet: null, cash: null, crypto: "coingecko", stock: "yahoo", gold: "gold" };
const PAL = ["#f97316", "#3b82f6", "#a855f7", "#eab308", "#10b981", "#06b6d4", "#ec4899", "#84cc16"];
const no = (s = "bad request", status = 400) => new Response(s, { status });

export async function POST(req: Request) {
  if (!(await auth())) return no("unauthorized", 401);
  const b = await req.json();
  const type = String(b.type);
  if (!(type in SRC)) return no();
  const name = String(b.name ?? "").trim().slice(0, 40);
  const amount = Number(b.amount);
  if (!name || !(amount >= 0)) return no();
  const source = SRC[type];
  let symbol: string | null = null;
  if (source === "coingecko") symbol = String(b.symbol ?? "").trim().toLowerCase();
  if (source === "yahoo") {
    symbol = String(b.symbol ?? "").trim().toUpperCase();
    if (symbol && !symbol.includes(".")) symbol += ".JK";
  }
  if (source === "gold") symbol = "gold";
  if (source && !symbol) return no();

  const { data: last } = await db.from("accounts").select("sort").order("sort", { ascending: false }).limit(1);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || type;
  const id = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const color = PAL[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % PAL.length];
  const { error } = await db.from("accounts").insert({
    id, name, type, sub: String(b.sub ?? "").slice(0, 40), color, symbol, source,
    balance: source ? 0 : amount, qty: source ? amount : null, sort: (last?.[0]?.sort ?? 0) + 1,
  });
  if (error) return no(error.message, 500);
  return Response.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  if (!(await auth())) return no("unauthorized", 401);
  const b = await req.json();
  const { data: a } = await db.from("accounts").select("id,source").eq("id", b.id).single();
  if (!a) return no("not found", 404);
  const name = String(b.name ?? "").trim().slice(0, 40);
  if (!name) return no();
  const upd: Record<string, unknown> = { name, sub: String(b.sub ?? "").slice(0, 40) };
  if (a.id !== "jago") {
    // saldo Bank Jago dihitung dari Kantong, jadi tidak bisa diubah manual
    const n = Number(b.amount);
    if (!(n >= 0)) return no();
    if (a.source) upd.qty = n;
    else upd.balance = n;
  }
  const { error } = await db.from("accounts").update(upd).eq("id", a.id);
  if (error) return no(error.message, 500);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await auth())) return no("unauthorized", 401);
  const id = new URL(req.url).searchParams.get("id");
  if (!id || id === "jago") return no();
  await db.from("transactions").update({ account_id: null }).eq("account_id", id);
  const { error } = await db.from("accounts").delete().eq("id", id);
  if (error) return no(error.message, 500);
  return Response.json({ ok: true });
}
