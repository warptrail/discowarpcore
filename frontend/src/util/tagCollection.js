import { getTagHref, normalizeTagName } from './tagNavigation';

export function readTagCollection(baseTag, search = '') {
  const params = new URLSearchParams(search);
  return {
    tags: [...new Set([baseTag, ...params.getAll('tag')].map(normalizeTagName).filter(Boolean))],
    operator: params.get('match') === 'and' ? 'and' : 'or',
  };
}
export function getTagCollectionHref(tags, operator = 'or', search = '') {
  const values = [...new Set(tags.map(normalizeTagName).filter(Boolean))];
  if (!values.length) return null;
  const params = new URLSearchParams(search);
  params.delete('tag'); params.delete('match');
  values.slice(1).forEach(tag => params.append('tag', tag));
  if (values.length > 1) params.set('match', operator === 'and' ? 'and' : 'or');
  return getTagHref(values[0]) + (params.size ? `?${params}` : '');
}

export function getTagCollectionNavigation(tags, operator, location) {
  const to = getTagCollectionHref(tags, operator, location.search);
  return to ? { to, options: { replace: true, state: location.state } } : null;
}
