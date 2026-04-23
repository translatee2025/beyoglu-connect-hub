-- Backfill legacy category values to canonical value_keys
-- Classifieds: 'Electronics' -> 'electronics' (case-only legacy)
UPDATE public.classifieds SET category = 'electronics' WHERE category = 'Electronics';

-- Neighbor help: legacy short keys -> canonical option keys
UPDATE public.neighbor_help_posts SET category = 'computer' WHERE category IN ('tech');
UPDATE public.neighbor_help_posts SET category = 'cleaning' WHERE category IN ('errands');
UPDATE public.neighbor_help_posts SET category = 'babysitting' WHERE category IN ('childcare');
UPDATE public.neighbor_help_posts SET category = 'other' WHERE category IN ('cooking');
UPDATE public.neighbor_help_posts SET category = 'other' WHERE category IN ('repair');
UPDATE public.neighbor_help_posts SET category = 'other' WHERE category IN ('pet_care');

-- Add 'art' and 'tutoring' / 'pet_care' missing classifieds rows that landed in pet stuff: keep classifieds 'art' as 'other'
UPDATE public.classifieds SET category = 'other' WHERE category IN ('art');

-- Rentals: legacy 'Stüdyo' -> 'studio'
UPDATE public.classifieds SET category = 'studio' WHERE category = 'Stüdyo';
