-- PHYGITAL — 003_storage_setup.sql
-- Private temporary storage bucket with strict ownership and 48-hour expiry enforcement.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ephemeral-media',
  'ephemeral-media',
  FALSE,
  10485760, -- 10 MB per capture
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/ogg', 'audio/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 10485760;

-- Storage objects are keyed as: <parent_uid>/<child_id>/<uuid>.<ext>
CREATE POLICY "Authenticated parents upload to own child prefix"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ephemeral-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated parents read non-expired own media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ephemeral-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.ephemeral_media_vault emv
      WHERE emv.storage_bucket_path = name
        AND NOW() < emv.expires_at
    )
  );

CREATE POLICY "Authenticated parents delete own temporary media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ephemeral-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
