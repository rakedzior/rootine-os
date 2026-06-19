-- Enhance documents table with category, note, ref_link
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'inne',
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS ref_link text;
