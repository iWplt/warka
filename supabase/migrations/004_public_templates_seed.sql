-- Allow visitors to browse active design templates on the public website
CREATE POLICY templates_public_read ON design_templates
  FOR SELECT TO anon
  USING (active = true);

-- Demo sash templates (safe to delete later from admin → Templates)
INSERT INTO design_templates (id, product_type, name, template_config, active)
VALUES
  (
    'a1000001-0000-4000-8000-000000000001',
    'sash',
    'classicGold',
    '{"width":400,"height":600,"backgroundColor":"#0f172a","textSlots":[{"id":"name","x":200,"y":270,"fontSize":26,"fontFamily":"Cairo","color":"#F59E0B","maxWidth":320,"align":"center","field":"full_name"},{"id":"department","x":200,"y":318,"fontSize":16,"fontFamily":"Cairo","color":"#FFFFFF","maxWidth":300,"align":"center","field":"department"},{"id":"year","x":200,"y":352,"fontSize":14,"fontFamily":"Cairo","color":"#CBD5E1","maxWidth":200,"align":"center","field":"graduation_year"},{"id":"custom","x":200,"y":390,"fontSize":12,"fontFamily":"Cairo","color":"#E5E7EB","maxWidth":280,"align":"center","field":"custom_text"}],"logoSlot":{"x":165,"y":88,"width":70,"height":70}}'::jsonb,
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'sash',
    'royalBlue',
    '{"width":400,"height":600,"backgroundColor":"#1e3a5f","textSlots":[{"id":"name","x":200,"y":270,"fontSize":26,"fontFamily":"Cairo","color":"#FDE68A","maxWidth":320,"align":"center","field":"full_name"},{"id":"department","x":200,"y":318,"fontSize":16,"fontFamily":"Cairo","color":"#FFFFFF","maxWidth":300,"align":"center","field":"department"},{"id":"year","x":200,"y":352,"fontSize":14,"fontFamily":"Cairo","color":"#93C5FD","maxWidth":200,"align":"center","field":"graduation_year"},{"id":"custom","x":200,"y":390,"fontSize":12,"fontFamily":"Cairo","color":"#E5E7EB","maxWidth":280,"align":"center","field":"custom_text"}],"logoSlot":{"x":165,"y":88,"width":70,"height":70}}'::jsonb,
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'sash',
    'elegantBurgundy',
    '{"width":400,"height":600,"backgroundColor":"#3f1414","textSlots":[{"id":"name","x":200,"y":270,"fontSize":26,"fontFamily":"Cairo","color":"#FCD34D","maxWidth":320,"align":"center","field":"full_name"},{"id":"department","x":200,"y":318,"fontSize":16,"fontFamily":"Cairo","color":"#FFFFFF","maxWidth":300,"align":"center","field":"department"},{"id":"year","x":200,"y":352,"fontSize":14,"fontFamily":"Cairo","color":"#FCA5A5","maxWidth":200,"align":"center","field":"graduation_year"},{"id":"custom","x":200,"y":390,"fontSize":12,"fontFamily":"Cairo","color":"#FEE2E2","maxWidth":280,"align":"center","field":"custom_text"}],"logoSlot":{"x":165,"y":88,"width":70,"height":70}}'::jsonb,
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000004',
    'sash',
    'modernEmerald',
    '{"width":400,"height":600,"backgroundColor":"#064e3b","textSlots":[{"id":"name","x":200,"y":270,"fontSize":26,"fontFamily":"Cairo","color":"#FFFFFF","maxWidth":320,"align":"center","field":"full_name"},{"id":"department","x":200,"y":318,"fontSize":16,"fontFamily":"Cairo","color":"#FFFFFF","maxWidth":300,"align":"center","field":"department"},{"id":"year","x":200,"y":352,"fontSize":14,"fontFamily":"Cairo","color":"#A7F3D0","maxWidth":200,"align":"center","field":"graduation_year"},{"id":"custom","x":200,"y":390,"fontSize":12,"fontFamily":"Cairo","color":"#D1FAE5","maxWidth":280,"align":"center","field":"custom_text"}],"logoSlot":{"x":165,"y":88,"width":70,"height":70}}'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;
