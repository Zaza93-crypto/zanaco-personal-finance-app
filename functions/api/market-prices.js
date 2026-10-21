const LUSE_URL = "https://www.luse.co.zm/trading/market-data/";
const BTC_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd%2Czmw&include_24hr_change=true&include_last_updated_at=true";

const now = () => new Date().toISOString();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function stale(date, maxAge) {
  const t = Date.parse(date);
  return !Number.isFinite(t) || Date.now() - t > maxAge;
}

async function logRun(env, market, source, status, message) {
  await env.DB.prepare(
    "INSERT INTO market_refresh_runs (market,source,fetched_at,status,message) VALUES (?,?,?,?,?)"
  ).bind(market, source, now(), status, message).run();
}

async function store(env, rows) {
  for (const p of rows) {
    await env.DB.prepare(
      `INSERT INTO market_prices
      (market,symbol,name,price,currency,change_value,change_percent,
       source,source_url,observed_at,fetched_at,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      p.market, p.symbol, p.name || p.symbol, p.price, p.currency,
      p.change_value ?? null, p.change_percent ?? null,
      p.source, p.source_url, p.observed_at || now(), now(), "available"
    ).run();
  }
}

async function refreshBitcoin(env) {
  const res = await fetch(BTC_URL, {
    headers: { accept: "application/json" },
    cf: { cacheTtl: 0 }
  });

  if (!res.ok) throw new Error("CoinGecko HTTP " + res.status);

  const data = await res.json();
  const b = data.bitcoin;

  if (!b || !Number.isFinite(b.usd) || !Number.isFinite(b.zmw)) {
    throw new Error("Incomplete Bitcoin price response");
  }

  const observed = new Date(
    (b.last_updated_at || Math.floor(Date.now() / 1000)) * 1000
  ).toISOString();

  await store(env, [
    {
      market: "CRYPTO", symbol: "BTC", name: "Bitcoin",
      price: b.usd, currency: "USD",
      change_percent: b.usd_24h_change,
      source: "CoinGecko API",
      source_url: "https://www.coingecko.com/en/coins/bitcoin",
      observed_at: observed
    },
    {
      market: "CRYPTO", symbol: "BTC", name: "Bitcoin",
      price: b.zmw, currency: "ZMW",
      change_percent: b.zmw_24h_change,
      source: "CoinGecko API",
      source_url: "https://www.coingecko.com/en/coins/bitcoin",
      observed_at: observed
    }
  ]);

  await logRun(env, "CRYPTO", "CoinGecko API", "success",
    "Bitcoin prices refreshed");
}

function clean(s) {
  return s.replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, " ").trim();
}

function number(s) {
  const n = Number(String(s).replace(/,/g, "").replace(/[−–]/g, "-").trim());
  return Number.isFinite(n) ? n : null;
}

async function refreshLuse(env) {
  const res = await fetch(LUSE_URL, {
    headers: {
      accept: "text/html",
      "user-agent": "ZanacoFinanceDashboard/1.0"
    },
    cf: { cacheTtl: 0 }
  });

  if (!res.ok) throw new Error("Official LuSE page HTTP " + res.status);

  const html = await res.text();
  const marker = html.search(/Daily Stock Data/i);

  if (marker < 0) {
    throw new Error("Daily Stock Data heading not found on LuSE page");
  }

  const section = html.slice(marker, marker + 150000);
  const table = section.match(/<table\b[\s\S]*?<\/table>/i);

  if (!table) throw new Error("LuSE stock table not found");

  const parsed = [];

  for (const tr of table[0].match(/<tr\b[\s\S]*?<\/tr>/gi) || []) {
    const cells = [
      ...tr.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)
    ].map(m => clean(m[1]));

    if (cells.length < 4) continue;

    const symbol = cells[0];
    const price = number(cells[2]);

    if (!/^[A-Z0-9.-]{2,15}$/.test(symbol) || price === null) continue;

    parsed.push({
      market: "LUSE",
      symbol,
      name: symbol,
      price,
      currency: "ZMW",
      change_value: number(cells[3]),
      source: "LuSE official market-data page",
      source_url: LUSE_URL,
      observed_at: now()
    });
  }

  if (parsed.length < 5) {
    throw new Error("Too few valid LuSE rows; previous prices preserved");
  }

  await store(env, parsed);
  await logRun(env, "LUSE", "LuSE official market-data page",
    "success", parsed.length + " securities refreshed");
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const market = (url.searchParams.get("market") || "ALL").toUpperCase();

    const result = await env.DB.prepare(
      `SELECT p.* FROM market_prices p
       JOIN (
         SELECT market,symbol,currency,MAX(id) id
         FROM market_prices GROUP BY market,symbol,currency
       ) x ON p.id=x.id
       WHERE (?='ALL' OR p.market=?)
       ORDER BY p.market,p.symbol`
    ).bind(market, market).all();

    const runs = await env.DB.prepare(
      "SELECT market,source,fetched_at,status,message FROM market_refresh_runs ORDER BY id DESC LIMIT 10"
    ).all();

    const prices = (result.results || []).map(p => ({
      ...p,
      stale: p.market === "CRYPTO"
        ? stale(p.observed_at, 15 * 60 * 1000)
        : stale(p.fetched_at, 48 * 60 * 60 * 1000)
    }));

    return json({
      prices,
      runs: runs.results || [],
      jse: {
        status: "unavailable",
        message: "No verified, permitted JSE feed configured."
      },
      generated_at: now()
    });
  } catch (e) {
    return json({
      error: "Market database is not ready or migration is not applied.",
      detail: String(e.message || e)
    }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.MARKET_REFRESH_SECRET) {
    return json({ error: "MARKET_REFRESH_SECRET is not configured." }, 503);
  }

  if (request.headers.get("authorization") !==
      "Bearer " + env.MARKET_REFRESH_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const task = (new URL(request.url).searchParams.get("task") || "all")
    .toLowerCase();
  const results = [];

  if (task === "all" || task === "bitcoin") {
    try {
      await refreshBitcoin(env);
      results.push({ market: "CRYPTO", status: "success" });
    } catch (e) {
      const message = String(e.message || e);
      results.push({ market: "CRYPTO", status: "error", message });
      await logRun(env, "CRYPTO", "CoinGecko API", "error", message)
        .catch(() => {});
    }
  }

  if (task === "all" || task === "luse") {
    try {
      await refreshLuse(env);
      results.push({ market: "LUSE", status: "success" });
    } catch (e) {
      const message = String(e.message || e);
      results.push({ market: "LUSE", status: "error", message });
      await logRun(env, "LUSE", "LuSE official market-data page",
        "error", message).catch(() => {});
    }
  }

  return json(
    { results, generated_at: now() },
    results.some(r => r.status === "error") ? 502 : 200
  );
}

