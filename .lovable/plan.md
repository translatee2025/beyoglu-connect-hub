

# Fix Translation System — Complete Plan

## Part 1: Balance the translations table

**Data operation** using the insert tool:

1. Query all TR keys missing EN equivalents (~339 keys)
2. Query all EN keys missing TR equivalents (check reverse)
3. Insert missing EN translations with proper English values derived from the TR text
4. Insert missing TR translations if any exist only in EN

This will be a large batch INSERT of ~340 rows into `translations`. I'll generate the English values based on the Turkish originals.

## Part 2: Save language preference per user

**Edit `src/providers/LanguageProvider.tsx`**:

- Import `supabase` and `useAuth` — but since LanguageProvider wraps AuthProvider, we can't use `useAuth`. Instead, listen to `supabase.auth.onAuthStateChange` directly inside LanguageProvider.
- On auth state change (sign in): fetch `profiles.language_preference` for the user, and if it exists, call `setLanguageState(preference)` and update localStorage.
- In `setLanguage()`: if a user is logged in, also run `supabase.from('profiles').update({ language_preference: lang }).eq('user_id', user.id)`.
- Priority order on load: logged-in user's DB preference > localStorage > 'tr' default.

## Part 3: Fix hardcoded strings in 8 files

For each file, replace every hardcoded Turkish/English UI string with `t('namespace.key', 'fallback')`. Then insert both TR and EN translation rows.

### Files and approximate string counts:

1. **AdoptionForm.tsx** (~20 strings): "Sahiplendirme İlanı", "Fotoğraflar", "Hayvan Adı", "Tür", "Cins", "Yaş (Yıl)", "Yaş (Ay)", "Cinsiyet", "Erkek", "Dişi", "Boyut", "Mini/Küçük/Orta/Büyük", "Enerji Seviyesi", "Sakin/Orta/Enerjik", toggle labels, "Açıklama", "Mahalle", submit button text, loading text, success/error toasts.

2. **Rentals.tsx** (~15 strings): "Mesaj Gönder", "₺/ay", form labels "Başlık", "İlan Türü", "Bütçe", "Fiyat", "Açıklama", "Fotoğraf / Video", "Mahalle", "Telefon", "Geri", "İleri", "Gönderiliyor...", "Paylaş".

3. **Parking.tsx** (~20 strings): "Otopark İlanları", "Arıyorum", "Ara...", "İlan Ver", "Otopark İlanı Ver", "Liste", "Harita", "Mesaj Gönder", "Müsait", form labels, "Otopark Arıyorum", "Adım", "Başlık", "Otopark Tipi", "Bütçe/Fiyat", "Geri", "İleri", "Paylaş", "Paylaşıldı!", "Hata".

4. **NeighborHelp.tsx** (~5 strings): "Ne yapmak istiyorsun?", time ago strings ("az önce", "dk önce", etc.), price type labels. Most strings already use `t()`.

5. **Classifieds.tsx** (~10 strings): "Ara...", "İlan Ver", "Tümü", "Mesaj", "Şikayet Et", "Henüz ilan yok. İlk ilanı sen ver!", subcategory names (Telefon, Bilgisayar, etc.).

6. **AppSidebar.tsx** (~15 strings): Section labels "DISCOVER", "COMMUNITY", "SERVICES", nav items "Feed", "Venues", "Events", "Reels", "Groups", "Pets", "Families", "Lost & Found", "Rentals", "Parking", "Help", "Classifieds", "Jobs", "Log In".

7. **MobileDrawer.tsx** (~15 strings): Same nav items as sidebar, "Giriş Yap", "Çıkış".

8. **LostFound.tsx** (~25 strings): "Kayıp & Bulundu", "Kayıp Bildir", "Bulundu Bildir", form labels, "Başlık", "Kategori", "Açıklama", "Konum", "Son görülme tarihi", "Tarih seçin", "Telefon", "Fotoğraflar", "Fotoğraf Ekle", "Yükleniyor...", "Gönderiliyor...", "İletişim", "Çözüldü", empty state messages.

### Translation inserts

All new keys will be inserted as both TR and EN rows. Estimated ~120 new translation key pairs (~240 rows total).

## Technical details

- No routing, table structure, or query logic changes
- LanguageProvider will use `supabase.auth.onAuthStateChange` directly (not useAuth) since it wraps AuthProvider
- Navigation labels use `t('nav.feed', 'Feed')` pattern — sections array becomes a function using `t()`
- Time-ago helper strings in Parking/Classifieds/LostFound will use `t()` for "az önce", "sa", "g" etc.

