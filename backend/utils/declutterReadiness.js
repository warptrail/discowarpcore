const DECLUTTER_READINESS_VALUES = Object.freeze([
  'not_considered',
  'in_deck',
  'kept',
  'ready_to_declutter',
]);

function normalizeDeclutterReadiness(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return DECLUTTER_READINESS_VALUES.includes(normalized)
    ? normalized
    : 'not_considered';
}

module.exports = {
  DECLUTTER_READINESS_VALUES,
  normalizeDeclutterReadiness,
};
