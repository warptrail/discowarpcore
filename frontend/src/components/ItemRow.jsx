// src/components/ItemRow.shared.jsx
import React, { memo, useMemo } from 'react';
import * as S from '../styles/ItemRow.styles';

function ItemRowBase({
  itemIds = [],
  itemsById, // Map<string, Item> or Record<string, Item>
  onOpenItem, // (id) => void
  selectedId = null, // highlight one
  showThumb = true,
  showTags = true,
  showMeta = true, // show qty / dates / box chip
  compact = false,
  emptyHint = 'No items',
}) {
  const items = useMemo(() => {
    const get = (id) =>
      itemsById instanceof Map
        ? itemsById.get(String(id))
        : itemsById?.[String(id)];
    return itemIds
      .map((id) => ({ id: String(id), it: get(id) }))
      .filter(({ it }) => !!it);
  }, [itemIds, itemsById]);

  if (items.length === 0) return <S.Empty>{emptyHint}</S.Empty>;

  return (
    <S.Row role="list">
      {items.map(({ id, it }) => {
        const isSelected = selectedId && String(selectedId) === id;
        const src = it.imagePath || '/img/filler.png';
        const qty = typeof it.quantity === 'number' ? it.quantity : 1;
        const tags = Array.isArray(it.tags) ? it.tags : [];
        const notes = it.notes || '';
        // ISO 8601 preferred from backend; fallback to nothing if absent
        const created = it.createdAt ? new Date(it.createdAt) : null;
        const updated = it.updatedAt ? new Date(it.updatedAt) : null;

        return (
          <S.Chip
            role="listitem"
            key={id}
            $compact={compact}
            $selected={!!isSelected}
            onClick={() => onOpenItem && onOpenItem(id)}
            title={it.name}
          >
            {showThumb && <S.Thumb src={src} alt={it.name} />}
            <S.Meta>
              <S.TopLine>
                <S.Name $compact={compact}>{it.name}</S.Name>
                {qty > 1 && <S.Badge title="Quantity">×{qty}</S.Badge>}
              </S.TopLine>

              {showTags && tags.length > 0 && (
                <S.Tags>
                  {tags.slice(0, 6).map((t) => (
                    <S.Tag key={t}>{t}</S.Tag>
                  ))}
                </S.Tags>
              )}

              {notes && !compact && <S.Notes>{notes}</S.Notes>}

              {showMeta && (
                <S.MetaRow>
                  {/* Box summary chip if present (see backend suggestion below) */}
                  {it.box && (
                    <S.BoxChip title={it.box.name || it.box.box_id}>
                      {it.box.shortId || it.box.box_id || '—'}
                      {it.box.name ? ` · ${it.box.name}` : ''}
                    </S.BoxChip>
                  )}

                  {/* Created/Updated—render only if provided */}
                  {created && (
                    <S.Micro>Added {created.toLocaleDateString()}</S.Micro>
                  )}
                  {updated && (
                    <S.Micro>· Updated {updated.toLocaleDateString()}</S.Micro>
                  )}
                </S.MetaRow>
              )}
            </S.Meta>
          </S.Chip>
        );
      })}
    </S.Row>
  );
}

export default memo(ItemRowBase);
