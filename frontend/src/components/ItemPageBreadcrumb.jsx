import React, { useMemo } from 'react';
import * as S from '../styles/ItemPage.styles';
import { getItemOwnershipContext } from '../util/itemOwnership';

function buildBreadcrumb(item, itemId) {
  const safeItemName = String(item?.name || 'Unnamed Item').trim() || 'Unnamed Item';
  const safeItemId = String(item?._id || itemId || '').trim();
  const home = { kind: 'link', to: '/', label: 'Home' };
  const nodes = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const ownership = getItemOwnershipContext(item);

  const breadcrumbBoxes = nodes
    .map((node, index) => {
      const boxId = String(node?.box_id || '').trim();
      const label = String(node?.label || 'Box').trim() || 'Box';
      return {
        key: `${boxId || 'box'}-${index}`,
        kind: boxId ? 'link' : 'text',
        to: boxId ? `/boxes/${encodeURIComponent(boxId)}` : null,
        boxId,
        label,
      };
    })
    .filter((node) => node.label);

  if (breadcrumbBoxes.length > 0) {
    return [
      home,
      ...breadcrumbBoxes,
      {
        key: 'item-current',
        kind: 'current',
        label: safeItemName,
      },
    ];
  }

  const parentBoxId = String(ownership?.boxId || '').trim();
  const parentBoxLabel = String(ownership?.boxLabel || 'Box').trim() || 'Box';

  if (ownership?.isBoxed) {
    return [
      home,
      {
        key: 'parent-box',
        kind: parentBoxId ? 'link' : 'text',
        to: parentBoxId ? `/boxes/${encodeURIComponent(parentBoxId)}` : null,
        boxId: parentBoxId,
        label: parentBoxLabel,
      },
      {
        key: 'item-current',
        kind: 'current',
        label: safeItemName,
      },
    ];
  }

  return [
    home,
    { key: 'orphaned', kind: 'link', to: '/all-items', label: 'Orphaned Items' },
    {
      key: 'item-current',
      kind: 'current',
      label: safeItemName || safeItemId || 'Item',
    },
  ];
}

function BreadcrumbPart({ part }) {
  const content = (
    <>
      {part.boxId ? <S.CrumbId>{part.boxId}</S.CrumbId> : null}
      <S.CrumbLabel>{part.label}</S.CrumbLabel>
    </>
  );

  if (part.kind === 'link' && part.to) {
    return (
      <S.BreadcrumbLink to={part.to} title={part.label}>
        {content}
      </S.BreadcrumbLink>
    );
  }

  if (part.kind === 'current') {
    return (
      <S.BreadcrumbCurrent aria-current="page" title={part.label}>
        {content}
      </S.BreadcrumbCurrent>
    );
  }

  return <S.BreadcrumbText>{content}</S.BreadcrumbText>;
}

export default function ItemPageBreadcrumb({ item, itemId }) {
  const parts = useMemo(() => buildBreadcrumb(item, itemId), [item, itemId]);

  return (
    <S.BreadcrumbNav aria-label="Item breadcrumb">
      {parts.map((part, index) => (
        <React.Fragment key={part.key || `${part.label}-${index}`}>
          <BreadcrumbPart part={part} />
          {index < parts.length - 1 ? <S.CrumbSep>›</S.CrumbSep> : null}
        </React.Fragment>
      ))}
    </S.BreadcrumbNav>
  );
}
