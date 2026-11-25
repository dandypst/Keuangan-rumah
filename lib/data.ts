import { db } from "./db";
import { cycle } from "./cycle";
import { getQuotes } from "./prices";
import type { Account, Data } from "./types";

const day = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

export async function loadData(): Promise<Data> {
  const { start, end, total, daysLeft } = cycle();
  const [a, p, t] = await Promise.all([
    db.from("accounts").select("*").order("sort"),
    db.from("pockets").select("*").order("name"),
    db.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(1000),
  ]);
  const rows = a.data ?? [];
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
    return { id: r.id, name: r.name, type: r.type, sub: r.sub, color: r.color, market, qty, price, change: quotes[key]?.c ?? 0, key, value };
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

  return { accounts, pockets, txs, timeFrac, daysLeft, start: day(start.toISOString()), end: day(new Date(end.getTime() - 1).toISOString()) };
}
