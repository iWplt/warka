-- Refresh Arabic font display names (Diwan-style labels)

UPDATE fonts SET name_ar = 'ديوان ثلث', name_en = 'Diwan Thuluth', category = 'thuluth'
WHERE font_family_css = 'Katibeh';

UPDATE fonts SET name_ar = 'ديوان نسخ', name_en = 'Diwan Naskh', category = 'naskh'
WHERE font_family_css = 'Amiri';

UPDATE fonts SET name_ar = 'مصحفي الذهبي', name_en = 'Mushaf Gold', category = 'naskh'
WHERE font_family_css = 'Scheherazade New';

UPDATE fonts SET name_ar = 'مصحفي الفضي', name_en = 'Mushaf Silver', category = 'naskh'
WHERE font_family_css = 'Noto Naskh Arabic';

UPDATE fonts SET name_ar = 'ديوان فارسي', name_en = 'Diwan Persian', category = 'nastaliq'
WHERE font_family_css = 'Noto Nastaliq Urdu';

UPDATE fonts SET name_ar = 'ديواني', name_en = 'Diwani', category = 'diwani'
WHERE font_family_css = 'Rakkas';

UPDATE fonts SET name_ar = 'كوفي', name_en = 'Kufi', category = 'kufi'
WHERE font_family_css = 'Reem Kufi';

UPDATE fonts SET name_ar = 'كوفي قياسي', name_en = 'Standard Kufi', category = 'kufi'
WHERE font_family_css = 'Kufam';

UPDATE fonts SET name_ar = 'بيروت', name_en = 'Beirut', category = 'ruqaa'
WHERE font_family_css = 'Aref Ruqaa';

UPDATE fonts SET name_ar = 'رقعة حبر', name_en = 'Ruqaa Ink', category = 'ruqaa'
WHERE font_family_css = 'Aref Ruqaa Ink';

UPDATE fonts SET name_ar = 'دمشق', name_en = 'Damascus', category = 'calligraphy'
WHERE font_family_css = 'Mirza';

UPDATE fonts SET name_ar = 'دمشق عريض', name_en = 'Damascus Bold', category = 'calligraphy'
WHERE font_family_css = 'Jomhuria';

UPDATE fonts SET name_ar = 'بغداد', name_en = 'Baghdad', category = 'display'
WHERE font_family_css = 'Lalezar';

INSERT INTO fonts (name_ar, name_en, font_family_css, file_url, category, sort_order, is_active)
VALUES
  ('وسيم', 'Waseem', 'Markazi Text', 'google://Markazi+Text:wght@400;700', 'display', 20, true),
  ('وسيم رفيع', 'Waseem Thin', 'Lateef', 'google://Lateef:wght@400;700', 'display', 21, true),
  ('بسمة', 'Basma', 'Harmattan', 'google://Harmattan:wght@400;700', 'naskh', 22, true),
  ('صنعاء', 'Sanaa', 'El Messiri', 'google://El+Messiri:wght@400;700', 'display', 23, true),
  ('عرب تايمز', 'Arab Times', 'Noto Sans Arabic', 'google://Noto+Sans+Arabic:wght@400;700', 'naskh', 24, true),
  ('الجزائر', 'Algeria', 'Cairo', 'google://Cairo:wght@400;700', 'display', 25, true),
  ('فرح', 'Farah', 'Tajawal', 'google://Tajawal:wght@400;700', 'display', 26, true)
ON CONFLICT (font_family_css) DO NOTHING;
