-- Create a public storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('audio', 'audio', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to audio files
CREATE POLICY "Public audio files are accessible to everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Allow authenticated or anonymous users to upload audio (for edge function)
CREATE POLICY "Anyone can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio');

-- Allow updates to audio files
CREATE POLICY "Anyone can update audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio');

-- Allow deletion of audio files
CREATE POLICY "Anyone can delete audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio');