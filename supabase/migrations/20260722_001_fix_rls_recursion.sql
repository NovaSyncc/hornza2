-- Fix infinite recursion in users table RLS policy.
-- "Admins can view all users" queries the users table from within the users table policy = infinite loop.
-- Fix: use auth.uid() check combined with a non-recursive approach.

-- Drop the recursive admin policy on users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Replace with a policy that doesn't self-reference.
-- Admins can view all users by checking user_type via a security definer function.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$;

-- Revoke direct execution from anon (trigger/internal only)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Recreate admin policies using the function (bypasses RLS via SECURITY DEFINER)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Also fix admin policies on other tables that reference users table
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;
CREATE POLICY "Admins can manage all listings" ON public.listings
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all apartments" ON public.apartments;
CREATE POLICY "Admins can manage all apartments" ON public.apartments
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all buildings" ON public.buildings;
CREATE POLICY "Admins can manage all buildings" ON public.buildings
  FOR ALL USING (public.is_admin());
