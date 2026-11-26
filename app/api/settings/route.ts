import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// Pengaturan tampilan Beranda: hanya admin yang boleh mengubah.
export async function PUT(req: Request) {
  const s = await auth();
  if (!s) return new Response("unauthorized", { status: 401 });
  if (!isAdmin(s.user?.email)) return new Response("forbidden", { status: 403 });
  const b = await req.json();
  const value = {
    summary: !!b.summary,
    txs: !!b.txs,
    pockets: Array.isArray(b.pockets) ? b.pockets.map(String).slice(0, 50) : [],
  };
  const { error } = await db.from("settings").upsert({ key: "home", value });
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
}
