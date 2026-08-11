import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as S from '../styles/ItemPage.styles';
import { getItemOwnershipContext } from '../util/itemOwnership';
import HomeCommandIcon from './HomeCommandIcon';
import { getOperationsReturnNavigation } from '../util/operationsReturnPosition';

function buildBaseBreadcrumb(item, itemId) {
  const safeItemName = String(item?.name || 'Unnamed Item').trim() || 'Unnamed Item';
  const safeItemId = String(item?._id || itemId || '').trim();
  const home = { kind: 'link', to: '/', label: 'Home' };
  const nodes = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const ownership = getItemOwnershipContext(item);

  if (String(item?.item_status || '').trim().toLowerCase() === 'gone') {
    return [
      home,
      {
        key: 'no-longer-have',
        kind: 'link',
        to: '/declutter/history?filter=physically_completed',
        label: 'No Longer Have',
      },
      {
        key: 'item-current',
        kind: 'current',
        label: safeItemName || safeItemId || 'Item',
      },
    ];
  }

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
    { key: 'orphaned', kind: 'link', to: '/all-items', label: 'Items Adrift' },
    {
      key: 'item-current',
      kind: 'current',
      label: safeItemName || safeItemId || 'Item',
    },
  ];
}

function buildBreadcrumb(item, itemId, routeReturn) {
  const parts = buildBaseBreadcrumb(item, itemId);
  if (routeReturn?.kind === 'box-detail-item') {
    const sourceBoxId = String(routeReturn.boxId || '').trim();
    const returnTo = String(routeReturn.returnTo || '').trim() || '/boxes';
    const sourceBoxIndex = parts.findIndex((part) => part.boxId === sourceBoxId);
    if (sourceBoxIndex >= 0) {
      return parts.map((part, index) => (
        index === sourceBoxIndex
          ? {
            ...part,
            kind: 'return',
            returnKind: 'box-detail-item',
            to: returnTo,
          }
          : part
      ));
    }

    return [
      parts[0],
      {
        key: 'box-detail-return',
        kind: 'return',
        returnKind: 'box-detail-item',
        to: returnTo,
        label: routeReturn.boxLabel
          ? `Box · ${routeReturn.boxLabel}`
          : `Box${sourceBoxId ? ` · #${sourceBoxId}` : ''}`,
      },
      ...parts.slice(1),
    ];
  }

  if (routeReturn?.kind !== 'retrieval-item') return parts;

  return [
    parts[0],
    {
      key: 'retrieval-return',
      kind: 'return',
      returnKind: 'retrieval-item',
      to: String(routeReturn.returnTo || '/retrieval').trim() || '/retrieval',
      label: 'Retrieval',
    },
    ...parts.slice(1),
  ];
}

function BreadcrumbPart({ part, onReturnHome, onReturnRetrieval, onReturnBox }) {
  const content = (
    <>
      {part.label === 'Home' ? (
        <HomeCommandIcon size="1.15rem" alt="" aria-hidden="true" />
      ) : (
        <>
          {part.boxId ? <S.CrumbId>{part.boxId}</S.CrumbId> : null}
          <S.CrumbLabel>{part.label}</S.CrumbLabel>
        </>
      )}
    </>
  );

  if (part.kind === 'link' && part.to) {
    return (
      <S.BreadcrumbLink
        to={part.to}
        title={part.label}
        onClick={part.label === 'Home' ? onReturnHome : undefined}
      >
        {content}
      </S.BreadcrumbLink>
    );
  }

  if (part.kind === 'return' && part.to) {
    return (
      <S.BreadcrumbLink
        to={part.to}
        title={part.returnKind === 'box-detail-item' ? 'Return to box' : 'Return to Retrieval'}
        onClick={part.returnKind === 'box-detail-item' ? onReturnBox : onReturnRetrieval}
      >
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

export default function ItemPageBreadcrumb({ item, itemId, compact = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeReturn = location.state?.boxReturn || location.state?.retrievalReturn;
  const parts = useMemo(
    () => buildBreadcrumb(item, itemId, routeReturn),
    [item, itemId, routeReturn],
  );
  const handleReturnHome = (event) => {
    const destination = getOperationsReturnNavigation();
    if (!destination) return;
    event.preventDefault();
    navigate(destination.to, {
      state: destination.state,
      preventScrollReset: true,
    });
  };
  const handleReturnRetrieval = (event) => {
    event.preventDefault();
    navigate(-1);
  };
  const handleReturnBox = (event) => {
    event.preventDefault();
    navigate(-1);
  };

  return (
    <S.BreadcrumbNav aria-label="Item breadcrumb" $compact={compact}>
      {parts.map((part, index) => (
        <React.Fragment key={part.key || `${part.label}-${index}`}>
          <BreadcrumbPart
            part={part}
            onReturnHome={handleReturnHome}
            onReturnRetrieval={handleReturnRetrieval}
            onReturnBox={handleReturnBox}
          />
          {index < parts.length - 1 ? <S.CrumbSep>›</S.CrumbSep> : null}
        </React.Fragment>
      ))}
    </S.BreadcrumbNav>
  );
}
