import ItemThumbnailMedia from '../ItemThumbnailMedia';
import CompactTagRow from '../Tags/CompactTagRow';
import MissingStatus from '../MissingItems/MissingStatus';
import * as S from './Retrieval.styles';
import RetrievalCompactSummary from './RetrievalCompactSummary';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../../util/inventoryColorTheme';

function shouldSkipRowToggle(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, [data-thumb-surface="true"]'));
}

export default function RetrievalResultRow({
  item,
  isExpanded = false,
  onToggle,
  onPreviewImage,
  compact = false,
  smallCard = false,
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
  const boxNumber = String(item?.placementLabel || item?.boxNumber || '').trim();
  const locationLabel = String(item?.locationLabel || '').trim();
  const hasKnownLocation =
    Boolean(locationLabel) && !/^unknown/i.test(locationLabel);
  const hasKnownBox = Boolean(boxNumber) || Boolean(boxName);
  const boxTheme = getBoxTheme(boxNumber);
  const boxThemeStyle = getBoxThemeCssVars(boxTheme);
  const boxSummary = hasKnownBox
    ? `${boxNumber ? `#${boxNumber}` : ''}${boxNumber && boxName ? ' · ' : ''}${boxName}`
    : 'Orphaned';
  const locationSummary = hasKnownLocation ? locationLabel : 'Unknown';
  const tagPreview = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean).map((tag) => `#${tag}`).join(' ')
    : '';
  const compactMeta = [
    item?.categoryKey && item?.categoryKey !== 'uncategorized'
      ? String(item.categoryLabel || '').trim()
      : '',
    String(item?.keepPriority || '').trim()
      ? String(item.keepPriorityLabel || '').trim()
      : '',
  ].filter(Boolean);

  const hasImage = Boolean(imageUrl);

  const handleThumbClick = (event) => {
    event.stopPropagation();
    if (!hasImage) return;
    if (typeof onPreviewImage === 'function') {
      onPreviewImage({ src: previewImageUrl, name: item.name });
    }
  };

  const thumbnail = hasImage ? (
    <S.ThumbPreviewButton type="button" onClick={handleThumbClick}
      aria-label={`Preview image for ${item.name}`} data-thumb-surface="true">
      <ItemThumbnailMedia item={item} sources={[imageUrl]} imageAs={S.ThumbImage} alt={`${item.name} thumbnail`} />
    </S.ThumbPreviewButton>
  ) : (
    <S.ThumbFrame data-thumb-surface="true">
      <ItemThumbnailMedia item={item} sources={[]} />
    </S.ThumbFrame>
  );

  return (
    <S.ResultCard
      id={`retrieval-result-${item.id}`}
      $expanded={isExpanded}
      $docked
      $compact={compact}
      style={boxThemeStyle}
    >
      {compact ? (
        <S.AsciiResultButton
          type="button"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-label={`${isExpanded ? 'Close' : 'Open'} item panel for ${item.name}`}
        >
          <S.AsciiBranch aria-hidden="true">{isExpanded ? '└─' : '├─'}</S.AsciiBranch>
          <S.AsciiItemName>{item.name}</S.AsciiItemName><MissingStatus item={item} home />
          <S.AsciiPlacement aria-hidden="true">
            {' · '}{hasKnownBox ? boxSummary : 'NO BOX'}{' @ '}{locationSummary}
          </S.AsciiPlacement>
          <S.AsciiDisclosure aria-hidden="true">{isExpanded ? '−' : '+'}</S.AsciiDisclosure>
        </S.AsciiResultButton>
      ) : (
      <S.SummaryButton
        onClick={handleSummaryClick}
        onKeyDown={handleSummaryKeyDown}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={`${isExpanded ? 'Close' : 'Open'} item panel for ${item.name}`}
        title={smallCard ? item.name : undefined}
        aria-description={smallCard ? `${boxSummary} · Location: ${locationSummary}` : undefined}
        role="button"
        tabIndex={0}
      >
        {smallCard ? <RetrievalCompactSummary thumbnail={thumbnail} boxNumber={boxNumber}
          status={<MissingStatus item={item} home />} name={item.name} location={locationSummary} boxTitle={boxSummary} /> : <S.SummaryTop>
          <S.RowMain>
            {thumbnail}

            <S.BadgeStack $hasTags={Boolean(tagPreview)}>
              <S.ItemLineSlot>
                <S.ItemLine>{item.name}</S.ItemLine><MissingStatus item={item} home />
              </S.ItemLineSlot>

              {compactMeta.length ? (
                <S.CompactMetaLine aria-label="Item metadata">
                  {compactMeta.map((label) => <span key={label}>{label}</span>)}
                </S.CompactMetaLine>
              ) : null}

              <S.CollapsedPlacementTable>
                  <S.CollapsedBoxName title={item.placementTrail || boxSummary}>{boxName || (hasKnownBox ? 'Box' : 'Items Adrift')}</S.CollapsedBoxName>
                  <S.CollapsedLocationValue $unknown={!hasKnownLocation} title={`Location: ${locationSummary}`}>
                    {locationSummary}
                  </S.CollapsedLocationValue>
                  {item.placementTrail?.includes(' > ') ? <S.CompactMetaLine title={item.placementTrail}>{item.placementTrail}</S.CompactMetaLine> : null}
                  {tagPreview ? (
                    <S.CollapsedTagPreview aria-label={`Item tags: ${tagPreview}`} title={tagPreview}>
                      <CompactTagRow tags={item.tags} name={item.name || 'item'} />
                    </S.CollapsedTagPreview>
                  ) : null}
              </S.CollapsedPlacementTable>
            </S.BadgeStack>
            <S.RowBoxNumber aria-label={boxNumber ? `Box ${boxNumber}` : 'No box assigned'} title={boxSummary}>
                {boxNumber || '—'}
            </S.RowBoxNumber>
          </S.RowMain>

        </S.SummaryTop>}
      </S.SummaryButton>
      )}

    </S.ResultCard>
  );
}
