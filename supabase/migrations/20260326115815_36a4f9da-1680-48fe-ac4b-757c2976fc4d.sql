-- Temporarily drop FK to insert sample lost pets
ALTER TABLE public.pet_profiles DROP CONSTRAINT IF EXISTS pet_profiles_owner_id_fkey;

INSERT INTO public.pet_profiles (owner_id, name, species, breed, age_years, gender, photo_url, is_lost, lost_location, lost_details, lost_at, neighborhood, latitude, longitude, personality_tags) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'Maviş', 'bird', 'Budgerigar', 2, 'female', 'https://images.unsplash.com/photo-1591198936750-16d8e15edb9e?w=600', true, 'Cihangir', 'Flew out of the window this morning around 10am. Blue and white feathers, very tame, will come to your hand if you offer sunflower seeds. Please check your balconies!', NOW() - INTERVAL '3 hours', 'Cihangir', 41.0322, 28.9830, '{playful,curious}'),
('a1b2c3d4-0000-0000-0000-000000000002', 'Paşa', 'cat', 'Turkish Angora', 5, 'male', 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=600', true, 'Galata', 'Pure white with one blue and one green eye. Missing since yesterday evening. Usually hangs around the fish market. Has a microchip. Wearing a blue collar with bells.', NOW() - INTERVAL '18 hours', 'Galata', 41.0260, 28.9750, '{independent,calm}'),
('a1b2c3d4-0000-0000-0000-000000000003', 'Brownie', 'dog', 'Mixed Breed', 3, 'male', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600', true, 'Taksim', 'Medium brown dog, very friendly. Slipped his leash near Taksim Square during the evening walk. Responds to his name. Has a red harness on. Neutered, chipped.', NOW() - INTERVAL '5 hours', 'Taksim', 41.0375, 28.9845, '{friendly,energetic}');

-- Re-add FK as NOT VALID
ALTER TABLE public.pet_profiles ADD CONSTRAINT pet_profiles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) NOT VALID;