-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-photos',
  'client-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-photos bucket
CREATE POLICY "Trainers can upload client photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-photos' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Anyone can view client photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-photos');

CREATE POLICY "Trainers can update their client photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'client-photos' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Trainers can delete their client photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'client-photos' 
    AND auth.uid() IS NOT NULL
  );







