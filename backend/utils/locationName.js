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
    };
  }

  return {
    room: normalizeLocationPart(value?.room),
    vicinity: normalizeLocationPart(value?.vicinity),
    specifics: normalizeLocationPart(value?.specifics),
  };
}

function formatLocationName(value) {
  const { room, vicinity, specifics } = normalizeLocationStructure(value);
  return [room, vicinity, specifics].filter(Boolean).join(' · ');
}

function locationStructureKey(value) {
  const { room, vicinity, specifics } = normalizeLocationStructure(value);
  return [room, vicinity, specifics].map((part) => part.toLowerCase()).join('\u001f');
}

module.exports = {
  normalizeLocationPart,
  normalizeLocationStructure,
  formatLocationName,
  locationStructureKey,
};
