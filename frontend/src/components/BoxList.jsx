// src/views/BoxList.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventoryGridHeader from './InventoryGridHeader';
import { normalizeItemCategory } from '../util/itemCategories';

/**
 * boxes: [{
 *   _id, box_id, label, location, description, notes,
 *   tags: string[], items: [{ _id, name, quantity }],
 *   childBoxes: same[]
 * }]
 */
export default function BoxList({ boxes = [], orphanedCount = 0, locations = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('boxId');
  const [filterBy, setFilterBy] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const telemetry = useMemo(
    () => summarizeTree(boxes, orphanedCount),
    [boxes, orphanedCount],
  );

  const visibleBoxes = useMemo(
    () =>
      applyTreeControls(boxes, {
        searchQuery,
        sortBy,
        filterBy,
        categoryFilter,
        locationFilter,
      }),
    [boxes, searchQuery, sortBy, filterBy, categoryFilter, locationFilter],
  );

  const noData = !boxes || boxes.length === 0;
  const hasNoMatches = !noData && visibleBoxes.length === 0;

  return (
    <S.Container>
      <InventoryGridHeader
        totalBoxes={telemetry.totalBoxes}
        totalItems={telemetry.totalItems}
        orphanedCount={telemetry.orphanedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        locations={locations}
      />

      {noData ? (
        <S.EmptyMessage>No boxes yet.</S.EmptyMessage>
      ) : hasNoMatches ? (
        <S.EmptyMessage>No boxes match the current search/filter.</S.EmptyMessage>
      ) : (
        visibleBoxes.map((node) => (
          <Branch key={node._id || node.box_id} node={node} depth={0} />
        ))
      )}
    </S.Container>
  );
}

function Branch({ node, depth = 0 }) {
  const navigate = useNavigate();
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const tags = Array.isArray(node.tags) ? node.tags : [];
  const items = Array.isArray(node.items) ? node.items : [];
  const isRoot = depth === 0;

  const itemQtyTotal = sumItemQty(items);
  const itemChips = items.slice(0, 8).map((it) => it.name || 'Untitled');

  const go = () => navigate(`/boxes/${node.box_id}`);

  return (
    <S.NodeSection $isRoot={isRoot} $depth={depth}>
      <S.RailBack aria-hidden="true" $isRoot={isRoot} $depth={depth} />
      <S.RailFront $isRoot={isRoot} $depth={depth}>
        <S.BoxCard onClick={go} $isRoot={isRoot} $depth={depth}>
          <S.BoxHeader>
            <S.ShortId $isRoot={isRoot} $depth={depth}>
              #{node.box_id}
            </S.ShortId>
            <S.BoxTitle $isRoot={isRoot} $depth={depth}>
              {node.label || node.name || 'Untitled'}
            </S.BoxTitle>
          </S.BoxHeader>

          {node.location && (
            <S.FieldGroup>
              <S.FieldLabel>Location</S.FieldLabel>
              <S.FieldValue>{node.location}</S.FieldValue>
            </S.FieldGroup>
          )}

          {node.description && (
            <S.FieldGroup>
              <S.FieldLabel>Description</S.FieldLabel>
              <S.FieldValue>{node.description}</S.FieldValue>
            </S.FieldGroup>
          )}

          {node.notes && (
            <S.FieldGroup>
              <S.FieldLabel>Notes</S.FieldLabel>
              <S.FieldValue>{node.notes}</S.FieldValue>
            </S.FieldGroup>
          )}

          {tags.length > 0 && (
            <>
              <S.FieldGroup>
                <S.FieldLabel>Tags</S.FieldLabel>
                <S.FieldValue />
              </S.FieldGroup>
              <S.TagRow>
                {tags.map((t, i) => (
                  <S.TagBubble
                    $isRoot={isRoot}
                    $depth={depth}
                    key={`${node._id || node.box_id}-tag-${i}`}
                  >
                    {t}
                  </S.TagBubble>
                ))}
              </S.TagRow>
            </>
          )}

          <S.BoxFooter>
            <S.StatPill $variant="boxes" $isRoot={isRoot} $depth={depth}>
              {childBoxes.length} {childBoxes.length === 1 ? 'box' : 'boxes'}
            </S.StatPill>
            <S.StatPill $variant="items" $isRoot={isRoot} $depth={depth}>
              {itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}
            </S.StatPill>
            <S.StatPill $isRoot={isRoot} $depth={depth}>
              {node.location ? truncate(node.location, 24) : '—'}
            </S.StatPill>
          </S.BoxFooter>

          {itemChips.length > 0 && (
            <>
              <S.FieldGroup>
                <S.FieldLabel>Items</S.FieldLabel>
                <S.FieldValue />
              </S.FieldGroup>
              <S.TagRow>
                {itemChips.map((name, i) => (
                  <S.TagBubble
                    $tiny
                    $isRoot={isRoot}
                    $depth={depth}
                    key={`${node._id || node.box_id}-chip-${i}`}
                  >
                    {name}
                  </S.TagBubble>
                ))}
              </S.TagRow>
            </>
          )}
        </S.BoxCard>

        {childBoxes.length > 0 && (
          <S.NodeChildren $depth={depth + 1}>
            {childBoxes.map((child) => (
              <Branch
                key={child._id || child.box_id}
                node={child}
                depth={depth + 1}
              />
            ))}
          </S.NodeChildren>
        )}
      </S.RailFront>
    </S.NodeSection>
  );
}

function summarizeTree(nodes, orphanedCount = 0) {
  const safeOrphaned = Number.isFinite(Number(orphanedCount))
    ? Number(orphanedCount)
    : 0;

  const summary = {
    totalBoxes: 0,
    totalItems: 0,
    orphanedCount: safeOrphaned,
  };

  const walk = (list) => {
    for (const node of list || []) {
      summary.totalBoxes += 1;
      summary.totalItems += sumItemQty(node.items);
      walk(node.childBoxes || []);
    }
  };

  walk(nodes);
  return summary;
}

function applyTreeControls(
  nodes,
  {
    searchQuery = '',
    sortBy = 'boxId',
    filterBy = 'all',
    categoryFilter = 'all',
    locationFilter = 'all',
  },
) {
  const query = normalize(searchQuery);

  const processNode = (node) => {
    if (!node || typeof node !== 'object') return null;

    const children = (node.childBoxes || [])
      .map(processNode)
      .filter(Boolean);

    const matchesSearch = !query || matchesQuery(node, query);
    const qty = sumItemQty(node.items);
    const normalizedCategoryFilter =
      categoryFilter === 'all'
        ? 'all'
        : normalizeItemCategory(categoryFilter);
    const matchesFilter =
      filterBy === 'all' ||
      (filterBy === 'withItems' && qty > 0) ||
      (filterBy === 'empty' && qty === 0);
    const matchesCategory =
      normalizedCategoryFilter === 'all' ||
      hasItemWithCategory(node.items, normalizedCategoryFilter);
    const nodeLocationId = String(getLocationId(node) || '');
    const matchesLocation =
      locationFilter === 'all' ||
      (nodeLocationId && nodeLocationId === String(locationFilter));

    const include =
      (matchesSearch && matchesFilter && matchesCategory && matchesLocation) ||
      children.length > 0;
    if (!include) return null;

    return {
      ...node,
      childBoxes: sortNodes(children, sortBy),
    };
  };

  const mapped = (nodes || []).map(processNode).filter(Boolean);
  return sortNodes(mapped, sortBy);
}

function sortNodes(nodes, sortBy) {
  const list = [...(nodes || [])];

  list.sort((a, b) => {
    const aName = normalize(a?.label || a?.name || '');
    const bName = normalize(b?.label || b?.name || '');

    if (sortBy === 'location') {
      const diff = compareText(normalize(a?.location || ''), normalize(b?.location || ''));
      if (diff !== 0) return diff;
      return compareText(aName, bName);
    }

    if (sortBy === 'itemCount') {
      const diff = sumItemQty(b?.items) - sumItemQty(a?.items);
      if (diff !== 0) return diff;
      return compareText(aName, bName);
    }

    if (sortBy === 'boxId') {
      const aNum = Number(a?.box_id);
      const bNum = Number(b?.box_id);
      const aValid = Number.isFinite(aNum);
      const bValid = Number.isFinite(bNum);
      if (aValid && bValid && aNum !== bNum) return aNum - bNum;
      return compareText(String(a?.box_id || ''), String(b?.box_id || ''));
    }

    return compareText(aName, bName);
  });

  return list;
}

function matchesQuery(node, query) {
  const tags = Array.isArray(node?.tags) ? node.tags.join(' ') : '';
  const haystack = normalize(
    [
      node?.label,
      node?.name,
      node?.box_id,
      node?.location,
      node?.description,
      node?.notes,
      tags,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return haystack.includes(query);
}

function sumItemQty(items) {
  return (items || []).reduce((sum, it) => {
    const q = Number(it?.quantity);
    if (Number.isFinite(q)) return sum + q;
    return sum + 1;
  }, 0);
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasItemWithCategory(items, categoryFilter) {
  if (!categoryFilter) return true;
  if (!Array.isArray(items) || items.length === 0) return false;

  return items.some(
    (item) => normalizeItemCategory(item?.category) === categoryFilter
  );
}

function getLocationId(node) {
  return node?.locationId?._id ?? node?.locationId ?? null;
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? `${str.slice(0, n - 1)}...` : str;
}
