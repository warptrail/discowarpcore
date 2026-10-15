import { getSearchTerms } from '../../util/searchHighlight';
import { locationLabel } from './locationHierarchy';

export function findLocationPaths(locations, query) {
  const terms = getSearchTerms(query);
  return locations.filter(location => {
    const label = locationLabel(location).toLocaleLowerCase();
    return terms.every(term => label.includes(term));
  });
}
