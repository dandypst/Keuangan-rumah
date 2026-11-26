import { auth } from "@/auth";

// Pencarian koin di CoinGecko untuk mendapatkan ID-nya.
export async function GET(req: Request) {
  if (!(await auth())) return new Response("unauthorized", { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json([]);
  try {
    const j = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`, { next: { revalidate: 300 } }).then((r) => r.json());
    return Response.json((j.coins ?? []).slice(0, 8).map((c: { id: string; name: string; symbol: string }) => ({ id: c.id, name: c.name, symbol: c.symbol })));
  } catch {
    return Response.json([]);
  }
}
