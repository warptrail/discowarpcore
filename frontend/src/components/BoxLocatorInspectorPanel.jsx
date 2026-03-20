import React from 'react';
import * as S from '../styles/InventoryGridHeader.styles';

export default function BoxLocatorInspectorPanel({
  selection = null,
  details = null,
  loading = false,
  error = '',
  onClearSelection,
}) {
  const selectedTree = details?.tree || null;
  const selectedBoxId = normalizeBoxId(selection?.boxId || selectedTree?.box_id);

  if (!selectedBoxId) return null;

  const selectedLabel = String(
    selectedTree?.label || selection?.label || 'Selected Box',
  ).trim();
  const directItems = Array.isArray(selectedTree?.items) ? selectedTree.items : [];
  const childBoxes = Array.isArray(selectedTree?.childBoxes)
    ? selectedTree.childBoxes
    : [];
  const breadcrumb = buildBreadcrumb(details, {
    boxId: selectedBoxId,
    label: selectedLabel,
  });

  const renderDirectItems = () => {
    if (loading) {
      return <S.LocatorStatusText>Loading box contents...</S.LocatorStatusText>;
    }

    if (error) {
      return <S.LocatorStatusText>{error}</S.LocatorStatusText>;
    }

    if (!selectedTree || directItems.length === 0) {
      return <S.LocatorEmptyBlock>No direct items in this box.</S.LocatorEmptyBlock>;
    }

    return (
      <S.LocatorList>
        {directItems.map((item) => {
          const itemId = String(item?._id || item?.id || '').trim();
          if (!itemId) return null;

          const itemName = String(item?.name || 'Untitled Item').trim();
          const quantity = Number(item?.quantity);
          const quantityLabel = Number.isFinite(quantity) ? `Qty ${quantity}` : '';
          const categoryLabel = String(item?.category || '').trim();
          const meta = [quantityLabel, categoryLabel].filter(Boolean).join(' • ');

          return (
            <S.LocatorRow key={`item-${itemId}`} $kind="item">
              <S.LocatorRowLink to={`/items/${itemId}`}>
                <S.LocatorRowTitle>{itemName}</S.LocatorRowTitle>
                {meta ? <S.LocatorRowMeta>{meta}</S.LocatorRowMeta> : null}
              </S.LocatorRowLink>
            </S.LocatorRow>
          );
        })}
      </S.LocatorList>
    );
  };

  const renderChildBoxes = () => {
    if (loading) {
      return <S.LocatorStatusText>Loading child boxes...</S.LocatorStatusText>;
    }

    if (error) {
      return null;
    }

    if (!selectedTree || childBoxes.length === 0) {
      return <S.LocatorEmptyBlock>No direct child boxes.</S.LocatorEmptyBlock>;
    }

    return (
      <S.LocatorList>
        {childBoxes.map((child) => {
          const childBoxId = normalizeBoxId(child?.box_id);
          if (!childBoxId) return null;

          const childLabel = String(child?.label || child?.name || 'Untitled Box').trim();
          const childItemCount = Array.isArray(child?.items) ? child.items.length : 0;
          const nestedBoxCount = Array.isArray(child?.childBoxes)
            ? child.childBoxes.length
            : 0;
          const childMeta = [
            `${childItemCount} ${childItemCount === 1 ? 'item' : 'items'}`,
            `${nestedBoxCount} ${nestedBoxCount === 1 ? 'child box' : 'child boxes'}`,
          ].join(' • ');

          return (
            <S.LocatorRow key={`child-${childBoxId}`} $kind="box">
              <S.LocatorRowLink to={`/boxes/${childBoxId}`}>
                <S.LocatorRowTitle>
                  #{childBoxId} - {childLabel}
                </S.LocatorRowTitle>
                <S.LocatorRowMeta>{childMeta}</S.LocatorRowMeta>
              </S.LocatorRowLink>
            </S.LocatorRow>
          );
        })}
      </S.LocatorList>
    );
  };

  return (
    <S.LocatorInspector role="region" aria-label="Box locator results">
      <S.LocatorInspectorHeader>
        <S.LocatorInspectorTitle>
          <S.LocatorInspectorTitleLink to={`/boxes/${selectedBoxId}`}>
            #{selectedBoxId} - {selectedLabel || 'Selected Box'}
          </S.LocatorInspectorTitleLink>
        </S.LocatorInspectorTitle>
        <S.LocatorInspectorClear type="button" onClick={() => onClearSelection?.()}>
          Clear
        </S.LocatorInspectorClear>
      </S.LocatorInspectorHeader>

      {breadcrumb.length > 1 ? (
        <S.LocatorBreadcrumb aria-label="Box breadcrumb">
          {breadcrumb.map((segment, index) => {
            const segmentBoxId = normalizeBoxId(segment?.boxId);
            const segmentLabel = String(segment?.label || `#${segmentBoxId}`).trim();
            const isLast = index === breadcrumb.length - 1;

            return (
              <React.Fragment key={`${segmentBoxId || 'segment'}-${index}`}>
                {isLast ? (
                  <S.LocatorBreadcrumbCurrent>{segmentLabel}</S.LocatorBreadcrumbCurrent>
                ) : (
                  <S.LocatorBreadcrumbLink to={`/boxes/${segmentBoxId}`}>
                    {segmentLabel}
                  </S.LocatorBreadcrumbLink>
                )}
                {!isLast ? <S.LocatorBreadcrumbSep>{'>'}</S.LocatorBreadcrumbSep> : null}
              </React.Fragment>
            );
          })}
        </S.LocatorBreadcrumb>
      ) : null}

      <S.LocatorInspectorBody>
        <S.LocatorSection>
          <S.LocatorSectionTitle>
            Direct Items ({loading ? '-' : directItems.length})
          </S.LocatorSectionTitle>
          {renderDirectItems()}
        </S.LocatorSection>

        <S.LocatorSection>
          <S.LocatorSectionTitle>
            Child Boxes ({loading ? '-' : childBoxes.length})
          </S.LocatorSectionTitle>
          {renderChildBoxes()}
        </S.LocatorSection>
      </S.LocatorInspectorBody>
    </S.LocatorInspector>
  );
}

function buildBreadcrumb(details, selection) {
  const segments = [];
  const ancestors = Array.isArray(details?.ancestors) ? details.ancestors : [];

  for (const ancestor of ancestors) {
    const boxId = normalizeBoxId(ancestor?.box_id);
    if (!boxId) continue;
    segments.push({
      boxId,
      label: String(ancestor?.label || `#${boxId}`).trim(),
    });
  }

  const selectedBoxId = normalizeBoxId(selection?.boxId);
  if (selectedBoxId) {
    const selectedLabel = String(selection?.label || `#${selectedBoxId}`).trim();
    const alreadyIncluded = segments.some((segment) => segment.boxId === selectedBoxId);
    if (!alreadyIncluded) {
      segments.push({
        boxId: selectedBoxId,
        label: selectedLabel,
      });
    }
  }

  return segments;
}

function normalizeBoxId(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .trim();
}
