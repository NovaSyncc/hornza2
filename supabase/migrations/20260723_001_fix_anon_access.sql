-- Fix: Admin policies should only apply to authenticated role, not anon.
-- anon users only need the public SELECT policies.

-- Grant is_admin to anon as well (it will just return false for anon, no harm)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO public;
