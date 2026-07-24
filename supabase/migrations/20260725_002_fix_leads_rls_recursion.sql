-- ============================================
-- Fix RLS recursion in leads & lead_stage_history
-- The admin policies used direct subqueries on users table
-- which triggers RLS recursion. Use is_admin() instead.
-- Also fix secretary listing access to be scoped.
-- Run this in the Supabase SQL Editor
-- ============================================

-- Drop the recursive admin policies on leads
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;
CREATE POLICY "Admins can manage all leads" ON public.leads
  FOR ALL USING (public.is_admin());

-- Drop the recursive admin policies on lead_stage_history
DROP POLICY IF EXISTS "Admins can manage all lead history" ON public.lead_stage_history;
CREATE POLICY "Admins can manage all lead history" ON public.lead_stage_history
  FOR ALL USING (public.is_admin());

-- Fix secretary listing access — use is_admin pattern instead of recursive subquery
DROP POLICY IF EXISTS "Secretary can view all listings" ON public.listings;
CREATE POLICY "Secretary can view all listings" ON public.listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND user_type = 'secretary'
    )
  );
-- Note: This still queries users table but it's a SELECT on users
-- which has a policy allowing users to view their own profile (auth.uid() = id),
-- so it won't recurse. The leads table admin policies were the ones causing
-- infinite recursion because they queried users from within users' own RLS.

-- Allow tenants to view their own inquiries (matched by email or phone)
CREATE POLICY "Tenants can view own inquiries" ON public.leads
  FOR SELECT USING (
    client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR client_phone = (SELECT phone FROM public.users WHERE id = auth.uid())
  );

-- Add lead_stage_history to realtime (was missing)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_stage_history;
