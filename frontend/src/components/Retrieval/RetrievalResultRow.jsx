import * as S from './Retrieval.styles';
import RetrievalExpandedPanel from './RetrievalExpandedPanel';

function shouldSkipRowToggle(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, [data-thumb-surface="true"], [data-expand-toggle="true"]'));
}

export default function RetrievalResultRow({
  item,
  isExpanded = false,
  onToggle,
  onPreviewImage,
  onLifecycleAction,
}) {
  if (!item) return null;
  const panelId = `retrieval-row-panel-${item.id}`;

  const handleToggle = () => {
    if (typeof onToggle === 'function') onToggle(item.id);
  };

  const handleSummaryClick = (event) => {
    if (shouldSkipRowToggle(event.target)) return;
    handleToggle();
  };

  const handleSummaryKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (shouldSkipRowToggle(event.target)) return;
    event.preventDefault();
    handleToggle();
  };

  const imageUrl = String(item?.imageUrl || '').trim();
  const previewImageUrl = String(item?.previewImageUrl || imageUrl).trim();
  const boxName = String(item?.boxName || '').trim();
  const boxNumber = String(item?.boxNumber || '').trim();
  const locationLabel = String(item?.locationLabel || '').trim();
  const locationPath = String(item?.locationPath || '').trim();
  const ownerName = String(item?.primaryOwnerName || '').trim();
  const shortBoxName = boxName.length > 34 ? `${boxName.slice(0, 33).trimEnd()}…` : boxName;
  const unresolved =
    !boxNumber ||
    !boxName ||
    !locationLabel ||
    /^unknown/i.test(locationLabel) ||
    /^unknown/i.test(locationPath);
  const hasImage = Boolean(imageUrl);

  const handleThumbClick = (event) => {
    event.stopPropagation();
    if (!hasImage) return;
    if (typeof onPreviewImage === 'function') {
      onPreviewImage({ src: previewImageUrl, name: item.name });
    }
  };

  return (
    <S.ResultCard $expanded={isExpanded}>
      <S.SummaryButton
        onClick={handleSummaryClick}
        onKeyDown={handleSummaryKeyDown}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} box context for ${item.name}`}
        role="button"
        tabIndex={0}
        $expanded={isExpanded}
      >
        <S.SummaryTop>
          <S.RowMain $expanded={isExpanded}>
            {!isExpanded ? (
              hasImage ? (
                <S.ThumbPreviewButton
                  type="button"
                  onClick={handleThumbClick}
                  aria-label={`Preview image for ${item.name}`}
                  data-thumb-surface="true"
                >
                  <S.ThumbImage src={imageUrl} alt={`${item.name} thumbnail`} loading="lazy" />
                </S.ThumbPreviewButton>
              ) : (
                <S.ThumbFrame data-thumb-surface="true">
                  <S.ThumbPlaceholder>No Image</S.ThumbPlaceholder>
                </S.ThumbFrame>
              )
            ) : (
              <S.ExpandedRowMarker aria-hidden="true" />
            )}

            <S.BadgeStack>
              <S.ItemLineSlot>
                {item.itemHref ? (
                  <S.ItemLineLink
                    to={item.itemHref}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {item.name}
                  </S.ItemLineLink>
                ) : (
                  <S.ItemLine>{item.name}</S.ItemLine>
                )}
              </S.ItemLineSlot>

              <S.LocatorPathLine title={locationPath || locationLabel}>
                {unresolved
                  ? 'No box assigned · Needs placement'
                  : `In: ${locationPath || locationLabel}`}
              </S.LocatorPathLine>

              {unresolved ? (
                <S.UnresolvedHint>Unresolved location</S.UnresolvedHint>
              ) : (
                <S.BoxAnchorLine title={`${boxNumber ? `#${boxNumber}` : ''} ${boxName}`.trim()}>
                  <S.BoxAnchorId>{`#${boxNumber}`}</S.BoxAnchorId>
                  <S.BoxAnchorDivider />
                  <S.BoxAnchorSnippet>{shortBoxName || 'Unnamed box'}</S.BoxAnchorSnippet>
                </S.BoxAnchorLine>
              )}

              <S.LocatorMetaLine>
                {locationLabel ? (
                  <S.LocatorMetaText title={`Room: ${locationLabel}`}>Room: {locationLabel}</S.LocatorMetaText>
                ) : null}
                {ownerName ? (
                  <S.LocatorMetaText title={`Owner: ${ownerName}`}>Owner: {ownerName}</S.LocatorMetaText>
                ) : null}
              </S.LocatorMetaLine>
            </S.BadgeStack>
          </S.RowMain>

          <S.ExpandControl
            as="button"
            type="button"
            data-expand-toggle="true"
            onClick={(event) => {
              event.stopPropagation();
              handleToggle();
            }}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={isExpanded ? 'Hide quick details' : 'Show quick details'}
            $expanded={isExpanded}
          >
            <S.ExpandCaret aria-hidden="true">{isExpanded ? '▾' : '▸'}</S.ExpandCaret>
            <S.CardOpenHint>{isExpanded ? 'Hide' : 'Quick view'}</S.CardOpenHint>
          </S.ExpandControl>
        </S.SummaryTop>
      </S.SummaryButton>

      {isExpanded ? (
        <RetrievalExpandedPanel
          item={item}
          panelId={panelId}
          onLifecycleAction={onLifecycleAction}
          onPreviewImage={onPreviewImage}
        />
      ) : null}
    </S.ResultCard>
  );
}
