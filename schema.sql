CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, updated_at TEXT NOT NULL, payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS transactions_updated_at_idx ON transactions(updated_at);
