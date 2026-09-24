CREATE POLICY "flyers_storage_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'flyers');
CREATE POLICY "flyers_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'flyers' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));
CREATE POLICY "flyers_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'flyers' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));
CREATE POLICY "flyers_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'flyers' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));