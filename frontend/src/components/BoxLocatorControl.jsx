import React from 'react';
import * as S from '../styles/InventoryGridHeader.styles';
import { normalizeBoxId } from '../util/boxLocator';
import BoxIdPrefixInput from './BoxIdPrefixInput';

const MAX_PREFIX_LENGTH = 3;

function pluralizeBoxes(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return `${safeCount} ${safeCount === 1 ? 'box' : 'boxes'}`;
}

function getScopeReadout({ query, visibleBoxCount, exactMatch }) {
  const normalized = normalizeBoxId(query).slice(0, MAX_PREFIX_LENGTH);

  if (!normalized) return 'ALL BOXES';
  if (normalized.length === 1) {
    return `${normalized}XX · ${pluralizeBoxes(visibleBoxCount)}`;
  }
  if (normalized.length === 2) {
    return `${normalized}X · ${pluralizeBoxes(visibleBoxCount)}`;
  }
  if (!exactMatch) return 'NO BOX SIGNAL';

  const label = String(exactMatch?.label || exactMatch?.name || 'Untitled box').trim();
  return `#${normalized} · ${label}`;
}

export default function BoxLocatorControl({
  query = '',
  onQueryChange,
  matchingRootCount = 0,
  visibleBoxCount = 0,
  exactMatch = null,
  onActivateExact,
}) {
  const normalizedQuery = normalizeBoxId(query).slice(0, MAX_PREFIX_LENGTH);
  const readout = getScopeReadout({
    query: normalizedQuery,
    visibleBoxCount,
    exactMatch,
  });

  const updateQuery = (value) => {
    onQueryChange?.(normalizeBoxId(value).slice(0, MAX_PREFIX_LENGTH));
  };

  return (
    <S.BoxLocatorScope $active={Boolean(normalizedQuery)}>
      <S.BoxLocatorInputGroup>
        <S.ControlLabel>Box Locator</S.ControlLabel>
        <BoxIdPrefixInput
          inputAs={S.BoxLocatorInput}
          id="bx-locator"
          namePrefix="box_scope"
          maxLength={MAX_PREFIX_LENGTH}
          value={normalizedQuery}
          onChange={(event) => updateQuery(event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            updateQuery(event.clipboardData?.getData('text') || '');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && exactMatch) {
              event.preventDefault();
              onActivateExact?.();
            }
            if (event.key === 'Escape' && normalizedQuery) {
              event.preventDefault();
              updateQuery('');
            }
          }}
          placeholder="000"
          ariaLabel="Three-digit box scope locator"
        />
      </S.BoxLocatorInputGroup>

      <S.BoxLocatorReadout aria-live="polite" title={readout}>
        <span>{readout}</span>
        {normalizedQuery && normalizedQuery.length < 3 ? (
          <small>{matchingRootCount} matching roots</small>
        ) : null}
      </S.BoxLocatorReadout>

      {normalizedQuery ? (
        <S.BoxLocatorClear
          type="button"
          onClick={() => updateQuery('')}
          aria-label="Clear box locator scope"
        >
          ×
        </S.BoxLocatorClear>
      ) : null}
    </S.BoxLocatorScope>
  );
}
