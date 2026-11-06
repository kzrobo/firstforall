#!/usr/bin/env node
// Local stand-in for the YouTube Data API v3 (playlistItems, videos, playlists) for testing the
// LEARN sync without a real key. Every video it serves is clearly labelled LOCAL TEST.
//   node scripts/dev/mock-youtube-api.mjs [port]          (default 4010)
// Run the site with YOUTUBE_API_BASE=http://localhost:4010 YOUTUBE_API_KEY=local-test-key.
// Control:  POST /__mock/state  {"videos":[…],"playlists":[…],"fail":null|"quota"|"500"|"badkey"}
//           GET  /__mock/state  ·  GET /__mock/calls (request count)
import { createServer } from "node:http";

const port = Number(process.argv[2] || 4010);
const KEY = "local-test-key";
const CHANNEL = "UCvNENrJ9fRJP4nO4YZu5jsg";
const PAGE = Number(process.env.MOCK_PAGE_SIZE || 2); // small pages exercise pagination
let state = { videos: [], playlists: [], fail: null };
let calls = 0;

const send = (res, code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type }); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
const apiError = (res, code, reason, message) => send(res, code, { error: { code, message, errors: [{ reason, message }] } });
const thumb = (id) => `http://localhost:${port}/thumbs/${id}.svg`;

function svg(id) {
  const v = state.videos.find((x) => x.id === id);
  const hue = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<rect width="1280" height="720" fill="hsl(${hue} 45% 22%)"/><rect x="0" y="0" width="1280" height="64" fill="#f4c542"/>
<text x="40" y="43" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#111">LOCAL TEST VIDEO — mock YouTube thumbnail, not real channel content</text>
<text x="60" y="380" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="#fff">${esc(v?.title ?? id).slice(0, 38)}</text>
<text x="60" y="450" font-family="Arial,sans-serif" font-size="30" fill="#ffffffcc">${esc(id)}</text></svg>`;
}

function page(items, token) {
  const start = Number(token || 0);
  const slice = items.slice(start, start + PAGE);
  return { items: slice, ...(start + PAGE < items.length ? { nextPageToken: String(start + PAGE) } : {}) };
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname === "/__mock/state") {
    if (req.method === "POST") { let b = ""; for await (const c of req) b += c; state = { ...state, ...JSON.parse(b || "{}") }; }
    return send(res, 200, state);
  }
  if (url.pathname === "/__mock/calls") return send(res, 200, { calls });
  if (url.pathname.startsWith("/thumbs/")) return send(res, 200, svg(url.pathname.slice(8).replace(/\.svg$/, "")), "image/svg+xml");

  calls++;
  if (req.headers["x-goog-api-key"] !== KEY || state.fail === "badkey") return apiError(res, 400, "keyInvalid", "API key not valid. Please pass a valid API key.");
  if (state.fail === "quota") return apiError(res, 403, "quotaExceeded", "The request cannot be completed because you have exceeded your quota.");
  if (state.fail === "500") return apiError(res, 500, "backendError", "Backend Error");
  const q = url.searchParams;
  const visible = state.videos.filter((v) => !v.deleted);

  if (url.pathname === "/playlistItems") {
    const pid = q.get("playlistId");
    let ids;
    if (pid === `UU${CHANNEL.slice(2)}`) ids = visible.filter((v) => (v.privacyStatus ?? "public") === "public").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map((v) => v.id);
    else { const pl = state.playlists.find((p) => p.id === pid); if (!pl) return apiError(res, 404, "playlistNotFound", "The playlist identified with the request's playlistId parameter cannot be found."); ids = pl.videoIds; }
    return send(res, 200, page(ids.map((id) => ({ contentDetails: { videoId: id } })), q.get("pageToken")));
  }
  if (url.pathname === "/videos") {
    const ids = (q.get("id") || "").split(",").filter(Boolean);
    const items = ids.map((id) => visible.find((v) => v.id === id)).filter(Boolean).map((v) => ({
      id: v.id,
      snippet: { channelId: v.channelId ?? CHANNEL, title: v.title, description: v.description ?? "", publishedAt: v.publishedAt, liveBroadcastContent: v.live ?? "none",
        defaultAudioLanguage: v.lang, thumbnails: { high: { url: thumb(v.id) }, maxres: { url: thumb(v.id) } } },
      contentDetails: { duration: v.duration ?? "PT10M" },
      status: { privacyStatus: v.privacyStatus ?? "public", uploadStatus: "processed", embeddable: v.embeddable ?? true },
    }));
    return send(res, 200, { items });
  }
  if (url.pathname === "/playlists") {
    return send(res, 200, page(state.playlists.map((p) => ({ id: p.id, snippet: { title: p.title }, contentDetails: { itemCount: p.videoIds.length } })), q.get("pageToken")));
  }
  apiError(res, 404, "notFound", "Not found");
}).listen(port, () => console.log(`mock YouTube Data API on http://localhost:${port}`));
