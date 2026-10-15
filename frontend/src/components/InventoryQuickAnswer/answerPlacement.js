export const LOCATION_TIERS = [
  { key: 'room', label: 'Room' },
  { key: 'vicinity', label: 'Vicinity' },
  { key: 'specifics', label: 'Specifics' },
  { key: 'exactSpot', label: 'Exact spot' },
];

// Keep named slots intact. A flat legacy label cannot reliably identify a tier.
export function getAnswerPlacement(record, registry) {
  const location = record?.locationId && typeof record.locationId === 'object'
    ? record.locationId : registry.get(String(record?.locationId));
  const tiers = Object.fromEntries(LOCATION_TIERS.map(({ key }) => [key, String(location?.[key] ?? '').trim()]));
  const structuredPath = Object.values(tiers).filter(Boolean);
  const legacyLabel = structuredPath.length ? '' : String(record?.location ?? '').trim();
  return { tiers, legacyLabel, path: structuredPath.length ? structuredPath : legacyLabel.split(/\s*·\s*/).filter(Boolean) };
}
