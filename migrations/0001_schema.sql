-- Ypsilons databas (Cloudflare D1 / SQLite).
-- Datum och tider lagras som text i lokal svensk tid, till exempel "2026-01-19T18:00",
-- så att ingen tidszonsomräkning kan flytta ett evenemang.

-- Admin-konton och inloggning ------------------------------------------------

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessionens id är en SHA-256-hash av kakan, så en läckt databas ger inga giltiga sessioner.
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX sessions_user ON sessions(user_id);

-- Begränsar antalet inloggningsförsök per IP-adress.
CREATE TABLE login_attempts (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  first_at INTEGER NOT NULL
);

-- Innehåll ------------------------------------------------------------------

-- Fria inställningar som syns i sidfoten och på kontaktsidan.
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Redigerbara sidor med fast adress, till exempel "om-ypsilon" och "historia".
CREATE TABLE pages (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  intro      TEXT,
  body       TEXT,
  image      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  body         TEXT,
  cover        TEXT,
  author       TEXT,
  published    INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL DEFAULT (date('now')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX posts_published ON posts(published, published_at);

-- kind: 'yra' = Yra eller extra viktigt evenemang, 'vanlig' = övrigt,
--       'extern' = evenemang som Ypsilon inte arrangerar men som kan vara kul att gå på.
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT,
  location    TEXT,
  description TEXT,
  kind        TEXT NOT NULL DEFAULT 'vanlig',
  link        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX events_starts ON events(starts_at);

CREATE TABLE songs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  number     INTEGER,
  category   TEXT,
  melody     TEXT,
  lyrics     TEXT NOT NULL DEFAULT '',
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE board_members (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  role             TEXT NOT NULL,
  role_description TEXT,
  name             TEXT NOT NULL,
  email            TEXT,
  image            TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

-- sort_year räknas fram från perioden (t.ex. "1974 HT–1977" ger 1974) och används för sortering.
CREATE TABLE former_chairs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  period     TEXT NOT NULL,
  name       TEXT NOT NULL,
  note       TEXT,
  image      TEXT,
  sort_year  INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE honorary_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  year       INTEGER NOT NULL,
  name       TEXT NOT NULL,
  motivation TEXT,
  image      TEXT
);

CREATE TABLE contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  role        TEXT NOT NULL,
  email       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE albums (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  photographer TEXT,
  event_date   TEXT,
  cover        TEXT,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE album_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id   INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  src        TEXT NOT NULL,
  thumb      TEXT NOT NULL,
  width      INTEGER,
  height     INTEGER,
  caption    TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX album_images_album ON album_images(album_id, sort_order);
