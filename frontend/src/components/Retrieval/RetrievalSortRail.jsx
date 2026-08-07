import { useEffect, useRef, useState } from 'react';
import * as S from './Retrieval.styles';

const SORT_SHORT_LABELS = {
  location: 'LOC',
  name: 'NAME',
  box: 'BOX',
  category: 'CAT',
  owner: 'OWNER',
  keepPriority: 'KEEP',
};

function getSortBaseKey(value) {
  return String(value || '').replace(/_desc$/, '');
}

function isDescendingSort(value) {
  return String(value || '').endsWith('_desc');
}

function getBaseSortOptions(options) {
  const seen = new Set();

  return (Array.isArray(options) ? options : []).reduce((result, option) => {
    const key = getSortBaseKey(option?.key);
    if (!key || seen.has(key)) return result;

    seen.add(key);
    result.push({
      key,
      label: String(option?.label || key).replace(/\s*\([^)]+\)\s*$/, ''),
    });
    return result;
  }, []);
}

function getDirectionTitle(options, baseKey, descending) {
  const targetKey = `${baseKey}${descending ? '_desc' : ''}`;
  const option = (Array.isArray(options) ? options : []).find(
    (entry) => String(entry?.key || '') === targetKey,
  );
  return String(option?.label || (descending ? 'Descending' : 'Ascending'));
}

export default function RetrievalSortRail({
  sortOptions = [],
  selectedSort = '',
  onSortChange,
}) {
  const [tooltipKey, setTooltipKey] = useState('');
  const longPressTimerRef = useRef(null);
  const dismissTooltipTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const selectedSortKey = String(selectedSort || '');
  const selectedBaseKey = getSortBaseKey(selectedSortKey);
  const descending = isDescendingSort(selectedSortKey);
  const baseOptions = getBaseSortOptions(sortOptions);
  const hasDirectionVariant = sortOptions.some(
    (option) => String(option?.key || '') === `${selectedBaseKey}_desc`,
  );

  useEffect(() => () => {
    window.clearTimeout(longPressTimerRef.current);
    window.clearTimeout(dismissTooltipTimerRef.current);
  }, []);

  const clearLongPressTimer = () => {
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const showTooltip = (key) => {
    window.clearTimeout(dismissTooltipTimerRef.current);
    setTooltipKey(key);
  };

  const hideTooltip = () => {
    window.clearTimeout(dismissTooltipTimerRef.current);
    setTooltipKey('');
  };

  const startLongPress = (key, event) => {
    if (event.pointerType !== 'touch') return;
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      showTooltip(key);
      dismissTooltipTimerRef.current = window.setTimeout(() => setTooltipKey(''), 1800);
    }, 480);
  };

  const selectBaseSort = (nextBaseKey) => {
    const preferredKey = `${nextBaseKey}${descending ? '_desc' : ''}`;
    const nextKey = sortOptions.some(
      (option) => String(option?.key || '') === preferredKey,
    )
      ? preferredKey
      : nextBaseKey;
    onSortChange?.(nextKey);
  };

  const toggleDirection = () => {
    if (!selectedBaseKey || !hasDirectionVariant) return;
    onSortChange?.(`${selectedBaseKey}${descending ? '' : '_desc'}`);
  };

  return (
    <S.InlineSortRail role="group" aria-label="Sort retrieval results">
      {baseOptions.map((option) => {
        const active = option.key === selectedBaseKey;
        const shortLabel = SORT_SHORT_LABELS[option.key]
          || option.label.slice(0, 5).toUpperCase();
        const tooltipId = `retrieval-sort-tooltip-${option.key}`;

        return (
          <S.InlineSortButtonWrap key={option.key}>
            <S.InlineSortButton
              type="button"
              $active={active}
              aria-pressed={active}
              aria-label={`Sort by ${option.label}`}
              aria-describedby={tooltipKey === option.key ? tooltipId : undefined}
              title={`Sort by ${option.label}`}
              onClick={() => {
                if (longPressTriggeredRef.current) {
                  longPressTriggeredRef.current = false;
                  return;
                }
                selectBaseSort(option.key);
              }}
              onFocus={() => showTooltip(option.key)}
              onBlur={hideTooltip}
              onMouseEnter={() => showTooltip(option.key)}
              onMouseLeave={hideTooltip}
              onPointerDown={(event) => startLongPress(option.key, event)}
              onPointerUp={clearLongPressTimer}
              onPointerCancel={clearLongPressTimer}
            >
              {shortLabel}
            </S.InlineSortButton>
            {tooltipKey === option.key ? (
              <S.InlineSortTooltip id={tooltipId} role="tooltip">
                {option.label}
              </S.InlineSortTooltip>
            ) : null}
          </S.InlineSortButtonWrap>
        );
      })}

      <S.InlineSortButtonWrap>
        <S.InlineSortDirectionButton
          type="button"
          onClick={() => {
            if (longPressTriggeredRef.current) {
              longPressTriggeredRef.current = false;
              return;
            }
            toggleDirection();
          }}
          disabled={!hasDirectionVariant}
          aria-label={`Sort direction is ${descending ? 'descending' : 'ascending'}. Activate to reverse.`}
          aria-describedby={tooltipKey === 'direction' ? 'retrieval-sort-tooltip-direction' : undefined}
          title={`${getDirectionTitle(sortOptions, selectedBaseKey, descending)} — reverse direction`}
          onFocus={() => showTooltip('direction')}
          onBlur={hideTooltip}
          onMouseEnter={() => showTooltip('direction')}
          onMouseLeave={hideTooltip}
          onPointerDown={(event) => startLongPress('direction', event)}
          onPointerUp={clearLongPressTimer}
          onPointerCancel={clearLongPressTimer}
        >
          <span aria-hidden="true">{descending ? '↓' : '↑'}</span>
        </S.InlineSortDirectionButton>
        {tooltipKey === 'direction' ? (
          <S.InlineSortTooltip id="retrieval-sort-tooltip-direction" role="tooltip">
            {getDirectionTitle(sortOptions, selectedBaseKey, descending)} — reverse direction
          </S.InlineSortTooltip>
        ) : null}
      </S.InlineSortButtonWrap>
    </S.InlineSortRail>
  );
}
