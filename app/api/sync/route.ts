import { auth } from "@/auth";
import { syncOwner } from "@/lib/sync";

export const maxDuration = 60;

// Dipanggil Vercel Cron (Bearer CRON_SECRET) atau manual oleh user yang sudah login.
export async function GET(req: Request) {
  const cron = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!cron && !(await auth())) return new Response("unauthorized", { status: 401 });
  return Response.json(await syncOwner());
}
