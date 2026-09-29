INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products-images',
  'products-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "storage_read_all"     ON storage.objects;
DROP POLICY IF EXISTS "storage_write_admin"  ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_admin" ON storage.objects;

CREATE POLICY "storage_read_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products-images');

CREATE POLICY "storage_write_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products-images'
    AND public.is_admin()
  );

CREATE POLICY "storage_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'products-images' AND public.is_admin());

CREATE POLICY "storage_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products-images'
    AND public.is_admin()
  );
