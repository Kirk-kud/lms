-- Module PDFs are uploaded by the API service role and served through public URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('modules', 'modules', true, 26214400, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

