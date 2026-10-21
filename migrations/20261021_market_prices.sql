CREATE TABLE IF NOT EXISTS market_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  price REAL NOT NULL,
  currency TEXT NOT NULL,
  change_value REAL,
  change_percent REAL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available'
);
CREATE INDEX IF NOT EXISTS idx_market_prices_latest
ON market_prices(market, symbol, currency, id DESC);

CREATE TABLE IF NOT EXISTS market_refresh_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market TEXT NOT NULL,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT
);
