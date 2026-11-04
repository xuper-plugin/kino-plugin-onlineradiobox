// The site this plugin reads: onlineradiobox.com's HTML lists, and how a station in one becomes a Kino item.
// Every list (a country, a genre, a search) is the same markup: <li class="stations__station"> with a play button that
// carries the stream, its type, the station's id, name and logo.

export const BASE = "https://onlineradiobox.com";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decode(s) {
  return String(s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] || m)
    .replace(/\s+/g, " ")
    .trim();
}

// Throws only AFTER its first await.
export async function getHtml(path) {
  const r = await kino.fetch(BASE + path);
  if (r.status === 404) throw kino.error("not_found", "onlineradiobox answered 404 for " + path.slice(0, 80));
  if (r.status === 429) throw kino.error("rate_limited", "onlineradiobox answered 429");
  if (!r.ok) throw kino.error("unavailable", "onlineradiobox answered " + r.status);
  return r.text();
}

// The attributes of an element's opening tag, by name.
function attr(tag, name) {
  const m = new RegExp("(?:^|\\s)" + name + '="([^"]*)"', "i").exec(tag);
  return m ? decode(m[1]) : "";
}

// "co.caracolbogota": the country and the station's name in the site, as in its address (/co/caracolbogota/).
const STATION_ID = /^([a-z]{2,3})\.([A-Za-z0-9_-]{1,80})$/;

export function isStationId(id) {
  return typeof id === "string" && STATION_ID.test(id);
}

export function pathOf(id) {
  const m = STATION_ID.exec(id);
  return m ? `/${m[1]}/${m[2]}/` : null;
}

function https(url) {
  const u = String(url || "");
  return u.startsWith("//") ? "https:" + u : /^https:\/\//.test(u) ? u : "";
}

// Each play button of the page (a station list, or a station's own page) as { id, name, logo, stream, hls }.
export function playButtons(html) {
  const out = [];
  const seen = new Set();
  for (const m of String(html || "").matchAll(/<button\b[^>]*\bstation_play\b[^>]*>/gi)) {
    const tag = m[0];
    const id = attr(tag, "radioId");
    const stream = attr(tag, "stream");
    if (!isStationId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: attr(tag, "radioName"), logo: https(attr(tag, "radioImg")), stream: /^https?:\/\//i.test(stream) ? stream : "", hls: attr(tag, "streamType").toLowerCase() === "hls" });
  }
  return out;
}

const mimeOf = (b) => (b.hls || /\.m3u8(\?|$)/i.test(b.stream) ? "application/x-mpegURL" : undefined);

export function streamOf(b) {
  const s = { url: b.stream };
  const mime = mimeOf(b);
  if (mime) s.mime = mime;
  return s;
}

export function stationItem(b) {
  if (!b.name) return null;
  const item = { id: "o-" + b.id, ref: "st:" + b.id, title: b.name.slice(0, 120), kind: "live" };
  if (b.logo) item.poster = b.logo;
  return item;
}

export function channelOf(b) {
  if (!b.name) return null;
  const channel = { id: b.id, title: b.name.slice(0, 120), ref: "st:" + b.id };
  if (b.logo) channel.logo = b.logo;
  if (b.stream) channel.stream = streamOf(b);
  return channel;
}

// One page of a list. `p` is 0-based after the first page in the site's own pagination (?p=1 is the second page);
// a page past the end redirects, which kino.fetch answers as an empty list here.
export async function listPage(path, page) {
  const sep = path.includes("?") ? "&" : "?";
  const url = page > 1 ? `${path}${sep}p=${page - 1}` : path;
  try {
    return playButtons(await getHtml(url));
  } catch (e) {
    if (e && e.code === "not_found") return [];
    throw e;
  }
}
