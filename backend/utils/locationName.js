function normalizeLocationPart(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeLocationStructure(value = {}) {
  if (typeof value === 'string') {
    return {
      room: normalizeLocationPart(value),
      vicinity: '',
      specifics: '',
      exactSpot: '',
    };
  }

  return {
    room: normalizeLocationPart(value?.room),
    vicinity: normalizeLocationPart(value?.vicinity),
    specifics: normalizeLocationPart(value?.specifics),
    exactSpot: normalizeLocationPart(value?.exactSpot),
  };
}

function formatLocationName(value) {
  const { room, vicinity, specifics, exactSpot } = normalizeLocationStructure(value);
  return [room, vicinity, specifics, exactSpot].filter(Boolean).join(' · ');
}

function locationStructureKey(value) {
  const { room, vicinity, specifics, exactSpot } = normalizeLocationStructure(value);
  return [room, vicinity, specifics, exactSpot].map((part) => part.toLowerCase()).join('\u001f');
}

module.exports = {
  normalizeLocationPart,
  normalizeLocationStructure,
  formatLocationName,
  locationStructureKey,
};
