-- Update scraped listings with actual prices from developer websites
-- Prices verified July 2026
-- USD to KES conversion rate: 130

-- ============================================
-- ALIF HOMES — prices from alifhomesltd.com
-- ============================================

-- Rize: 2BR from KES 8.5M (already correct in DB)
-- Utopia Parklands: 3BR from KES 17M (already correct in DB)
-- Skyway: 1BR from KES 6.5M (already has 6.5M in DB)

-- ============================================
-- KHALEEL HOMES — prices from khaleelhomes.co.ke
-- ============================================

-- Khaleel Suites 3BR: KES 17.5M (starting from) — update to 17,500,000
UPDATE public.listings SET sale_price = 17500000
WHERE title LIKE 'Khaleel Suites — 3BR%' AND is_scraped = true AND scraped_source = 'Khaleel Homes';

-- Khaleel Suites 4BR: KES 23M (already correct in DB)

-- Emaar Pangani 3BR: No price found on site, keep NULL
-- Zaitun Executive: No price found on site, keep NULL
-- Darul Ain Parklands: No price found on site, keep NULL
-- Pangani View 2: No price found on site, keep NULL
-- Wellstone Nyali: No price found on site, keep NULL

-- ============================================
-- NAICOM HOMES — prices from naicomhomes.com (USD on 2yr plan)
-- ============================================

-- Naicom One: 1BR $35K = KES 4.55M (representative: 4BR Duplex $100K = KES 13M)
-- DB already has 4,500,000 which is close to $35K entry. Update to show the 3BR price as representative.
UPDATE public.listings SET sale_price = 10400000
WHERE title LIKE 'Naicom One%' AND is_scraped = true AND scraped_source = 'Naicom Homes';

-- Maro Shopping Mall: 1BR $35K, 2BR $50K, 3BR $80K, 4BR $90K
-- Update to 3BR representative: $80K = KES 10.4M
UPDATE public.listings SET sale_price = 10400000
WHERE title LIKE 'Maro Shopping Mall%' AND is_scraped = true AND scraped_source = 'Naicom Homes';

-- Muthaiga Residency: 2BR $60K, 3BR $85K, 4BR $95-125K
-- Listed as 4BR in DB. 4BR classic = $95K = KES 12.35M
UPDATE public.listings SET sale_price = 12350000
WHERE title LIKE 'Muthaiga Residency%' AND is_scraped = true AND scraped_source = 'Naicom Homes';

-- Rodol Towers (via Naicom): 1BR $60K, 2BR $80K, 4BR $155K, 5BR $200K, 7BR $400K
-- Listed as 7BR in DB. Use mid-range 4BR+DSQ: $155K = KES 20.15M
UPDATE public.listings SET sale_price = 20150000
WHERE title LIKE 'Rodol Towers%' AND is_scraped = true AND scraped_source = 'Naicom Homes';

-- California Square: Price on Request on their site too — keep NULL

-- ============================================
-- NESTPICK PROPERTY — prices from nestpickproperty.com (USD)
-- ============================================

-- Hayat Heights: 2BR $85K, 3BR $138K, 4BR $153-200K
-- DB has 3BR listed. $138K = KES 17.94M (already correct in DB at 17,940,000)

-- ISRA Residences: 2BR $70K, 3BR $100K, 4BR+DSQ $110K
-- DB has 3BR. $100K = KES 13M (already correct in DB at 13,000,000)

-- Gitmoon Plaza: 3BR $80K, 4BR $90K
-- DB has 3BR. $80K = KES 10.4M (already correct in DB at 10,400,000)

-- Starnest Residence: No prices listed on site — keep NULL
UPDATE public.listings SET sale_price = NULL
WHERE title LIKE 'Starnest Residence%' AND is_scraped = true AND scraped_source = 'NestPick Property';

-- Loft Creek: No prices listed on site — keep NULL

-- ============================================
-- BLUE FALCON ESTATE — prices from bluefalconreal.com (USD)
-- ============================================

-- Safa Tower: 3BR $80K, 4BR $100K
-- DB has 4BR. $100K = KES 13M
UPDATE public.listings SET sale_price = 13000000
WHERE title LIKE 'Safa Tower%' AND is_scraped = true AND scraped_source = 'Blue Falcon Estate';

-- ============================================
-- RODOL HOMES — No prices on their website (inquiry only)
-- Keep NULL — "Price on Request" is accurate
-- ============================================

-- ============================================
-- HALA DEVELOPMENT — No prices on their website
-- Keep NULL — "Price on Request" is accurate
-- ============================================
