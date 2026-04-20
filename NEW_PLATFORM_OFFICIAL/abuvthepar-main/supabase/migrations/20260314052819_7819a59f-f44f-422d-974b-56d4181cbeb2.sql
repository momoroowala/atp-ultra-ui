INSERT INTO achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award, is_active)
VALUES
  ('first_lead', 'First Lead', 'Created your first brand lead', 'special', 'bronze', '🎯', 15, 'leads_created', '{"count": 1}'::jsonb, true, true),
  ('lead_hunter', 'Lead Hunter', 'Created 50 brand leads', 'special', 'silver', '🏹', 50, 'leads_created', '{"count": 50}'::jsonb, true, true),
  ('lead_machine', 'Lead Machine', 'Created 100 brand leads', 'special', 'gold', '💰', 100, 'leads_created', '{"count": 100}'::jsonb, true, true);