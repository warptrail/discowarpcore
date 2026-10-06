import React from 'react';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventorySearchMatches from './InventorySearchMatches';

export default function OrphanedAttentionPanel({ count = 0, items = [], searchQuery = '', ambientQuiet = false, onOpen, selected = false }) {
  const query = searchQuery.trim();
  const resolvedCount = Math.max(0, Number(count) || 0);

  return (
    <S.NodeSection
      id="operations-box-adrift"
      $isRoot
      $depth={0}
      $ambientQuiet={ambientQuiet}
      style={{
        '--box-primary': '#A7B6FF',
        '--box-primary-rgb': '167, 182, 255',
        '--box-secondary': '#67D9D3',
        '--box-secondary-rgb': '103, 217, 211',
      }}
    >
      <S.OrphanedRailBack aria-hidden="true" $isRoot $depth={0} />
      <S.RailFront $isRoot $depth={0}>
        <S.OrphanedAttentionLink
          as="button"
          type="button"
          data-operations-box-preview-trigger
          aria-controls="operations-box-quick-peek"
          aria-expanded={selected}
          onClick={(event) => onOpen?.(event.currentTarget)}
          aria-label={`Open ${resolvedCount} Items Adrift ${resolvedCount === 1 ? 'item' : 'items'}`}
          $isRoot
          $depth={0}
          $density="compact"
        >
          <S.BoxBodyRow $density="compact">
            <S.OrphanedSignal aria-hidden="true" $density="compact" />
            <S.OrphanedAttentionCopy>
              <S.OrphanedAttentionKicker>
                Ready to place
              </S.OrphanedAttentionKicker>
              <S.OrphanedAttentionTitle>Items Adrift</S.OrphanedAttentionTitle>
              <S.OrphanedAttentionMeta>
                {query ? `${resolvedCount} matching items · found below` : 'In transit or intentionally kept outside a box'}
              </S.OrphanedAttentionMeta>
            </S.OrphanedAttentionCopy>
          </S.BoxBodyRow>
          <S.CardManifest aria-hidden="true" $isRoot $depth={0}>
            <span>
              {resolvedCount} {resolvedCount === 1 ? 'item' : 'items'}
            </span>
          </S.CardManifest>
        </S.OrphanedAttentionLink>
        {query && items.length > 0 ? <InventorySearchMatches items={items} query={query} /> : null}
      </S.RailFront>
    </S.NodeSection>
  );
}

