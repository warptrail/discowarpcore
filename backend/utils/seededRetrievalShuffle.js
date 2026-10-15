const { createHash } = require('node:crypto');

// Rank the complete result set before pagination. A seed fixes the order across
// requests; no database writes, process-local cache or page-by-page randomness.
function seededRetrievalShuffle(records, seed = '') {
  const boundedSeed = String(seed || 'retrieval').slice(0, 96);
  return (Array.isArray(records) ? records : []).map((record) => {
    const id = String(record.id || record._id || record.boxId || '');
    const rank = createHash('sha256').update(`${boundedSeed}\0${id}`).digest('hex');
    return { record, id, rank };
  }).sort((a, b) => a.rank.localeCompare(b.rank) || a.id.localeCompare(b.id))
    .map(({ record }) => record);
}

module.exports = { seededRetrievalShuffle };
