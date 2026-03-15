export function getItemOwnershipContext(item) {
  const box = item?.box ?? null;

  const hasBoxRef = Boolean(
    box && (box._id || box.box_id || box.id || box.label)
  );
  const hasParentRef = Boolean(
    item?.parentBox ||
      item?.parentBoxId ||
      item?.parentBoxLabel ||
      item?.sourceBoxId ||
      item?.sourceBoxShortId
  );

  const isBoxed = hasBoxRef || hasParentRef;
  const parentBoxLabel =
    box?.label ||
    item?.parentBoxLabel ||
    (item?.parentBoxId ? `Box ${item.parentBoxId}` : '');

  const inheritedLocation =
    box?.location ||
    box?.locationName ||
    box?.locationId?.name ||
    item?.inheritedLocation ||
    '';

  return {
    isBoxed,
    isOrphaned: !isBoxed,
    parentBoxLabel,
    inheritedLocation,
  };
}
