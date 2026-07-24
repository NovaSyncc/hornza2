-- Fix 1: Drop the broad SELECT policy on property-images bucket.
-- Public buckets serve files via direct URL without needing a SELECT policy.
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;

-- Fix 2: Revoke EXECUTE on admin_verify_single_apartment from authenticated.
-- Only service_role (used by admin dashboard via service key) should call this.
REVOKE EXECUTE ON FUNCTION public.admin_verify_single_apartment(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_single_apartment(uuid, text) TO service_role;
