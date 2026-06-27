# Module Spec â€” Documents

## Goal

Implement document tracking: metadata, categories, lifecycle states and file storage if present.

## Required functionality

- List documents.
- Add document.
- Edit document.
- Delete/archive document.
- Categorize document.
- Add expiration date if UI supports it.
- Add notes if UI supports it.
- Upload file if the UI already has upload flow.
- Open/download file if storage is implemented.

## Graphite Cool Ice v3 rules

- Documents should feel archive-like, clean and trustworthy.
- Use folders, document cards, expiry dates and file type badges.
- Do not make this module playful.
- Use warning for expiring documents.
- Use danger only for missing/expired critical items.
- Use calm graphite surfaces.

## Data needs

Potential tables:

- documents
- document_categories
- document_files

Potential storage:

- Supabase Storage bucket for user documents.

## Security rules

- Do not expose documents across users.
- Use RLS.
- Do not store secrets in client code.

## Acceptance criteria

- User can create a document record.
- User can edit metadata.
- User can archive/delete.
- User can persist and retrieve records.
- File behavior works if present in UI.