import { db } from "./db";
import { dec } from "./crypto";
import { parseJago } from "./parser";

const G = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
const text = (p: any): string =>
  p.body?.data ? Buffer.from(p.body.data, "base64url").toString("utf8") : (p.parts ?? []).map(text).join(" ");

export async function syncOwner() {
  const { data } = await db.from("google_tokens").select("refresh_token_enc").eq("email", process.env.OWNER_EMAIL!).single();
  if (!data) return { synced: 0, note: "OWNER_EMAIL belum login" };

  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      refresh_token: dec(data.refresh_token_enc),
      grant_type: "refresh_token",
    }),
  }).then((r) => r.json());
  if (!tok.access_token) return { synced: 0, note: "gagal refresh token Google" };
  const h = { Authorization: `Bearer ${tok.access_token}` };

  const q = encodeURIComponent(`from:${process.env.JAGO_SENDER ?? "noreply@jago.com"} newer_than:40d`);
  const list = await fetch(`${G}?q=${q}&maxResults=100`, { headers: h }).then((r) => r.json());
  const ids: string[] = (list.messages ?? []).map((m: any) => m.id);
  if (!ids.length) return { synced: 0 };

  const { data: seen } = await db.from("transactions").select("gmail_id").in("gmail_id", ids);
  const known = new Set((seen ?? []).map((s) => s.gmail_id));

  const rows = await Promise.all(
    ids.filter((i) => !known.has(i)).map(async (id) => {
      const m = await fetch(`${G}/${id}?format=full`, { headers: h }).then((r) => r.json());
      const body = text(m.payload).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
      const t = parseJago(body);
      return {
        gmail_id: id,
        occurred_at: new Date(Number(m.internalDate)).toISOString(),
        kind: t?.kind ?? "unknown",
        actor: t?.actor ?? null,
        amount: t?.amount ?? 0,
        pocket: t?.pocket ?? null,
        account_id: t ? "jago" : null,
        category: t?.pocket ?? null,
        title: t ? `${t.actor.split(" ")[0]} · ${t.kind === "expense" ? "pembayaran" : "tambah saldo"}` : null,
      };
    }),
  );
  if (rows.length) await db.from("transactions").insert(rows);
  return { synced: rows.length };
}
