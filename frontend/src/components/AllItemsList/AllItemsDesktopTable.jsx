import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import * as S from './AllItemsList.styles';
import { getVisibleTags } from './allItemsList.utils';

function shouldSkipRowNavigation(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, input, select, textarea, [role="button"]'));
}

function getItemHref(itemId) {
  if (!itemId) return '';
  try {
    return getItemHomeHref(itemId);
  } catch {
    return '';
  }
}

function renderBoxCell(meta) {
  if (!meta) return <S.Subtle>—</S.Subtle>;

  if (meta.isBoxed) {
    const title = [meta.boxId, meta.boxLabel].filter(Boolean).join(' • ');
    return (
      <>
        {meta.boxHref ? <S.BoxLink to={meta.boxHref}>{title}</S.BoxLink> : <S.BoxLabel>{title}</S.BoxLabel>}
        {meta.boxDescription ? <S.ContextLine>{meta.boxDescription}</S.ContextLine> : null}
        {meta.locationLabel ? <S.ContextLine>Location: {meta.locationLabel}</S.ContextLine> : null}
      </>
    );
  }

  if (meta.isOrphaned) {
    return (
      <>
        <S.PillRow>
          <S.Pill $tone="amber">Orphaned</S.Pill>
        </S.PillRow>
        {meta.orphanedAtLabel && meta.orphanedAtLabel !== '—' ? (
          <S.ContextLine>Orphaned at: {meta.orphanedAtLabel}</S.ContextLine>
        ) : null}
        {meta.locationLabel ? <S.ContextLine>Location: {meta.locationLabel}</S.ContextLine> : null}
      </>
    );
  }

  if (meta.isGone) {
    return (
      <>
        {meta.hasHistoricalBox ? (
          <S.BoxLabel>
            Last box: {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
          </S.BoxLabel>
        ) : (
          <S.Subtle>Historical state</S.Subtle>
        )}
        {meta.locationLabel ? <S.ContextLine>Location snapshot: {meta.locationLabel}</S.ContextLine> : null}
      </>
    );
  }

  return <S.Subtle>Unassigned</S.Subtle>;
}

function renderLifecycleCell(meta) {
  if (!meta) return <S.Subtle>—</S.Subtle>;

  if (!meta.isGone) {
    return <S.Subtle>Active inventory item</S.Subtle>;
  }

  return (
    <>
      <S.LifecycleText>Gone at: {meta.dispositionAtLabel}</S.LifecycleText>
      {meta.hasDispositionNotes && meta.dispositionNotesPreview ? (
        <S.NotesPreview>{meta.dispositionNotesPreview}</S.NotesPreview>
      ) : (
        <S.Subtle>No disposition notes</S.Subtle>
      )}
    </>
  );
}

export default function AllItemsDesktopTable({ items = [] }) {
  const navigate = useNavigate();
  const safeItems = Array.isArray(items) ? items : [];

  const handleRowOpen = (event, itemId) => {
    if (!itemId || shouldSkipRowNavigation(event.target)) return;
    navigate(getItemHref(itemId));
  };

  const handleRowKeyDown = (event, itemId) => {
    if (!itemId) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    navigate(getItemHref(itemId));
  };

  return (
    <S.TableScroll>
      <S.Table>
        <thead>
          <tr>
            <S.TH>Item</S.TH>
            <S.TH>Qty</S.TH>
            <S.TH>Category + Tags</S.TH>
            <S.TH>Status</S.TH>
            <S.TH>Lifecycle</S.TH>
            <S.TH>Box / Location</S.TH>
          </tr>
        </thead>
        <tbody>
          {safeItems.map((item, index) => {
            const meta = item?._allItems;
            const itemId = item?._id;
            const itemHref = getItemHref(itemId);
            const { visible, overflow } = getVisibleTags(meta?.tags, 4);
            const owner = meta?.ownerLabel || '';
            const keepPriorityLabel = meta?.keepPriorityLabel || '';
            const itemName = String(item?.name || 'Unnamed item');

            return (
              <S.TR
                key={itemId || `${itemName}-${meta?.createdAtMs || index}`}
                tabIndex={itemId ? 0 : -1}
                role={itemId ? 'link' : undefined}
                onClick={(event) => handleRowOpen(event, itemId)}
                onKeyDown={(event) => handleRowKeyDown(event, itemId)}
              >
                <S.TD>
                  {itemHref ? (
                    <S.NameLink to={itemHref} onClick={(event) => event.stopPropagation()}>
                      {itemName}
                    </S.NameLink>
                  ) : (
                    <S.NameText>{itemName}</S.NameText>
                  )}

                  {owner ? <S.NameMeta>{`Owner: ${owner}`}</S.NameMeta> : null}
                  {keepPriorityLabel ? (
                    <S.KeepPriorityBadge
                      $tone={meta?.keepPriorityTone}
                    >
                      Keep: {keepPriorityLabel}
                    </S.KeepPriorityBadge>
                  ) : null}
                </S.TD>

                <S.TD>
                  <S.QtyPill>{meta?.quantityLabel || '—'}</S.QtyPill>
                </S.TD>

                <S.TD>
                  <S.Category>{meta?.categoryLabel || 'Uncategorized'}</S.Category>
                  {item?.isConsumable ? <S.ContextLine>Consumable</S.ContextLine> : null}
                  {visible.length ? (
                    <S.TagRow>
                      {visible.map((tag) => (
                        <S.TagChip key={`${itemId || itemName}-${tag}`}>{tag}</S.TagChip>
                      ))}
                      {overflow > 0 ? <S.OverflowTag>+{overflow}</S.OverflowTag> : null}
                    </S.TagRow>
                  ) : (
                    <S.Subtle>No tags</S.Subtle>
                  )}
                </S.TD>

                <S.TD>
                  <S.PillRow>
                    <S.Pill $tone={meta?.statusTone}>{meta?.statusLabel || '—'}</S.Pill>
                    {meta?.isGone && meta?.disposition ? (
                      <S.Pill $tone={meta?.dispositionTone}>{meta?.dispositionLabel}</S.Pill>
                    ) : null}
                    {meta?.hasDispositionNotes ? <S.NotesFlag>Notes</S.NotesFlag> : null}
                  </S.PillRow>
                </S.TD>

                <S.TD>{renderLifecycleCell(meta)}</S.TD>

                <S.TD>{renderBoxCell(meta)}</S.TD>
              </S.TR>
            );
          })}
        </tbody>
      </S.Table>
    </S.TableScroll>
  );
}
