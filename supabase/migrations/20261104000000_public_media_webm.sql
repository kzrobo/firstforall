-- Allow WebM (VP9) video in the public-media bucket, next to the existing MP4.
-- The homepage hero offers WebM first and MP4 as the fallback.
-- Non-destructive: only appends one MIME type; existing types and objects are untouched. Safe to re-run.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'video/webm')
where id = 'public-media'
  and allowed_mime_types is not null
  and not ('video/webm' = any (allowed_mime_types));
