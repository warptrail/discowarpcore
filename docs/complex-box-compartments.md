# Complex boxes and compartments

A complex box is one inventory box with ordered internal compartments. Box `302`
starts with `302A` and `302B`. These addresses do not create additional box records.
The box retains its ID, location, tags, nesting, photo, and canonical item ownership.

- Enabling complex mode creates A and B. Existing items resolve to A.
- A destination without a compartment defaults to A. Reattaching an item already
  in the same box without specifying a compartment preserves its placement.
- The box page displays stacked drawers and an all-compartments view. Selecting a
  drawer scopes browsing, quick creation, and Items Adrift assignment to it.
- Compartments can be named and appended through Z. Their letters remain stable;
  removal and reordering are not exposed in this first version.
- Turning complex mode off preserves compartment definitions and assignments for
  re-enabling. Items remain owned by the same box throughout.
- Nested boxes are separate from compartments and appear in the all-box view.
- `/boxes/302B` opens `/boxes/302?compartment=B`.

## Data and API

`Box.items` remains the sole list of owned items. `Box.compartments` holds ordered
`{ key, label }` entries. `Box.itemCompartments` maps item Mongo IDs to compartment
letters; an absent assignment means A for complex boxes. It is placement metadata,
not a second ownership list. Removing an item clears its placement override.

Box create/update initializes or validates compartment definitions. Normal item
create, attach, bulk attach, and move APIs accept optional `compartmentKey`.
Moves within one box update placement without detaching the item or duplicating it.
Item context exposes `compartmentKey` and `placementLabel` alongside the canonical
box ID. Retrieval searches the placement label. JSON exports retain the definitions
and item placements; CSV exports include a compartment column.

Existing complex records with no definitions resolve to A/B immediately; their
definitions persist on the next box update. No inventory migration or re-parenting
is needed.
