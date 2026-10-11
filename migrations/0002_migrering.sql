-- År för album som saknar exakt datum (vanligt i den gamla sajtens galleri),
-- och källa så att migreringen från WordPress kan köras om utan dubbletter.
ALTER TABLE albums ADD COLUMN year INTEGER;
ALTER TABLE albums ADD COLUMN source TEXT;
ALTER TABLE posts ADD COLUMN source TEXT;
CREATE UNIQUE INDEX albums_source ON albums(source) WHERE source IS NOT NULL;
CREATE UNIQUE INDEX posts_source ON posts(source) WHERE source IS NOT NULL;
UPDATE albums SET year = CAST(substr(event_date, 1, 4) AS INTEGER) WHERE event_date IS NOT NULL;
