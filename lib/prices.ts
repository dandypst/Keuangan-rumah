export type Quote = { p: number; c: number }; // harga (IDR) dan perubahan harian (%)
type Item = { key: string; source: string; symbol: string };

const opt: RequestInit = { next: { revalidate: 30 }, headers: { "User-Agent": "Mozilla/5.0" } };

async function yahoo(sym: string): Promise<Quote | null> {
  try {
    const j = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`, opt).then((r) => r.json());
    const m = j.chart.result[0].meta;
    const prev = m.chartPreviousClose ?? m.previousClose;
    return { p: m.regularMarketPrice, c: prev ? (m.regularMarketPrice / prev - 1) * 100 : 0 };
  } catch {
    return null;
  }
}

// Kripto: CoinGecko. Saham IDX: Yahoo (BBCA.JK). Emas: harga spot XAU x kurs, per gram.
// Harga Antam biasanya di atas spot: atur GOLD_PREMIUM (misal 1.06).
export async function getQuotes(items: Item[]) {
  const out: Record<string, Quote> = {};
  const cg = items.filter((i) => i.source === "coingecko");
  if (cg.length) {
    try {
      const ids = cg.map((i) => i.symbol).join(",");
      const j = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr&include_24hr_change=true`, opt).then((r) => r.json());
      cg.forEach((i) => { const q = j[i.symbol]; if (q) out[i.key] = { p: q.idr, c: q.idr_24h_change ?? 0 }; });
    } catch {}
  }
  await Promise.all(items.filter((i) => i.source === "yahoo").map(async (i) => { const q = await yahoo(i.symbol); if (q) out[i.key] = q; }));
  const gold = items.filter((i) => i.source === "gold");
  if (gold.length) {
    const [g, fx] = await Promise.all([yahoo("GC=F"), yahoo("IDR=X")]);
    if (g && fx) {
      const prem = Number(process.env.GOLD_PREMIUM ?? 1);
      gold.forEach((i) => (out[i.key] = { p: (g.p / 31.1035) * fx.p * prem, c: g.c }));
    }
  }
  return out;
}
