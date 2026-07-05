-- Apply WARKA graduation customization preset to ALL active sash/cap/gown products

CREATE OR REPLACE FUNCTION _warka_seed_product_customization(p_product_id UUID, p_type TEXT)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_zone_id UUID;
BEGIN
  IF p_product_id IS NULL THEN RETURN; END IF;

  IF p_type = 'sash' THEN
    INSERT INTO product_styles (product_id, style_key, style_name_ar, style_name_en, sort_order)
    SELECT p_product_id, v.style_key, v.name_ar, v.name_en, v.ord
    FROM (VALUES
      ('american_original', 'الأورجنال الأمريكي — مثلث أمام وخلف', 'American Original — triangle both sides', 1),
      ('triangle_both', 'مثلث من الأمام والخلف', 'Triangle front and back', 2),
      ('triangle_curved', 'مثلث أمام + دائري/مقوس خلف', 'Triangle front + curved back', 3),
      ('custom_image', 'طلب خاص حسب صورة', 'Custom from reference photo', 4)
    ) AS v(style_key, name_ar, name_en, ord)
    ON CONFLICT (product_id, style_key) DO UPDATE SET
      style_name_ar = EXCLUDED.style_name_ar,
      style_name_en = EXCLUDED.style_name_en,
      sort_order = EXCLUDED.sort_order;

    INSERT INTO customization_zones (product_id, style_id, zone_key, zone_label_ar, zone_label_en, content_type, max_chars, is_required, sort_order)
    SELECT p_product_id, NULL, v.zone_key, v.label_ar, v.label_en, v.content_type, v.max_chars, v.required, v.ord
    FROM (VALUES
      ('left_front', 'اليسار — الاختصاص + الاسم (ثنائي/ثلاثي)', 'Left — major + name', 'name_major', 45, true, 1),
      ('right_front', 'اليمين — سنة بالطول أو معلومات الجامعة', 'Right — year or university info', 'university_info', 90, false, 2),
      ('back', 'الخلف — آية/اقتباس (القياس حسب طول النص)', 'Back — verse/quote (auto size)', 'text_library', 150, false, 3)
    ) AS v(zone_key, label_ar, label_en, content_type, max_chars, required, ord)
    WHERE NOT EXISTS (
      SELECT 1 FROM customization_zones cz
      WHERE cz.product_id = p_product_id AND cz.zone_key = v.zone_key AND cz.style_id IS NULL
    );

    UPDATE customization_zones SET
      zone_label_ar = 'اليسار — الاختصاص + الاسم (ثنائي/ثلاثي)',
      zone_label_en = 'Left — major + name',
      content_type = 'name_major',
      max_chars = 45,
      is_required = true,
      sort_order = 1
    WHERE product_id = p_product_id AND zone_key = 'left_front' AND style_id IS NULL;

    UPDATE customization_zones SET
      zone_label_ar = 'اليمين — سنة بالطول أو معلومات الجامعة',
      zone_label_en = 'Right — year or university info',
      content_type = 'university_info',
      max_chars = 90,
      sort_order = 2
    WHERE product_id = p_product_id AND zone_key = 'right_front' AND style_id IS NULL;

    UPDATE customization_zones SET
      zone_label_ar = 'الخلف — آية/اقتباس (القياس حسب طول النص)',
      zone_label_en = 'Back — verse/quote (auto size)',
      content_type = 'text_library',
      max_chars = 150,
      sort_order = 3
    WHERE product_id = p_product_id AND zone_key = 'back' AND style_id IS NULL;

    SELECT id INTO v_zone_id FROM customization_zones
    WHERE product_id = p_product_id AND zone_key = 'right_front' AND style_id IS NULL LIMIT 1;

    IF v_zone_id IS NOT NULL THEN
      INSERT INTO zone_content_options (zone_id, option_key, option_name_ar, option_name_en, option_type, sort_order)
      SELECT v_zone_id, v.opt_key, v.name_ar, v.name_en, v.opt_type, v.ord
      FROM (VALUES
        ('mode_year', 'سنة بالطول', 'Vertical graduation year', 'custom_text', 1),
        ('mode_university', 'قسم/جامعة + لوغو + Class of + سنة', 'Dept/university + logo + Class of + year', 'logo_upload', 2)
      ) AS v(opt_key, name_ar, name_en, opt_type, ord)
      WHERE NOT EXISTS (
        SELECT 1 FROM zone_content_options zco WHERE zco.zone_id = v_zone_id AND zco.option_key = v.opt_key
      );
    END IF;

  ELSIF p_type = 'cap' THEN
    INSERT INTO customization_zones (product_id, style_id, zone_key, zone_label_ar, zone_label_en, content_type, allows_multiple, max_chars, sort_order)
    SELECT p_product_id, NULL, v.zone_key, v.label_ar, v.label_en, v.content_type, v.multi, v.max_chars, v.ord
    FROM (VALUES
      ('side_band', 'الطوق الجانبي — الاسم + نقشة بسيطة', 'Side band — name + small pattern', 'name_major', true, 35, 1),
      ('top', 'الأعلى — آية/اقتباس/لوغو/نقشة', 'Top — verse/quote/logo/pattern', 'text_library', false, 80, 2)
    ) AS v(zone_key, label_ar, label_en, content_type, multi, max_chars, ord)
    WHERE NOT EXISTS (
      SELECT 1 FROM customization_zones cz
      WHERE cz.product_id = p_product_id AND cz.zone_key = v.zone_key AND cz.style_id IS NULL
    );

    UPDATE customization_zones SET
      zone_label_ar = 'الطوق الجانبي — الاسم + نقشة بسيطة',
      allows_multiple = true,
      content_type = 'name_major',
      max_chars = 35,
      sort_order = 1
    WHERE product_id = p_product_id AND zone_key = 'side_band';

    UPDATE customization_zones SET
      zone_label_ar = 'الأعلى — آية/اقتباس/لوغو/نقشة',
      content_type = 'text_library',
      max_chars = 80,
      sort_order = 2
    WHERE product_id = p_product_id AND zone_key = 'top';

    SELECT id INTO v_zone_id FROM customization_zones
    WHERE product_id = p_product_id AND zone_key = 'side_band' LIMIT 1;
    IF v_zone_id IS NOT NULL THEN
      INSERT INTO zone_content_options (zone_id, option_key, option_name_ar, option_name_en, option_type, sort_order)
      SELECT v_zone_id, v.opt_key, v.name_ar, v.name_en, v.opt_type, v.ord
      FROM (VALUES
        ('butterfly', 'نقشة فراشة (مثال: نور + فراشة)', 'Butterfly motif (e.g. Noor + butterfly)', 'preset_pattern', 1),
        ('star', 'نجمة بسيطة', 'Simple star', 'preset_pattern', 2),
        ('floral', 'زخرفة زهرية', 'Floral motif', 'preset_pattern', 3)
      ) AS v(opt_key, name_ar, name_en, opt_type, ord)
      WHERE NOT EXISTS (
        SELECT 1 FROM zone_content_options zco WHERE zco.zone_id = v_zone_id AND zco.option_key = v.opt_key
      );
    END IF;

    SELECT id INTO v_zone_id FROM customization_zones
    WHERE product_id = p_product_id AND zone_key = 'top' LIMIT 1;
    IF v_zone_id IS NOT NULL THEN
      INSERT INTO zone_content_options (zone_id, option_key, option_name_ar, option_name_en, option_type, sort_order)
      SELECT v_zone_id, v.opt_key, v.name_ar, v.name_en, v.opt_type, v.ord
      FROM (VALUES
        ('library_text', 'نص من المكتبة (آية/اقتباس)', 'Library text (verse/quote)', 'preset_text', 1),
        ('upload_logo', 'رفع شعار', 'Upload logo', 'logo_upload', 2),
        ('preset_pattern', 'نقشة جاهزة', 'Preset pattern', 'preset_pattern', 3)
      ) AS v(opt_key, name_ar, name_en, opt_type, ord)
      WHERE NOT EXISTS (
        SELECT 1 FROM zone_content_options zco WHERE zco.zone_id = v_zone_id AND zco.option_key = v.opt_key
      );
    END IF;

  ELSIF p_type = 'gown' THEN
    INSERT INTO product_styles (product_id, style_key, style_name_ar, style_name_en, sort_order, is_batch_locked)
    SELECT p_product_id, v.style_key, v.name_ar, v.name_en, v.ord, v.batch_locked
    FROM (VALUES
      ('plain', 'عادي — بدون كسرات', 'Plain — no pleats', 1, false),
      ('gulf', 'خليجي — كسرات كتف + ردن كلوش', 'Gulf — shoulder pleats + cloche collar', 2, false),
      ('american', 'أمريكي — كسرات صدر وظهر', 'American — chest & back pleats', 3, false),
      ('batch_custom', 'خاص بالدفعة ☝', 'Batch-only style', 4, true)
    ) AS v(style_key, name_ar, name_en, ord, batch_locked)
    ON CONFLICT (product_id, style_key) DO UPDATE SET
      style_name_ar = EXCLUDED.style_name_ar,
      style_name_en = EXCLUDED.style_name_en,
      sort_order = EXCLUDED.sort_order,
      is_batch_locked = EXCLUDED.is_batch_locked;

    INSERT INTO gown_additions (product_id, addition_key, addition_name_ar, addition_name_en, color_source, sort_order)
    SELECT p_product_id, v.addition_key, v.name_ar, v.name_en, v.color_source, v.ord
    FROM (VALUES
      ('yoke_heart', 'فتحة/قلبة بالردن + تطعيم', 'Collar heart opening + trim', 'match_sash_color', 1),
      ('cuff_trim', 'تطعيم بزمة', 'Button placket trim', 'match_sash_color', 2),
      ('satin_trim', 'تطعيم ستان (لون قابل للتغيير)', 'Satin trim (selectable color)', 'selectable', 3),
      ('extra_embroidery', 'تطريز/خط إضافي', 'Extra embroidery line', 'match_sash_color', 4),
      ('small_icon', 'نقشة/رسمة صغيرة/حرف', 'Small icon/letter art', 'selectable', 5),
      ('shape_frame', 'إطار حسب الشكل المطلوب', 'Frame per selected style', 'selectable', 6)
    ) AS v(addition_key, name_ar, name_en, color_source, ord)
    ON CONFLICT (product_id, addition_key) DO UPDATE SET
      addition_name_ar = EXCLUDED.addition_name_ar,
      addition_name_en = EXCLUDED.addition_name_en,
      color_source = EXCLUDED.color_source,
      sort_order = EXCLUDED.sort_order;
  END IF;

  INSERT INTO zone_color_options (zone_id, color_source, sort_order)
  SELECT cz.id, 'match_sash_color', 0
  FROM customization_zones cz
  WHERE cz.product_id = p_product_id
    AND cz.zone_key IN ('left_front', 'right_front', 'back', 'side_band', 'top')
    AND NOT EXISTS (
      SELECT 1 FROM zone_color_options zco
      WHERE zco.zone_id = cz.id AND zco.color_source = 'match_sash_color'
    );

  INSERT INTO embroidery_size_rules (zone_id, min_chars, max_chars, embroidery_size_mm, sort_order)
  SELECT cz.id, r.min_c, r.max_c, r.size_mm, r.ord
  FROM customization_zones cz
  CROSS JOIN (VALUES
    (1, 15, 25.0, 1),
    (16, 40, 40.0, 2),
    (41, 80, 55.0, 3),
    (81, 200, 75.0, 4)
  ) AS r(min_c, max_c, size_mm, ord)
  WHERE cz.product_id = p_product_id
    AND cz.content_type IN ('text_library', 'name_major', 'university_info')
    AND NOT EXISTS (SELECT 1 FROM embroidery_size_rules esr WHERE esr.zone_id = cz.id);
END;
$$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, product_type::text AS pt FROM products
    WHERE active = true AND product_type IN ('sash', 'cap', 'gown')
  LOOP
    PERFORM _warka_seed_product_customization(r.id, r.pt);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS _warka_seed_product_customization(UUID, TEXT);
