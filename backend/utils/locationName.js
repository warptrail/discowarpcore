function normalizeLocationName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function locationCompareKey(value) {
  return normalizeLocationName(value).toLowerCase();
}

module.exports = {
  normalizeLocationName,
  locationCompareKey,
};
