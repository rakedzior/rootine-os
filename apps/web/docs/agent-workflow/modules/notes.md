# Module Spec — Notes

## Goal

Implement a clean notes module with categories, search and editing.

## Required functionality

- List notes.
- Create note.
- Edit note.
- Delete/archive note.
- Select active note.
- Search notes.
- Filter by category.
- Add/edit categories if UI supports it.
- Tags if UI supports them.
- Large editor/details view if UI supports it.

## UX rules

- Keep the module simple.
- Do not overload the overview.
- Active note should be clearly selected.
- Empty state should encourage creating the first note.

## Graphite Cool Ice v3 rules

- Notes should be quiet and readable.
- Note cards use surface-raised with subtle border.
- Pinned/active notes can use subtle ice border.
- Long-form editor may use slightly lighter content well.
- Do not make note cards colorful.

## Data needs

Potential tables:

- notes
- note_categories
- note_tags
- note_tag_links

## Acceptance criteria

- Notes persist after refresh.
- Search/filter works.
- Editor saves changes.
- Delete/archive works.
- Empty/loading/error states exist.