-- ============================================================
-- Sync profiles.role → auth.users.raw_user_meta_data
-- Fixes: JWT lacks 'role' for users created via dashboard,
-- causing all RLS policies that check user_metadata.role to fail.
-- ============================================================

-- 1. Backfill existing users: copy role + full_name from profiles into raw_user_meta_data
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
       'role',      p.role,
       'full_name', COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', '')
     )
FROM public.profiles p
WHERE p.id = u.id
  AND p.role IS NOT NULL;

-- 2. Function: called by trigger whenever profiles.role or full_name changes
CREATE OR REPLACE FUNCTION sync_profile_to_user_metadata()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
         'role',      NEW.role,
         'full_name', COALESCE(NEW.full_name, '')
       )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 3. Trigger: fires on role or full_name update in profiles
DROP TRIGGER IF EXISTS on_profile_role_updated ON public.profiles;
CREATE TRIGGER on_profile_role_updated
  AFTER INSERT OR UPDATE OF role, full_name ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_to_user_metadata();
