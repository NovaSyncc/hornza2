-- ============================================
-- Secretary Dashboard: Leads Pipeline + Stage History
-- Run this in the Supabase SQL Editor
-- ============================================

-- Leads table for secretary pipeline tracking
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Client info
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_whatsapp TEXT,
  client_email TEXT,
  notes TEXT,

  -- Linked listing
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,

  -- Pipeline stage: inquiry → site_visit → negotiation → closed_won / closed_lost
  stage TEXT NOT NULL DEFAULT 'inquiry',

  -- Commission (sale_price * 0.05)
  commission_amount NUMERIC(12,2),

  -- Secretary who owns this lead
  secretary_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Stage transition timestamps
  inquiry_at TIMESTAMPTZ DEFAULT NOW(),
  site_visit_at TIMESTAMPTZ,
  negotiation_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Stage history audit trail
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_secretary ON public.leads(secretary_id);
CREATE INDEX IF NOT EXISTS idx_leads_listing ON public.leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON public.lead_stage_history(lead_id);

-- Reuse existing updated_at trigger function
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

-- Secretary can manage own leads
CREATE POLICY "Secretary can view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = secretary_id);
CREATE POLICY "Secretary can insert leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = secretary_id);
CREATE POLICY "Secretary can update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = secretary_id);
CREATE POLICY "Secretary can delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = secretary_id);

-- Admin can manage all leads
CREATE POLICY "Admins can manage all leads" ON public.leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Secretary can view/insert stage history for own leads
CREATE POLICY "Secretary can view own lead history" ON public.lead_stage_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_id AND leads.secretary_id = auth.uid())
  );
CREATE POLICY "Secretary can insert lead history" ON public.lead_stage_history
  FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Admin can manage all history
CREATE POLICY "Admins can manage all lead history" ON public.lead_stage_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Secretary needs read access to all listings
CREATE POLICY "Secretary can view all listings" ON public.listings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'secretary')
  );

-- ============================================
-- Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- ============================================
-- Storage bucket for generated PDFs
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('secretary-pdfs', 'secretary-pdfs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Secretary can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'secretary-pdfs'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Public can view secretary PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'secretary-pdfs');

CREATE POLICY "Secretary can delete own PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'secretary-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
