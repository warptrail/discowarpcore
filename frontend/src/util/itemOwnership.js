const toTrimmed = (value) => (value == null ? '' : String(value).trim());

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const next = toTrimmed(value);
    if (next) return next;
  }
  return '';
};

function readFallbackBoxId(item) {
  const ids = [
    item?.parentBoxId,
    item?.sourceBoxShortId,
    item?.primaryBoxId,
    item?.box_id,
    Array.isArray(item?.boxIds) ? item.boxIds[0] : null,
  ];
  return firstNonEmpty(...ids);
}

function readFallbackBoxMongoId(item) {
  const ids = [item?.parentBox, item?.sourceBoxId, item?.primaryBox];
  return firstNonEmpty(...ids);
}

export function getItemOwnershipContext(item) {
  const rawBox = item?.box && typeof item.box === 'object' ? item.box : null;
  const hasCanonicalBox = Boolean(
    rawBox && (rawBox._id || rawBox.box_id || rawBox.id || rawBox.label || rawBox.name)
  );

  const fallbackBoxId = readFallbackBoxId(item);
  const fallbackBoxMongoId = readFallbackBoxMongoId(item);
  const fallbackBoxLabel = firstNonEmpty(
    item?.parentBoxLabel,
    item?.sourceBoxLabel,
    item?.primaryBoxLabel
  );

  const boxId = firstNonEmpty(rawBox?.box_id, fallbackBoxId);
  const boxMongoId = firstNonEmpty(rawBox?._id, rawBox?.id, fallbackBoxMongoId);
  const boxLabel = firstNonEmpty(
    rawBox?.label,
    rawBox?.name,
    fallbackBoxLabel,
    boxId ? `Box ${boxId}` : ''
  );
  const boxDescription = firstNonEmpty(rawBox?.description);

  const hasFallbackBoxRef = Boolean(boxId || boxMongoId || fallbackBoxLabel);
  const isBoxed = hasCanonicalBox || hasFallbackBoxRef;
  const inheritedLocation = firstNonEmpty(
    rawBox?.location,
    rawBox?.locationName,
    rawBox?.locationId?.name,
    item?.inheritedLocation
  );

  return {
    isBoxed,
    isOrphaned: !isBoxed,
    parentBoxLabel: boxLabel,
    inheritedLocation,
    hasCanonicalBox,
    box: isBoxed
      ? {
          ...(rawBox || {}),
          _id: boxMongoId || rawBox?._id || rawBox?.id || undefined,
          box_id: boxId || rawBox?.box_id || undefined,
          label: boxLabel || rawBox?.label || rawBox?.name || undefined,
          description: boxDescription || rawBox?.description || undefined,
        }
      : null,
    boxId,
    boxMongoId,
    boxLabel,
    boxDescription,
  };
}
