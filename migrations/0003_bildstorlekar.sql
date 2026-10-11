-- Varje galleribild sparas i flera storlekar så att webbläsaren kan välja rätt för skärmen:
--   thumb  640 px bred   (rutnät och listor)
--   medium 1400 px bred  (mosaik, kort, mobil i full bredd)
--   src    2800 px bred  (helbild och bildvisare på stora skärmar)
-- original är filen precis som den laddades upp, för nedladdning i full upplösning.
-- width och height gäller src-versionen.
ALTER TABLE album_images ADD COLUMN medium TEXT;
ALTER TABLE album_images ADD COLUMN original TEXT;
