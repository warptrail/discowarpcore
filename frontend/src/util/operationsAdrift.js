import { normalizeBoxId } from './boxLocator.js';
import { normalizeItemCategory } from './itemCategories.js';
import { normalizeKeepPriority } from './keepPriority.js';

const normalize = (value) => String(value || '').trim().toLowerCase();

export function addCapturedOrphanedItem(items, item) {
  const id = String(item?._id || item?.id || '').trim();
  if (!id) return items;
  return [item, ...items.filter((entry) => String(entry?._id || entry?.id || '') !== id)];
}

export function filterOrphanedItems(
  items,
  {
    searchQuery = '',
    boxLocatorQuery = '',
    filterBy = 'all',
    categoryFilter = 'all',
    locationFilter = 'all',
    ownerFilter = 'all',
    keepPriorityFilter = 'all',
    locations = [],
  } = {},
) {
  if (filterBy !== 'all') return [];
  if (normalizeBoxId(boxLocatorQuery)) return [];
  if (keepPriorityFilter === 'gone') return [];

  const terms = normalize(searchQuery).split(/\s+/).filter(Boolean);
  const normalizedCategory =
    categoryFilter === 'all' ? 'all' : normalizeItemCategory(categoryFilter);
  const normalizedOwner = normalize(ownerFilter);
  const normalizedPriority =
    keepPriorityFilter === 'all' ? '' : normalizeKeepPriority(keepPriorityFilter);
  const selectedLocation = (locations || []).find(
    (location) => String(location?._id || '') === String(locationFilter),
  );
  const normalizedLocation = normalize(selectedLocation?.name || locationFilter);

  return (items || []).filter((item) => {
    const haystack = normalize(
      [
        item?.name,
        item?.label,
        item?.description,
        item?.notes,
        item?.category,
        item?.location,
        item?.primaryOwnerName,
        item?.keepPriority,
        ...(Array.isArray(item?.tags) ? item.tags : []),
      ]
        .filter(Boolean)
        .join(' '),
    );
    const matchesTerms = terms.every((term) => haystack.includes(term));
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizeItemCategory(item?.category) === normalizedCategory;
    const matchesLocation =
      locationFilter === 'all' || normalize(item?.location) === normalizedLocation;
    const matchesOwner =
      normalizedOwner === 'all' ||
      normalize(item?.primaryOwnerName) === normalizedOwner;
    const matchesPriority =
      !normalizedPriority ||
      normalizeKeepPriority(item?.keepPriority) === normalizedPriority;

    return (
      matchesTerms &&
      matchesCategory &&
      matchesLocation &&
      matchesOwner &&
      matchesPriority
    );
  });
}

