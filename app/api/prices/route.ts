import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getQuotes } from "@/lib/prices";

export async function GET() {
  if (!(await auth())) return new Response("unauthorized", { status: 401 });
  const { data } = await db.from("accounts").select("source,symbol").not("source", "is", null);
  return Response.json(await getQuotes((data ?? []).map((r) => ({ key: `${r.source}:${r.symbol}`, source: r.source, symbol: r.symbol }))));
}
