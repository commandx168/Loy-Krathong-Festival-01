-- Cloudflare D1 / SQLite schema for the free deployment.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 30),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  data BLOB NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('krathong', 'uploaded_base', 'decoration', 'background', 'event')),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS krathongs (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 30),
  wish_text TEXT NOT NULL CHECK (length(wish_text) BETWEEN 1 AND 1000),
  base_id TEXT NOT NULL,
  image_media_id TEXT REFERENCES media(id),
  decorations_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(decorations_json)),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'anonymous', 'private')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  krathong_id TEXT NOT NULL REFERENCES krathongs(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_krathongs_feed ON krathongs(event_id, status, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_krathongs_owner ON krathongs(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_feed ON messages(krathong_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_krathongs_image ON krathongs(image_media_id) WHERE image_media_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS daily_limits (
  fingerprint TEXT NOT NULL,
  day TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (fingerprint, day, action)
);

INSERT OR IGNORE INTO events (id,title,description,starts_at,ends_at,status)
VALUES ('loy-krathong-2569','ลอยกระทงออนไลน์ ๒๕๖๙','ร่วมลอยกระทงและส่งคำอธิษฐานออนไลน์','2026-01-01 00:00:00','2027-01-01 00:00:00','open');

CREATE TABLE IF NOT EXISTS draw_winners (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  display_name TEXT NOT NULL,
  drawn_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, owner_user_id)
);
