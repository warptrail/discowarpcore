// src/components/ItemRow.jsx
import React from 'react';
import * as S from '../styles/ItemRow.styles'; // your existing styled-components

/**
 * Props:
 * - vm: { id, name, tags[], quantity, notes, parent: { shortId, name, path[] } }
 * - onOpen: (itemId) => void
 * - isOpen?: boolean
 */
export default function ItemRow({ vm, onOpen, isOpen }) {
  if (!vm) return null;

  const breadcrumb = [...(vm.parent?.path || []), vm.parent?.shortId].filter(
    Boolean
  );

  return (
    <S.Row data-open={isOpen ? 'true' : 'false'}>
      <S.Left>
        <S.Title>{vm.name}</S.Title>
        {breadcrumb.length > 0 && (
          <S.Breadcrumb>{breadcrumb.join(' / ')}</S.Breadcrumb>
        )}
        {!!vm.tags?.length && (
          <S.TagRow>
            {vm.tags.map((t) => (
              <S.Tag key={t}>{t}</S.Tag>
            ))}
          </S.TagRow>
        )}
      </S.Left>

      <S.Right>
        {vm.quantity != null && <S.Qty>x{vm.quantity}</S.Qty>}
        <S.OpenBtn onClick={() => onOpen?.(vm.id)}>
          {isOpen ? 'Close' : 'Open'}
        </S.OpenBtn>
      </S.Right>
    </S.Row>
  );
}
