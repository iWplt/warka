-- Milestone A: WhatsApp notifications — log, templates, messaging settings

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  template_ar TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  event_type TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_log_order
  ON notifications_log(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_log_event_status
  ON notifications_log(event_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_log_student
  ON notifications_log(student_id, created_at DESC);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY message_templates_admin ON message_templates
  FOR ALL USING (is_admin());

CREATE POLICY notifications_log_admin_select ON notifications_log
  FOR SELECT USING (is_admin());

-- Default Arabic message templates (admin-editable)
INSERT INTO message_templates (event_type, template_ar) VALUES
  (
    'order_confirmed',
    'مرحباً {{student_name}}، تم تأكيد طلبك رقم {{order_number}} بنجاح بعد دفع العربون. يمكنك متابعة حالة الطلب من هنا: {{order_link}}'
  ),
  (
    'deposit_paid',
    'مرحباً {{student_name}}، تم استلام عربون طلبك رقم {{order_number}} بمبلغ {{deposit_amount}} د.ع. شكراً لثقتك بنا!'
  ),
  (
    'ready_for_pickup',
    'مرحباً {{student_name}}، طلبك رقم {{order_number}} جاهز للاستلام! يرجى مراجعة المطبعة في أقرب وقت. {{order_link}}'
  ),
  (
    'production_photos_uploaded',
    'مرحباً {{student_name}}، تم رفع صور منتجك لطلب رقم {{order_number}}. يمكنك معاينتها قبل الاستلام: {{order_link}}'
  ),
  (
    'payment_reminder',
    'تذكير: طلبك رقم {{order_number}} بانتظار دفع العربون منذ {{days_waiting}} أيام. المبلغ المطلوب: {{deposit_amount}} د.ع. {{order_link}}'
  )
ON CONFLICT (event_type) DO NOTHING;

INSERT INTO platform_settings (key, value) VALUES
  (
    'messaging',
    '{"whatsapp_enabled":true,"deposit_reminder_days":3}'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE message_templates IS 'Admin-editable WhatsApp/SMS message templates per event_type';
COMMENT ON TABLE notifications_log IS 'Outbound notification audit log (WhatsApp, future SMS/email)';
