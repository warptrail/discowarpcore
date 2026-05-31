import * as S from './Retrieval.styles';
import RetrievalExpandedPanel from './RetrievalExpandedPanel';
import { getBoxColorTones } from './boxColors';

function shouldSkipRowToggle(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'a, button, [data-thumb-surface="true"], [data-expand-toggle="true"]',
    ),
  );
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
  const hasKnownLocation =
    Boolean(locationLabel) && !/^unknown/i.test(locationLabel);
  const hasKnownBox = Boolean(boxNumber) || Boolean(boxName);
  const boxColorTones = getBoxColorTones(boxNumber || 0);
  const boxSummary = hasKnownBox
    ? `${boxNumber ? `#${boxNumber}` : ''}${boxNumber && boxName ? ' · ' : ''}${boxName}`
    : 'Orphaned';
  const locationSummary = hasKnownLocation ? locationLabel : 'Unknown';

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
                  <S.ThumbImage
                    src={imageUrl}
                    alt={`${item.name} thumbnail`}
                    loading="lazy"
                  />
                </S.ThumbPreviewButton>
              ) : (
                <S.ThumbFrame data-thumb-surface="true">
                  <S.ThumbPlaceholder>No Image</S.ThumbPlaceholder>
                </S.ThumbFrame>
              )
            ) : (
              <S.ExpandedRowMarker aria-hidden="true" />
            )}

            <S.BadgeStack $expanded={isExpanded}>
              <S.ItemLineSlot>
                <S.ItemLine>{item.name}</S.ItemLine>
              </S.ItemLineSlot>

              {!isExpanded ? (
                <S.CollapsedPlacementTable>
                  <S.CollapsedPlacementRow>
                    <S.CollapsedPlacementLabel>Box</S.CollapsedPlacementLabel>
                    <S.CollapsedPlacementValue $stack>
                      <S.CollapsedBoxValueChip
                        title={`Box: ${boxSummary}`}
                        $orphaned={!hasKnownBox}
                        $boxColorRgb={boxColorTones.baseRgb}
                        $boxNeonRgb={boxColorTones.neonRgb}
                        $boxMutedRgb={boxColorTones.mutedRgb}
                      >
                        {boxSummary}
                      </S.CollapsedBoxValueChip>
                    </S.CollapsedPlacementValue>
                  </S.CollapsedPlacementRow>

                  <S.CollapsedPlacementRow>
                    <S.CollapsedPlacementLabel>
                      Location
                    </S.CollapsedPlacementLabel>
                    <S.CollapsedPlacementValue
                      $stack
                      title={`Location: ${locationSummary}`}
                    >
                      <S.CollapsedLocationValue $unknown={!hasKnownLocation}>
                        {locationSummary}
                      </S.CollapsedLocationValue>
                    </S.CollapsedPlacementValue>
                  </S.CollapsedPlacementRow>
                </S.CollapsedPlacementTable>
              ) : null}
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
            aria-label={
              isExpanded ? 'Hide quick details' : 'Show quick details'
            }
            $expanded={isExpanded}
          >
            <S.ExpandCaret aria-hidden="true">
              {isExpanded ? '▾' : '▸'}
            </S.ExpandCaret>
            <S.CardOpenHint>
              {isExpanded ? 'Hide' : 'Quick view'}
            </S.CardOpenHint>
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
