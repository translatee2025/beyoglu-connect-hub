-- Adds "Shopping & Services" and "Culture & Leisure" venue-type groups and the
-- Beyoğlu-relevant types under them (tekel, bakkal/büfe, supermarket, manav,
-- kasap, bank, barber, bookstore, electronics, optician, florist, laundry,
-- hardware, gift shop, gym, cinema, theatre, library). Idempotent.

INSERT INTO public.venue_type_groups (name, icon, color_accent, sort_order)
SELECT v.* FROM (VALUES
  ('Shopping & Services', '🛍️', '#F59E0B', 4),
  ('Culture & Leisure',   '🎭', '#8B5CF6', 5)
) v(name, icon, color_accent, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.venue_type_groups g WHERE g.name = v.name);

INSERT INTO public.venue_types (group_id, name, icon, sort_order, default_attributes)
SELECT g.id, v.name, v.icon, v.sort_order, '{}'::jsonb
FROM (VALUES
  ('Shopping & Services', 'Supermarket',           '🛒', 1),
  ('Shopping & Services', 'Bakkal & Büfe',         '🏪', 2),
  ('Shopping & Services', 'Tekel Shop',            '🍷', 3),
  ('Shopping & Services', 'Greengrocer (Manav)',   '🥬', 4),
  ('Shopping & Services', 'Butcher (Kasap)',       '🥩', 5),
  ('Shopping & Services', 'Bank & ATM',            '🏦', 6),
  ('Shopping & Services', 'Hairdresser & Barber',  '💈', 7),
  ('Shopping & Services', 'Bookstore',             '📚', 8),
  ('Shopping & Services', 'Electronics',           '📱', 9),
  ('Shopping & Services', 'Jeweler',               '💍', 10),
  ('Shopping & Services', 'Optician',              '👓', 11),
  ('Shopping & Services', 'Florist',               '💐', 12),
  ('Shopping & Services', 'Laundry',               '🧺', 13),
  ('Shopping & Services', 'Hardware Store',        '🔧', 14),
  ('Shopping & Services', 'Gift Shop',             '🎁', 15),
  ('Culture & Leisure',   'Gym & Fitness',         '🏋️', 1),
  ('Culture & Leisure',   'Cinema',                '🎬', 2),
  ('Culture & Leisure',   'Theatre',               '🎭', 3),
  ('Culture & Leisure',   'Library',               '📖', 4)
) v(grp, name, icon, sort_order)
JOIN public.venue_type_groups g ON g.name = v.grp
WHERE NOT EXISTS (SELECT 1 FROM public.venue_types t WHERE t.name = v.name);
