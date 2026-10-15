// Normalize presentation at the JSON boundary, including legacy lean records.
// This leaves stored records, tag ordering and non-tag fields unchanged.
function lowercaseTag(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function tagsJsonReplacer(key, value) {
  if (!['tags', 'itemTags'].includes(key) || !Array.isArray(value)) return value;
  return value.map((tag) => {
    if (typeof tag === 'string') return lowercaseTag(tag);
    // Retrieval facets carry tag labels in { key, label } options.
    if (tag && typeof tag === 'object' && typeof tag.label === 'string') {
      return { ...tag, label: lowercaseTag(tag.label) };
    }
    return tag;
  });
}

module.exports = { tagsJsonReplacer };
