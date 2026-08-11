import React, { useMemo } from 'react';

import * as S from '../styles/BoxTree.styles';
import { compareItemsByMode, matchesItemQuery, normalizeItemQuery } from '../util/itemBrowse';
import BoxDetailActionSection from './BoxDetailView/BoxDetailActionSection';
import BoxTreeUnit from './BoxTreeUnit';

function formatBoxChipId(value) { const raw = String(value ?? '').trim(); return !raw ? '#???' : /^\d+$/.test(raw) ? `#${raw.padStart(3, '0')}` : `#${raw}`; }
function countItemsInTree(node) { return !node ? 0 : (node.items || []).length + (node.childBoxes || []).reduce((sum, child) => sum + countItemsInTree(child), 0); }

function AsciiTreeNode({ node, depth = 0, prefix = '', onOpenItem, openItemId }) {
  const entries = [...(node?.items || []).map((value, index) => ({ kind: 'item', value, key: `item-${index}` })), ...(node?.childBoxes || []).map((value, index) => ({ kind: 'box', value, key: `box-${index}` }))];
  return entries.map((entry, index) => {
    const last = index === entries.length - 1; const branch = `${prefix}${last ? '└── ' : '├── '}`;
    if (entry.kind === 'item') { const id = String(entry.value?._id || entry.value?.id || ''); return <S.AsciiLine key={entry.key} $depth={depth}><S.AsciiItemButton type="button" $active={id === openItemId} onClick={() => onOpenItem?.(id)}><S.AsciiPrefix>{branch}</S.AsciiPrefix><S.AsciiLabel>{entry.value?.name || 'Unnamed item'}</S.AsciiLabel></S.AsciiItemButton></S.AsciiLine>; }
    const child = entry.value; return <React.Fragment key={entry.key}><S.AsciiLine $depth={depth}><S.AsciiPrefix>{branch}</S.AsciiPrefix><S.AsciiBoxLabel>{formatBoxChipId(child?.box_id ?? child?.shortId)} {child?.label || child?.name || 'Box'}</S.AsciiBoxLabel></S.AsciiLine><AsciiTreeNode node={child} depth={depth + 1} prefix={`${prefix}${last ? '    ' : '│   '}`} onOpenItem={onOpenItem} openItemId={openItemId} /></React.Fragment>;
  });
}
function AsciiTree({ node, onOpenItem, openItemId }) { return <S.AsciiTree role="tree"><S.AsciiLine><S.AsciiPrefix>. </S.AsciiPrefix><S.AsciiBoxLabel>{formatBoxChipId(node?.box_id ?? node?.shortId)} {node?.label || node?.name || 'Box'}</S.AsciiBoxLabel></S.AsciiLine><S.AsciiBranch><AsciiTreeNode node={node} onOpenItem={onOpenItem} openItemId={openItemId} /></S.AsciiBranch></S.AsciiTree>; }

export default function BoxTree({ node, openItemId, onOpenItem, refreshBox, searchQuery, sortMode = 'recentlyAdded', viewMode = 'full', scopeLabel = 'Box tree', onManageBox, ...itemListProps }) {
  const query = normalizeItemQuery(searchQuery);
  const displayTree = useMemo(() => mapTree(node, query, sortMode, [], true), [node, query, sortMode]);
  const count = countItemsInTree(displayTree);
  if (!node) return null;
  return <S.TreeRoot><BoxDetailActionSection title={scopeLabel} count={count} box={node} onItemsChanged={refreshBox} onManageBox={onManageBox}>{viewMode === 'condensed' ? <BoxTreeUnit node={displayTree} root autoExpand={Boolean(query)} openItemId={openItemId} onOpenItem={onOpenItem} refreshBox={refreshBox} {...itemListProps} /> : <AsciiTree node={displayTree} openItemId={openItemId} onOpenItem={onOpenItem} />}</BoxDetailActionSection></S.TreeRoot>;
}

function mapTree(node, query, sortMode, path = [], root = false) {
  if (!node) return null;
  const label = String(node.label || node.name || ''); const id = String(node.box_id || node.shortId || ''); const nextPath = label ? [...path, label] : path;
  const items = (node.items || []).filter((item) => matchesItemQuery(item, query, { boxLabel: label, boxId: id, pathLabels: nextPath })).sort((a, b) => compareItemsByMode(a, b, sortMode));
  const childBoxes = (node.childBoxes || []).map((child) => mapTree(child, query, sortMode, nextPath)).filter(Boolean);
  if (!root && query && !items.length && !childBoxes.length) return null;
  return { ...node, items, childBoxes };
}
