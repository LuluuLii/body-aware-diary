-- ============================================================
-- 013 · entry-media Storage bucket
-- 私有 bucket 存用户 v2 记录附件（照片、语音、手写笔记扫描）。
--
-- 路径约定: entry-media/{user_id}/{entry_id}/{filename}
-- 客户端上传时按此结构组织；RLS 依赖首层目录 = auth.uid()。
--
-- 大小/类型限制:
--   - 单文件最大 10 MB
--   - 允许: image/jpeg,png,webp,gif + audio/mpeg,mp4,wav,webm
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entry-media',
  'entry-media',
  FALSE,       -- 私有 bucket，需签名 URL 访问
  10485760,    -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS: 用户只能操作自己的媒体文件 ────────

-- INSERT: 只允许上传到 {my_user_id}/... 路径
CREATE POLICY "Users can upload own entry media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'entry-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: 只能读自己上传的
CREATE POLICY "Users can view own entry media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'entry-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: 只能改自己上传的（metadata）
CREATE POLICY "Users can update own entry media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'entry-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: 只能删自己上传的
CREATE POLICY "Users can delete own entry media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'entry-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
