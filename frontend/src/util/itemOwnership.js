const toTrimmed = (value) => (value == null ? '' : String(value).trim());

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const next = toTrimmed(value);
    if (next) return next;
  }
  return '';
};

function readBreadcrumbLeaf(item) {
  const nodes = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  if (!nodes.length) return null;
  const leaf = nodes[nodes.length - 1];
  return leaf && typeof leaf === 'object' ? leaf : null;
}

function readFallbackBoxId(item) {
  const leaf = readBreadcrumbLeaf(item);
  const parent = item?.parent && typeof item.parent === 'object' ? item.parent : null;
  const ids = [
    item?.parentBoxId,
    item?.sourceBoxShortId,
    item?.primaryBoxId,
    item?.box_id,
    item?.boxId,
    item?.boxShortId,
    leaf?.box_id,
    leaf?.boxId,
    leaf?.shortId,
    parent?.box_id,
    parent?.boxId,
    Array.isArray(item?.boxIds) ? item.boxIds[0] : null,
  ];
  return firstNonEmpty(...ids);
}

function readFallbackBoxMongoId(item) {
  const leaf = readBreadcrumbLeaf(item);
  const parent = item?.parent && typeof item.parent === 'object' ? item.parent : null;
  const ids = [
    item?.parentBox,
    item?.sourceBoxId,
    item?.primaryBox,
    item?.boxMongoId,
    leaf?._id,
    leaf?.id,
    parent?._id,
    parent?.id,
  ];
  return firstNonEmpty(...ids);
}

function readFallbackBoxLabel(item) {
  const leaf = readBreadcrumbLeaf(item);
  const parent = item?.parent && typeof item.parent === 'object' ? item.parent : null;
  return firstNonEmpty(
    item?.parentBoxLabel,
    item?.sourceBoxLabel,
    item?.primaryBoxLabel,
    leaf?.label,
    leaf?.name,
    parent?.label,
    parent?.name,
  );
}

export function getItemOwnershipContext(item) {
  const isGone = String(item?.item_status || '').trim().toLowerCase() === 'gone';
  const rawBox = item?.box && typeof item.box === 'object' ? item.box : null;
  const hasCanonicalBox = Boolean(
    rawBox &&
      (
        rawBox._id ||
        rawBox.box_id ||
        rawBox.boxId ||
        rawBox.shortId ||
        rawBox.id ||
        rawBox.label ||
        rawBox.name
      )
  );

  const fallbackBoxId = readFallbackBoxId(item);
  const fallbackBoxMongoId = readFallbackBoxMongoId(item);
  const fallbackBoxLabel = readFallbackBoxLabel(item);

  const boxId = firstNonEmpty(
    rawBox?.box_id,
    rawBox?.boxId,
    rawBox?.shortId,
    fallbackBoxId,
  );
  const boxMongoId = firstNonEmpty(
    rawBox?._id,
    rawBox?.id,
    rawBox?.boxMongoId,
    fallbackBoxMongoId,
  );
  const boxLabel = firstNonEmpty(
    rawBox?.label,
    rawBox?.name,
    fallbackBoxLabel,
    boxId ? `Box ${boxId}` : ''
  );
  const boxDescription = firstNonEmpty(rawBox?.description);

  const hasFallbackBoxRef = Boolean(boxId || boxMongoId || fallbackBoxLabel);
  const isBoxed = !isGone && (hasCanonicalBox || hasFallbackBoxRef);
  const inheritedLocation = firstNonEmpty(
    rawBox?.location,
    rawBox?.locationName,
    rawBox?.locationId?.name,
    item?.inheritedLocation
  );

  return {
    isGone,
    isBoxed,
    isOrphaned: !isGone && !isBoxed,
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
