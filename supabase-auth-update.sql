-- Drop existing anonymous policies on the items table
DROP POLICY IF EXISTS "anon_select_items" ON public.items;
DROP POLICY IF EXISTS "anon_insert_items" ON public.items;
DROP POLICY IF EXISTS "anon_update_items" ON public.items;
DROP POLICY IF EXISTS "anon_delete_items" ON public.items;

-- Create new policies that require a logged-in user
CREATE POLICY "authenticated_select_items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_update_items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
