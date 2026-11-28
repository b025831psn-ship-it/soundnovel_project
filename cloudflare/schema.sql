-- Save server tables (functions/_lib/sync.js). Apply: npx wrangler d1 execute soundnovel-saves --remote --file schema.sql
CREATE TABLE IF NOT EXISTS vaults (id TEXT PRIMARY KEY, auth TEXT NOT NULL, saves TEXT NOT NULL, ver INTEGER NOT NULL, created INTEGER NOT NULL, client TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS vaults_client ON vaults (client, created);
CREATE TABLE IF NOT EXISTS pairs (code TEXT PRIMARY KEY, blob TEXT NOT NULL, auth TEXT NOT NULL, expires INTEGER);
CREATE TABLE IF NOT EXISTS fails (client TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS fails_client ON fails (client, at);
CREATE TABLE IF NOT EXISTS snaps (game TEXT NOT NULL, code TEXT NOT NULL, token TEXT NOT NULL, data TEXT NOT NULL, used INTEGER NOT NULL, created INTEGER NOT NULL, client TEXT NOT NULL, PRIMARY KEY (game, code));
CREATE INDEX IF NOT EXISTS snaps_used ON snaps (used);
CREATE INDEX IF NOT EXISTS snaps_client ON snaps (client, created);
