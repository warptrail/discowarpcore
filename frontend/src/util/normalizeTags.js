// utils/normalizeTags.js
export function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter((t) => t != null) // drop null/undefined
    .map((t) => {
      if (typeof t === 'string') {
        return { value: t, status: 'unchanged' };
      }
      return {
        value: t.value || '',
        status: t.status || 'unchanged',
      };
    });
}
