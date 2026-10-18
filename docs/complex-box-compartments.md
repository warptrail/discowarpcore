# Complex boxes and compartments

A complex box is one inventory box with ordered internal compartments. Box `302`
starts with `302A` and `302B`. These addresses do not create additional box records.
The box retains its ID, location, tags, nesting, photo, and canonical item ownership.

- Enabling complex mode creates A and B. Existing items resolve to A.
- A destination without a compartment defaults to A. Reattaching an item already
  in the same box without specifying a compartment preserves its placement.
- The box page displays a connected compartment atlas and an all-compartments view. Selecting a
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

## Cabinets, shelves, and physical boxes

Complex structure has at most **three layers including the owning box**:
box → lettered compartment → numbered shelf. `B2` means cabinet B's second
shelf. A compartment may contain optional `children: [{ key: 'B1', label: 'Top' }]`;
shelf children cannot themselves have children. Letters and shelf numbers remain
stable and append-only, with at most 26 compartments and 99 shelves per compartment.
Only leaf compartments accept items or newly placed physical boxes. Cabinet
browsing includes its shelves and their physical nested-box descendants.

Physical nesting uses `parentBox` independently and is not capped by this limit.
A jewelry box on B2 may contain a jar whose items are inventoried crystals. Each
box owns only its own direct items; descendant views do not change ownership.

The containing box stores `childBoxCompartments` (child Mongo ID → leaf key).
API box reads expose the resolved `parentCompartmentKey` on each child. Keeping
both item and child-box assignments on the parent allows an occupied cabinet's
subdivision to be saved atomically even on standalone MongoDB. Historical child
boxes without a recorded compartment remain unspecified, not silently assigned.

Box creation and parent moves accept `parentCompartmentKey`. Same-parent shelf
moves are allowed. Moving to a regular box or the floor clears the placement.
Shelf destinations use existing `compartmentKey` for items, including create,
attach, moves, bulk moves and Undo. Unspecified item destinations use the first
leaf; unspecified same-box attaches preserve their existing placement.

A box update that subdivides occupied compartments must include
`compartmentReassignments: { items: { '<itemId>': 'B1' }, boxes: { '<childId>': 'B2' } }`
for every affected direct record. All assignments are validated before one parent
update commits definitions and both maps. Raw placement maps are not writable
through generic box updates. The API serializes structure and placement mutations
within its process; direct database writers must not bypass that workflow.
Undo may explicitly restore a legacy unspecified physical placement using
`restoreUnspecifiedPlacement: true`, verified against its latest recorded move;
this cannot be used to create an unspecified new placement.

`/boxes/503B2` normalizes to `/boxes/503?compartment=B2`. JSON exports retain
shelf definitions and both placement maps; direct child exports include their
placement. CSV's existing compartment column retains the complete shelf key.

### Additive development fixtures

`node backend/scripts/seed-complex-box-fixtures.js` previews three fixtures.
Add `--apply` to create them only in local `discowarpcore_dev`. It chooses unused
IDs in 500–599, creates 28 marked mock items, and verifies existing box/item
records have not changed. Repeated runs preserve already tagged fixtures and
user edits. A partially created fixture is preserved for inspection, not reset.
This runner never calls the destructive seed workflow.

## Address-aware browsing and search

Physical `box_id` values remain exactly three digits. Addresses add one cabinet
letter A–Z and an optional shelf number 1–99: `504`, `504B`, `504B2`, `504Z99`.
The shared parser in `shared/boxAddress.mjs` preserves leading zeroes, normalizes
case and a leading `#`, and rejects zero, padded shelf numbers, 100 and deeper
structural addresses. Canonical ID normalization remains separate.

Operations and Retrieval display cabinet view rows after their owning physical
box, ordered A–Z within the selected family sort. Shelves remain in the cabinet's
searchable preview picker. View records carry `kind`, `resultKey`,
`ownerBoxMongoId`, canonical `boxId`, `address` and `compartmentKey`; a view key
must never be used as a mutation ID. Box management remains on the owner page.
Shelf changes have URL/history entries; preview dismissal clears selection with
replace navigation while retaining finder state.

Retrieval accepts `addressScope` on item and box queries, and opt-in
`includeCabinets=true` on box queries. Legacy `boxPrefix` still means a numeric
physical-box prefix. Cabinet expansion, scope/text/facet filtering, family sorting
and row pagination happen before a page is returned. Responses distinguish
`physicalBoxMatches` and `cabinetMatches`. Inventory analytics deduplicate records
and quantities across overlapping owner/cabinet views. Requests without cabinet
opt-in still return physical boxes only. A standalone complete address in `q`
performs a scope lookup. Unknown address scopes return an explicit error.

Scope traverses physical descendants from their recorded storage placement.
Items keep their real owning box and expose a placement trail for context. A
read through `/api/boxes/by-short-id/504B2` returns a scoped tree with the owner's
canonical identity and explicit address metadata. Inventory tooling accepts the
same read addresses and optional search scope/cabinet flags. Bulk text imports
and destination pickers resolve addresses to real leaf storage spaces before
writing, and moves/Undo retain their source shelf keys.

Focused verification: `node --test test/boxAddress.test.js` and
`RUN_COMPLEX_BOX_INTEGRATION=1 node --test test/addressRetrieval.integration.test.js`.
The integration check creates and drops a unique local test database.
