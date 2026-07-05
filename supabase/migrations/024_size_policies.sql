-- Per-product size selection policies (one size, fixed list, estimate, custom)
INSERT INTO platform_settings (key, value) VALUES
  ('size_policies', '{
    "sash": {"mode":"one_size","one_size_label_ar":"قياس موحّد","one_size_label_en":"One size","allow_estimate":false,"allow_custom_measurements":false},
    "cap": {"mode":"one_size","one_size_label_ar":"مقاس واحد","one_size_label_en":"One size","allow_estimate":false,"allow_custom_measurements":false},
    "gown": {"mode":"fixed_and_estimate","one_size_label_ar":"—","one_size_label_en":"—","allow_estimate":true,"allow_custom_measurements":true},
    "suit": {"mode":"fixed_and_estimate","one_size_label_ar":"—","one_size_label_en":"—","allow_estimate":true,"allow_custom_measurements":true},
    "custom": {"mode":"fixed_and_custom","one_size_label_ar":"—","one_size_label_en":"—","allow_estimate":false,"allow_custom_measurements":true}
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
