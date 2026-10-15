import React from 'react';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventorySearchMatches from './InventorySearchMatches';
import { DesktopItemCount } from './OperationsInventory/OperationsCardLayout.styles';

export default function OrphanedAttentionPanel({ count = 0, items = [], searchQuery = '', ambientQuiet = false, onOpen, selected = false, desktop = false }) {
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
          as={desktop ? 'div' : 'button'}
          type={desktop ? undefined : 'button'}
          role={desktop ? 'button' : undefined}
          tabIndex={desktop ? 0 : undefined}
          data-operations-box-preview-trigger
          data-has-search-matches={Boolean(desktop && query && items.length) || undefined}
          aria-controls="operations-box-quick-peek"
          aria-expanded={selected}
          onClick={(event) => { if (!event.target.closest('a')) onOpen?.(event.currentTarget); }}
          onKeyDown={desktop ? (event) => {
            if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) {
              event.preventDefault(); onOpen?.(event.currentTarget);
            }
          } : undefined}
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
              <DesktopItemCount>{resolvedCount} {resolvedCount === 1 ? 'item' : 'items'}</DesktopItemCount>
              <S.OrphanedAttentionTitle>Items Adrift</S.OrphanedAttentionTitle>
              <S.OrphanedAttentionMeta>
                {query ? `${resolvedCount} matching items` : 'In transit or intentionally kept outside a box'}
              </S.OrphanedAttentionMeta>
              {desktop && query && items.length > 0 ? <InventorySearchMatches compact items={items} query={query} /> : null}
            </S.OrphanedAttentionCopy>
          </S.BoxBodyRow>
          <S.CardManifest aria-hidden="true" $isRoot $depth={0}>
            <span>
              {resolvedCount} {resolvedCount === 1 ? 'item' : 'items'}
            </span>
          </S.CardManifest>
        </S.OrphanedAttentionLink>
        {!desktop && query && items.length > 0 ? <InventorySearchMatches items={items} query={query} /> : null}
      </S.RailFront>
    </S.NodeSection>
  );
}
