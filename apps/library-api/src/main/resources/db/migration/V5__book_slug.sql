ALTER TABLE books ADD COLUMN slug VARCHAR(120);

UPDATE books SET slug = 'nha-gia-kim' WHERE id = '33333333-3333-3333-3333-333333333001';
UPDATE books SET slug = 'sapiens-luoc-su-loai-nguoi' WHERE id = '33333333-3333-3333-3333-333333333002';
UPDATE books SET slug = 'clean-code' WHERE id = '33333333-3333-3333-3333-333333333003';
UPDATE books SET slug = 'dac-nhan-tam' WHERE id = '33333333-3333-3333-3333-333333333004';
UPDATE books SET slug = 'harry-potter-va-hon-da-phu-thuy' WHERE id = '33333333-3333-3333-3333-333333333005';
UPDATE books SET slug = 'truyen-kieu' WHERE id = '33333333-3333-3333-3333-333333333006';

UPDATE books
SET slug = 'book-' || REPLACE(CAST(id AS TEXT), '-', '')
WHERE slug IS NULL;

ALTER TABLE books ALTER COLUMN slug SET NOT NULL;
ALTER TABLE books ADD CONSTRAINT books_slug_unique UNIQUE (slug);
