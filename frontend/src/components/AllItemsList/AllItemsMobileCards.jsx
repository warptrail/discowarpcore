import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import * as S from './AllItemsList.styles';
import { getVisibleTags } from './allItemsList.utils';

function getItemHref(itemId) {
  if (!itemId) return '';
  try {
    return getItemHomeHref(itemId);
  } catch {
    return '';
  }
}

function openFromKeyboard(event, onOpen) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpen?.();
}

export default function AllItemsMobileCards({ items = [] }) {
  const navigate = useNavigate();
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <S.MobileList>
      {safeItems.map((item, index) => {
        const meta = item?._allItems;
        const itemId = item?._id;
        const itemHref = getItemHref(itemId);
        const name = String(item?.name || 'Unnamed item');
        const { visible, overflow } = getVisibleTags(meta?.tags, 4);

        return (
          <S.MobileCard key={itemId || `${name}-${meta?.createdAtMs || index}`}>
            <S.MobileCardButton
              type="button"
              aria-disabled={!itemHref}
              onClick={() => {
                if (itemHref) navigate(itemHref);
              }}
              onKeyDown={(event) =>
                openFromKeyboard(event, () => {
                  if (itemHref) navigate(itemHref);
                })
              }
            >
              <S.MobileTop>
                <S.MobileNameBlock>
                  {itemHref ? (
                    <S.MobileNameLink to={itemHref} onClick={(event) => event.stopPropagation()}>
                      {name}
                    </S.MobileNameLink>
                  ) : (
                    <S.MobileNameText>{name}</S.MobileNameText>
                  )}

                  <S.MobileMeta>{meta?.categoryLabel || 'Uncategorized'}</S.MobileMeta>
                </S.MobileNameBlock>

                <S.QtyPill>{meta?.quantityLabel || '—'}</S.QtyPill>
              </S.MobileTop>

              <S.MobileFacts>
                <S.MobileLine>
                  <S.Pill $tone={meta?.statusTone}>{meta?.statusLabel || '—'}</S.Pill>
                  {meta?.isGone && meta?.disposition ? (
                    <S.Pill $tone={meta?.dispositionTone}>{meta?.dispositionLabel}</S.Pill>
                  ) : null}
                  {meta?.hasDispositionNotes ? <S.NotesFlag>Notes</S.NotesFlag> : null}
                </S.MobileLine>

                {visible.length ? (
                  <S.MobileLine>
                    {visible.map((tag) => (
                      <S.TagChip key={`${itemId || name}-${tag}`}>{tag}</S.TagChip>
                    ))}
                    {overflow > 0 ? <S.OverflowTag>+{overflow}</S.OverflowTag> : null}
                  </S.MobileLine>
                ) : null}

                <S.MobileLine>
                  {meta?.isBoxed ? (
                    meta?.boxHref ? (
                      <S.BoxLink to={meta.boxHref} onClick={(event) => event.stopPropagation()}>
                        {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
                      </S.BoxLink>
                    ) : (
                      <S.BoxLabel>{[meta?.boxId, meta?.boxLabel].filter(Boolean).join(' • ')}</S.BoxLabel>
                    )
                  ) : meta?.isOrphaned ? (
                    <S.Pill $tone="amber">Orphaned</S.Pill>
                  ) : meta?.hasHistoricalBox ? (
                    <S.BoxLabel>
                      Last box: {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
                    </S.BoxLabel>
                  ) : (
                    <S.Subtle>Unassigned</S.Subtle>
                  )}
                </S.MobileLine>

                {meta?.isOrphaned && meta?.orphanedAtLabel && meta?.orphanedAtLabel !== '—' ? (
                  <S.MobileLine>
                    <S.Subtle>Orphaned at: {meta.orphanedAtLabel}</S.Subtle>
                  </S.MobileLine>
                ) : null}

                {meta?.locationLabel ? (
                  <S.MobileLine>
                    <S.Subtle>Location: {meta.locationLabel}</S.Subtle>
                  </S.MobileLine>
                ) : null}

                {meta?.isGone ? (
                  <S.MobileLine>
                    <S.Subtle>Gone at: {meta.dispositionAtLabel}</S.Subtle>
                  </S.MobileLine>
                ) : null}

                {meta?.hasDispositionNotes && meta?.dispositionNotesPreview ? (
                  <S.MobileNotes>{meta.dispositionNotesPreview}</S.MobileNotes>
                ) : null}
              </S.MobileFacts>
            </S.MobileCardButton>
          </S.MobileCard>
        );
      })}
    </S.MobileList>
  );
}
