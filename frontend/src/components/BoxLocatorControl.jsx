import React from 'react';
import * as S from '../styles/InventoryGridHeader.styles';
import { normalizeBoxAddress, parseBoxAddress } from '../util/boxAddress';
import BoxIdPrefixInput from './BoxIdPrefixInput';


function pluralizeBoxes(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return `${safeCount} ${safeCount === 1 ? 'box' : 'boxes'}`;
}

function getScopeReadout({ query, visibleBoxCount, exactMatch }) {
  const normalized = normalizeBoxAddress(query);

  if (!normalized) return 'All boxes';
  if (normalized.length === 1) {
    return `${normalized}XX · ${pluralizeBoxes(visibleBoxCount)}`;
  }
  if (normalized.length === 2) {
    return `${normalized}X · ${pluralizeBoxes(visibleBoxCount)}`;
  }
  if (!exactMatch) return 'Invalid or unknown address';

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
  compact = false,
}) {
  const normalizedQuery = normalizeBoxAddress(query);
  const readout = getScopeReadout({
    query: normalizedQuery,
    visibleBoxCount,
    exactMatch,
  });

  const updateQuery = (value) => {
    onQueryChange?.(normalizeBoxAddress(value));
  };

  const invalid = Boolean(normalizedQuery && (!parseBoxAddress(normalizedQuery) || (normalizedQuery.length >= 3 && !exactMatch)));
  return (
    <S.BoxLocatorScope $active={Boolean(normalizedQuery)} $compact={compact} title={compact ? readout : undefined}>
      <S.BoxLocatorInputGroup $compact={compact}>
        <S.ControlLabel>Box locator</S.ControlLabel>
        <S.BoxLocatorInputFrame>
        <BoxIdPrefixInput
          inputAs={S.BoxLocatorInput}
          $compact={compact}
          id="bx-locator"
          namePrefix="box_scope"
          maxLength={32}
          aria-invalid={invalid || undefined}
          title={invalid ? readout : "Box, cabinet, or shelf address (up to 504Z99)"}
          value={normalizedQuery}
          onChange={(event) => updateQuery(event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            updateQuery(event.clipboardData?.getData('text') || '');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && exactMatch) {
              event.preventDefault();
              onActivateExact?.(event.currentTarget.value);
            }
            if (event.key === 'Escape' && normalizedQuery) {
              event.preventDefault();
              updateQuery('');
            }
          }}
          placeholder=""
          ariaLabel="Box address scope locator"
        />
        {!normalizedQuery ? <S.BoxLocatorClockHint aria-hidden="true">000</S.BoxLocatorClockHint> : null}
        </S.BoxLocatorInputFrame>
      </S.BoxLocatorInputGroup>

      <S.BoxLocatorReadout aria-live="polite" title={readout} $compact={compact && !invalid}>
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
