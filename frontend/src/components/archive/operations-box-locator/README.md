# Archived Operations box locator

This folder preserves the former autocomplete-and-inspector locator for reference.
It is intentionally unimported and is not part of the Operations bundle.

Former integration points:

- `InventoryGridHeader` rendered `LegacyBoxLocatorControl` and supplied a flattened match index.
- `BoxList` owned selection, fetch, loading, and error state for `LegacyBoxLocatorInspectorPanel`.
- `LegacyBoxLocator.styles.js` is the archive's compatibility style boundary. It
  re-exports the former `Locator*` definitions so this preserved implementation can
  be restored without importing it into the active Operations component tree.

The active Operations locator is the compact three-digit scope control at
`components/BoxLocatorControl.jsx`.
