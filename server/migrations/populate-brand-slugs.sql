-- Populate missing brand slugs from brand names
UPDATE brands
SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '/', '-'), '\\', '-'), '.', '-'), ',', '-'), '  ', '-'), '---', '-'))
WHERE slug IS NULL OR slug = '' OR slug ~ '^\s*$';