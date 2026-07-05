-- Standardize size codes to S / M / L / XL / XXL (universal abbreviations)

UPDATE size_guide_entries
SET size_code = 'S', label_ar = 'S — صغير', label_en = 'S — Small', sort_order = 1
WHERE product_type = 'cap' AND size_code IN ('small', 'S');

UPDATE size_guide_entries
SET size_code = 'M', label_ar = 'M — متوسط', label_en = 'M — Medium', sort_order = 2
WHERE product_type = 'cap' AND size_code IN ('medium', 'M');

UPDATE size_guide_entries
SET size_code = 'L', label_ar = 'L — كبير', label_en = 'L — Large', sort_order = 3
WHERE product_type = 'cap' AND size_code IN ('large', 'L');

INSERT INTO size_guide_entries (product_type, size_code, label_ar, label_en, sort_order, is_active)
SELECT 'cap', 'XL', 'XL — كبير جداً', 'XL — Extra large', 4, true
WHERE NOT EXISTS (
  SELECT 1 FROM size_guide_entries WHERE product_type = 'cap' AND size_code = 'XL'
);

INSERT INTO size_guide_entries (product_type, size_code, label_ar, label_en, sort_order, is_active)
SELECT 'cap', 'XXL', 'XXL — كبير جداً جداً', 'XXL — Double extra large', 5, true
WHERE NOT EXISTS (
  SELECT 1 FROM size_guide_entries WHERE product_type = 'cap' AND size_code = 'XXL'
);

-- Gown / suit: ensure XXL exists
INSERT INTO size_guide_entries (
  product_type, size_code, label_ar, label_en,
  min_height_cm, max_height_cm, min_weight_kg, max_weight_kg, sort_order, is_active
)
SELECT 'gown', 'XXL', 'XXL', 'XXL', 188, 210, 85, 140, 5, true
WHERE NOT EXISTS (
  SELECT 1 FROM size_guide_entries WHERE product_type = 'gown' AND size_code = 'XXL'
);

INSERT INTO size_guide_entries (
  product_type, size_code, label_ar, label_en,
  min_height_cm, max_height_cm, min_weight_kg, max_weight_kg, sort_order, is_active
)
SELECT 'suit', 'XXL', 'XXL', 'XXL', 188, 210, 85, 140, 5, true
WHERE NOT EXISTS (
  SELECT 1 FROM size_guide_entries WHERE product_type = 'suit' AND size_code = 'XXL'
);

-- Normalize gown/suit labels to show codes prominently
UPDATE size_guide_entries
SET label_ar = size_code, label_en = size_code
WHERE product_type IN ('gown', 'suit') AND size_code IN ('S', 'M', 'L', 'XL', 'XXL');
