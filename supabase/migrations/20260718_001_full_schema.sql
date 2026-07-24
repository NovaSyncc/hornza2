-- ============================================
-- HORNZA: Full Database Schema
-- Existing tables + Expansion (listings)
-- ============================================

-- ============================================
-- EXISTING TABLES (from the CRA MVP)
-- ============================================

-- Users table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'tenant',
  company_name TEXT,
  bio TEXT,
  is_broker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  location TEXT DEFAULT 'Eastleigh',
  contact_phone TEXT,
  manager_whatsapp TEXT,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apartments table
CREATE TABLE IF NOT EXISTS public.apartments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  house_number TEXT,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  rent_amount NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  square_feet INTEGER,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  availability_status TEXT DEFAULT 'available',
  verification_status TEXT DEFAULT 'unverified',
  instagram_url TEXT,
  verified_at TIMESTAMPTZ,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- NEW: Unified listings table (Phase 1)
-- ============================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Service type: rental | furnished | sale
  service_type TEXT NOT NULL DEFAULT 'rental',

  -- Who listed it
  lister_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lister_type TEXT DEFAULT 'landlord', -- landlord | broker | furnished_operator | admin

  -- Optional FK to legacy tables (for migrated data)
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE SET NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,

  -- Common property info
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT,
  property_type TEXT DEFAULT 'apartment', -- apartment | bedsitter | house | studio | land | commercial
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  square_feet INTEGER,
  features TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',

  -- Rental pricing
  rent_amount NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),

  -- Furnished pricing
  daily_rate NUMERIC(10,2),
  weekly_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2),
  minimum_stay_days INTEGER DEFAULT 1,
  max_guests INTEGER,

  -- Sale pricing
  sale_price NUMERIC(12,2),

  -- Broker fields
  broker_fee_percentage NUMERIC(5,2),
  owner_name TEXT,
  owner_phone TEXT,

  -- Verification (same workflow as existing)
  verification_status TEXT DEFAULT 'unverified',
  instagram_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,

  -- Scraped properties (Phase 4)
  is_scraped BOOLEAN DEFAULT FALSE,
  scraped_source TEXT,
  scraped_url TEXT,

  -- Contact override
  contact_phone TEXT,
  contact_whatsapp TEXT
);

-- Extend verification_requests to support listings
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_buildings_manager ON public.buildings(manager_id);
CREATE INDEX IF NOT EXISTS idx_apartments_building ON public.apartments(building_id);
CREATE INDEX IF NOT EXISTS idx_apartments_verification ON public.apartments(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_listings_service_type ON public.listings(service_type);
CREATE INDEX IF NOT EXISTS idx_listings_lister ON public.listings(lister_id);
CREATE INDEX IF NOT EXISTS idx_listings_verification ON public.listings(verification_status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_available ON public.listings(is_available);
CREATE INDEX IF NOT EXISTS idx_listings_composite ON public.listings(service_type, verification_status, is_available);

-- ============================================
-- UPDATED_AT TRIGGER FOR LISTINGS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ADMIN VERIFY APARTMENT RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_verify_single_apartment(
  p_apartment_id UUID,
  p_instagram_url TEXT
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE public.apartments
  SET
    verification_status = 'verified',
    instagram_url = p_instagram_url,
    verified_at = NOW()
  WHERE id = p_apartment_id;

  IF FOUND THEN
    -- Also update the verification request
    UPDATE public.verification_requests
    SET status = 'verified', processed_at = NOW()
    WHERE apartment_id = p_apartment_id AND status = 'pending';

    v_result := json_build_object('success', true, 'error_message', null);
  ELSE
    v_result := json_build_object('success', false, 'error_message', 'Apartment not found');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Auth trigger can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- BUILDINGS policies
CREATE POLICY "Public can view buildings" ON public.buildings
  FOR SELECT USING (true);

CREATE POLICY "Managers can insert own buildings" ON public.buildings
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update own buildings" ON public.buildings
  FOR UPDATE USING (auth.uid() = manager_id);

CREATE POLICY "Managers can delete own buildings" ON public.buildings
  FOR DELETE USING (auth.uid() = manager_id);

CREATE POLICY "Admins can manage all buildings" ON public.buildings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- APARTMENTS policies
CREATE POLICY "Public can view verified apartments" ON public.apartments
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Managers can view own apartments" ON public.apartments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.buildings
      WHERE buildings.id = apartments.building_id
      AND buildings.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert apartments" ON public.apartments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buildings
      WHERE buildings.id = building_id
      AND buildings.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update own apartments" ON public.apartments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.buildings
      WHERE buildings.id = apartments.building_id
      AND buildings.manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all apartments" ON public.apartments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- VERIFICATION_REQUESTS policies
CREATE POLICY "Managers can view own requests" ON public.verification_requests
  FOR SELECT USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert requests" ON public.verification_requests
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Admins can manage all requests" ON public.verification_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- LISTINGS policies
CREATE POLICY "Public can view verified listings" ON public.listings
  FOR SELECT USING (verification_status = 'verified' AND is_available = true);

CREATE POLICY "Listers can view own listings" ON public.listings
  FOR SELECT USING (auth.uid() = lister_id);

CREATE POLICY "Listers can insert own listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = lister_id);

CREATE POLICY "Listers can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = lister_id);

CREATE POLICY "Listers can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = lister_id);

CREATE POLICY "Admins can manage all listings" ON public.listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.buildings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.apartments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- Storage policy: public read
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Storage policy: owners can delete their uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);