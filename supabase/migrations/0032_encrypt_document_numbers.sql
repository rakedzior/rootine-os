-- Encrypt office document numbers at rest.
-- The symmetric key is generated in a private schema and never exposed to
-- anon/authenticated roles. Owner-checked RPCs decrypt only the caller's rows.

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create table if not exists app_private.encryption_keys (
  name text primary key,
  key bytea not null,
  created_at timestamptz not null default now()
);

revoke all on app_private.encryption_keys from public;
revoke all on app_private.encryption_keys from anon;
revoke all on app_private.encryption_keys from authenticated;

insert into app_private.encryption_keys (name, key)
values ('documents.doc_number', extensions.gen_random_bytes(32))
on conflict (name) do nothing;

alter table public.documents
  add column if not exists doc_number_ciphertext bytea;

create or replace function app_private.document_number_secret()
returns text
language sql
security definer
set search_path = app_private, public
as $$
  select encode(key, 'hex')
  from app_private.encryption_keys
  where name = 'documents.doc_number'
$$;

revoke all on function app_private.document_number_secret() from public;
revoke all on function app_private.document_number_secret() from anon;
revoke all on function app_private.document_number_secret() from authenticated;

create or replace function public.encrypt_document_doc_number()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  secret text;
begin
  if new.doc_number is not null and btrim(new.doc_number) <> '' then
    secret := app_private.document_number_secret();
    new.doc_number_ciphertext := extensions.pgp_sym_encrypt(new.doc_number, secret);
    new.doc_number := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_encrypt_document_doc_number on public.documents;
create trigger trg_encrypt_document_doc_number
before insert or update of doc_number on public.documents
for each row
execute function public.encrypt_document_doc_number();

create or replace function public.get_document_doc_number(document_id uuid)
returns text
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  encrypted bytea;
  owner_id uuid;
  secret text;
begin
  select user_id, doc_number_ciphertext
    into owner_id, encrypted
  from public.documents
  where id = document_id;

  if owner_id is null or owner_id <> auth.uid() then
    raise exception 'document not found';
  end if;

  if encrypted is null then
    return null;
  end if;

  secret := app_private.document_number_secret();
  return extensions.pgp_sym_decrypt(encrypted, secret);
end;
$$;

create or replace function public.set_document_doc_number(document_id uuid, doc_number text)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  owner_id uuid;
  secret text;
begin
  select user_id
    into owner_id
  from public.documents
  where id = document_id;

  if owner_id is null or owner_id <> auth.uid() then
    raise exception 'document not found';
  end if;

  if doc_number is null or btrim(doc_number) = '' then
    update public.documents
       set doc_number = null,
           doc_number_ciphertext = null
     where id = document_id;
    return;
  end if;

  secret := app_private.document_number_secret();
  update public.documents
     set doc_number = null,
         doc_number_ciphertext = extensions.pgp_sym_encrypt(doc_number, secret)
   where id = document_id;
end;
$$;

revoke all on function public.get_document_doc_number(uuid) from public;
revoke all on function public.set_document_doc_number(uuid, text) from public;
grant execute on function public.get_document_doc_number(uuid) to authenticated;
grant execute on function public.set_document_doc_number(uuid, text) to authenticated;

update public.documents
   set doc_number_ciphertext = extensions.pgp_sym_encrypt(doc_number, app_private.document_number_secret()),
       doc_number = null
 where doc_number is not null
   and btrim(doc_number) <> ''
   and doc_number_ciphertext is null;
