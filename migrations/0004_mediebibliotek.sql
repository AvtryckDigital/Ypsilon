-- Mediebiblioteket: bilder som laddats upp via bildfälten, textredigeraren eller biblioteket i admin.
-- En bild ligger kvar här även när den inte används på sajten, tills någon raderar den under Bilder.
-- Galleribilder ligger i album_images och visas i bildväljaren därifrån.
CREATE TABLE media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  src        TEXT NOT NULL UNIQUE,
  medium     TEXT,
  thumb      TEXT,
  name       TEXT,
  width      INTEGER,
  height     INTEGER,
  size       INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX media_created ON media (created_at DESC);
