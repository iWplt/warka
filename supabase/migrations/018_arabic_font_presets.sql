-- Seed famous Arabic calligraphy fonts (Google Fonts — no file upload needed)

INSERT INTO fonts (name_ar, name_en, font_family_css, file_url, category, sort_order, is_active)
VALUES
  ('نقش ثلث', 'Thuluth (Katibeh)', 'Katibeh', 'google://Katibeh', 'calligraphy', 0, true),
  ('ثلث (Mirza)', 'Thuluth (Mirza)', 'Mirza', 'google://Mirza:wght@400;700', 'calligraphy', 1, true),
  ('نسخ', 'Naskh (Amiri)', 'Amiri', 'google://Amiri:ital,wght@0,400;0,700;1,400', 'naskh', 2, true),
  ('نسخ كلاسيكي', 'Naskh (Scheherazade)', 'Scheherazade New', 'google://Scheherazade+New:wght@400;700', 'naskh', 3, true),
  ('نسخ Noto', 'Naskh (Noto)', 'Noto Naskh Arabic', 'google://Noto+Naskh+Arabic:wght@400;700', 'naskh', 4, true),
  ('ديواني', 'Diwani (Rakkas)', 'Rakkas', 'google://Rakkas', 'calligraphy', 5, true),
  ('رقعة', 'Ruqaa', 'Aref Ruqaa', 'google://Aref+Ruqaa', 'ruqaa', 6, true),
  ('رقعة حبر', 'Ruqaa Ink', 'Aref Ruqaa Ink', 'google://Aref+Ruqaa+Ink', 'ruqaa', 7, true),
  ('كوفي', 'Kufi (Reem Kufi)', 'Reem Kufi', 'google://Reem+Kufi:wght@400;700', 'kufi', 8, true),
  ('كوفي هندسي', 'Kufi (Kufam)', 'Kufam', 'google://Kufam:wght@400;700', 'kufi', 9, true),
  ('فارسي / نستعليق', 'Nastaliq (Persian)', 'Noto Nastaliq Urdu', 'google://Noto+Nastaliq+Urdu:wght@400;700', 'nastaliq', 10, true),
  ('خط عرضي', 'Display (Jomhuria)', 'Jomhuria', 'google://Jomhuria', 'display', 11, true),
  ('Lalezar', 'Lalezar display', 'Lalezar', 'google://Lalezar', 'display', 12, true),
  ('Lateef', 'Lateef (handwritten)', 'Lateef', 'google://Lateef:wght@400;700', 'naskh', 13, true)
ON CONFLICT (font_family_css) DO NOTHING;
