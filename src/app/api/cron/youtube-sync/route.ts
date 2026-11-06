import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runYouTubeSync, type SyncTrigger } from "@/lib/youtube/sync";

/**
 * Scheduled YouTube → LEARN sync. Called by a scheduler (GitHub Actions, Vercel Cron, …) with
 * `Authorization: Bearer <CRON_SECRET>`. Without CRON_SECRET configured the endpoint refuses to run.
 * The response is a run summary — never keys or raw API payloads.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(req: NextRequest): boolean | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const header = req.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(req: NextRequest) {
  const ok = authorised(req);
  if (ok === null) return NextResponse.json({ status: "error", message: "CRON_SECRET is not configured on the server." }, { status: 503 });
  if (!ok) return NextResponse.json({ status: "error", message: "Unauthorised." }, { status: 401 });
  const trigger: SyncTrigger = req.nextUrl.searchParams.get("trigger") === "cli" ? "cli" : "schedule";
  const summary = await runYouTubeSync(trigger);
  return NextResponse.json(summary, { status: summary.status === "error" ? 502 : 200, headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
