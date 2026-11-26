import { db } from "./db";
import { cycle } from "./cycle";
import { getQuotes } from "./prices";
import { logoUrl } from "./logo";
import { isAdmin } from "./admin";
import type { Account, Data, Home } from "./types";

const day = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

export async function loadData(email?: string | null): Promise<Data> {
  const { start, end, total, daysLeft } = cycle();
  const [a, p, t] = await Promise.all([
    db.from("accounts").select("*").order("sort"),
    db.from("pockets").select("*").order("name"),
    db.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(1000),
  ]);
  const rows = a.data ?? [];
  const { data: st } = await db.from("settings").select("value").eq("key", "home").maybeSingle();
  const home: Home = { summary: true, txs: true, pockets: [], ...(st?.value ?? {}) };

  // Logo koin: diambil sekali dari CoinGecko lalu disimpan di database.
  const need = rows.filter((r) => r.source === "coingecko" && !r.logo);
  if (need.length) {
    try {
      const ids = need.map((r) => r.symbol).join(",");
      const j = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&ids=${ids}&per_page=250`, { next: { revalidate: 3600 } }).then((r) => r.json());
      await Promise.all(
        (Array.isArray(j) ? j : []).map(async (c: { id: string; image: string }) => {
          const r = need.find((x) => x.symbol === c.id);
          if (r && c.image) { r.logo = c.image; await db.from("accounts").update({ logo: c.image }).eq("id", r.id); }
        }),
      );
    } catch {}
  }
  const all = t.data ?? [];
  const quotes = await getQuotes(rows.filter((r) => r.source).map((r) => ({ key: `${r.source}:${r.symbol}`, source: r.source, symbol: r.symbol })));
  const timeFrac = daysLeft / total;

  const pockets = (p.data ?? []).map((k) => {
    const mine = all.filter((x) => x.pocket === k.name);
    const sum = (kind: string, from: Date) =>
      mine.filter((x) => x.kind === kind && new Date(x.occurred_at) > from).reduce((s, x) => s + Number(x.amount), 0);
    const bal = Number(k.opening_balance) + sum("topup", new Date(k.opening_at)) - sum("expense", new Date(k.opening_at));
    const spent = sum("expense", new Date(start.getTime() - 1));
    const frac = bal + spent > 0 ? Math.max(0, bal) / (bal + spent) : 1;
    return { name: k.name as string, bal, perDay: bal / daysLeft, frac, warn: spent > 0 && frac < timeFrac };
  });

  const jago = pockets.reduce((s, k) => s + k.bal, 0);
  const accounts: Account[] = rows.map((r) => {
    const key = `${r.source}:${r.symbol}`;
    const market = !!r.source;
    const price = quotes[key]?.p ?? 0;
    const qty = Number(r.qty ?? 0);
    const value = r.id === "jago" ? jago : market ? qty * price || Number(r.balance) : Number(r.balance);
    return { id: r.id, name: r.name, type: r.type, sub: r.sub, color: r.color, logo: logoUrl(r.name, r.logo) ?? "", logoRaw: r.logo ?? "", market, symbol: r.symbol ?? "", qty, price, change: quotes[key]?.c ?? 0, key, value };
  });

  const txs = all
    .filter((x) => x.kind === "expense" || x.kind === "income")
    .map((x) => ({
      id: x.id as number,
      date: day(x.occurred_at),
      title: (x.title ?? x.category ?? "Transaksi") as string,
      cat: (x.category ?? "Lainnya") as string,
      acc: (x.account_id ?? "") as string,
      amount: x.kind === "expense" ? -Number(x.amount) : Number(x.amount),
    }));

  return { accounts, pockets, txs, timeFrac, daysLeft, isAdmin: isAdmin(email), home, start: day(start.toISOString()), end: day(new Date(end.getTime() - 1).toISOString()) };
}
