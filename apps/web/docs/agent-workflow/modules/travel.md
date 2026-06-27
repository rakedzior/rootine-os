# Module Spec â€” Travel

## Goal

Implement the travel module as a structured trip workspace.

## Required sections

- Trips.
- Plan / itinerary.
- Lodging.
- Transport.
- Packing.
- Documents.
- Budget.
- Notes.

## Required functionality

- Create trip.
- Edit trip.
- Archive/delete trip.
- Trip status:
  - planned
  - ongoing
  - completed
- Add itinerary item.
- Add lodging item.
- Add transport item.
- Add packing item.
- Add travel document metadata.
- Add budget item.
- Add travel note.

## Graphite Cool Ice v3 rules

- Travel should use trip folders.
- Use accent-teal or accent-ice for travel states.
- Avoid over-coloring maps or imagery.
- Trip cards should remain graphite.
- Budget, packing and dates should use small badges/status indicators.

## UX rules

- Do not overload the overview.
- Tabs/buttons must work.
- Keep details contextual.

## Data needs

Potential tables:

- trips
- trip_itinerary_items
- trip_lodging
- trip_transport
- trip_packing_items
- trip_documents
- trip_budget_items
- trip_notes

## Acceptance criteria

- User can create and manage trips.
- Each visible travel tab works.
- Data persists after refresh.
- Empty/loading/error states exist.