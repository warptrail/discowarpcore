import SectionBadge from '../BoxForms/SectionBadge';
import CompactTagRow from '../Tags/CompactTagRow';
import MissingBoxStatus from '../MissingItems/MissingBoxStatus';
import * as S from './Retrieval.styles';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import RetrievalBoxThumbnail from './RetrievalBoxThumbnail';
import RetrievalCompactSummary from './RetrievalCompactSummary';

function formatCount(count, singular, plural) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

export default function RetrievalBoxResultRow({ box, isActive, onSelect, isMobile, panelId, presentation = 'cards' }) {
  const tones = getBoxTheme(box.boxId);
  const props = {
    type: 'button',
    onClick: onSelect,
    style: getBoxThemeCssVars(tones),
    'aria-label': `Inspect box ${box.address || box.boxId}, ${box.boxLabel}`,
    'aria-description': `Location: ${box.locationLabel || 'Unknown'}`,
    'aria-expanded': isMobile ? isActive : undefined,
    'aria-controls': isMobile ? panelId : undefined,
    'aria-pressed': !isMobile ? isActive : undefined,
    'data-retrieval-box-result': box.address || box.boxId,
  };
  if (presentation === 'ascii') {
    return <S.AsciiResultButton {...props} $expanded={isActive}>
      <S.AsciiBranch aria-hidden="true">{isActive ? '└─' : '├─'}</S.AsciiBranch>
      <S.AsciiItemName>#{box.boxId} · {box.boxLabel}</S.AsciiItemName><MissingBoxStatus box={box} />
      <S.AsciiPlacement title={box.locationLabel || 'Unknown'}>{box.kind === 'cabinet' ? `Section · in #${box.boxId} · ${box.shelfCount} shelves` : box.locationLabel || 'Unknown'}</S.AsciiPlacement>
      <S.AsciiDisclosure aria-hidden="true">{isActive ? '−' : '+'}</S.AsciiDisclosure>
    </S.AsciiResultButton>;
  }
  const smallCard = presentation === 'compact';
  const cardProps = { ...props }; delete cardProps.type;
  return <S.BoxListRow {...cardProps} as="div" role="button" tabIndex={0} onKeyDown={event => {
    if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect(); }
  }} $active={isActive} $smallCard={smallCard}
    $boxColorRgb={tones.baseRgb} $boxMutedRgb={tones.mutedRgb} title={smallCard ? box.boxLabel : undefined}>
    {smallCard ? <RetrievalCompactSummary thumbnail={<RetrievalBoxThumbnail box={box} compact />}
      status={<MissingBoxStatus box={box} />} name={box.boxLabel} boxNumber={box.address || box.boxId} location={box.kind === "cabinet" ? `Section · in #${box.boxId} · ${box.shelfCount} shelves` : box.locationLabel} boxTitle={box.boxLabel} /> : <>
      <RetrievalBoxThumbnail box={box} />
      <S.BoxRowCopy>
        <S.BoxRowLabel $section={box.kind === "cabinet"}>{box.boxLabel}{box.kind === 'cabinet' ? <> · <SectionBadge compartmentKey={box.compartmentKey} /></> : box.isComplexBox ? ' · Complex box' : ''}</S.BoxRowLabel><MissingBoxStatus box={box} />
        <S.BoxRowLocation $boxLocationRgb={tones.locationRgb}>
          <strong>{box.locationLabel || 'Unknown'}</strong>
        </S.BoxRowLocation>
        {box.tags.length ? <S.BoxRowTags title={box.tags.map(tag => `#${tag}`).join(' ')}>
          <CompactTagRow tags={box.tags} name={box.boxLabel} boxId={box.boxId} />
        </S.BoxRowTags> : null}
        <S.BoxRowMeta>
          {box.kind === "cabinet" ? <span>In #{box.boxId} {box.ownerBoxLabel} · {box.shelfCount} shelves · {box.scopedItemCount} contents</span> : null}
          <span>{box.kind === 'cabinet' ? `${box.directItemCount} directly placed` : formatCount(box.directItemCount, 'item', 'items')}</span>
          {box.childBoxCount > 0 ? <span>· {formatCount(box.childBoxCount, box.kind === 'cabinet' ? 'nested box' : 'child box', box.kind === 'cabinet' ? 'nested boxes' : 'child boxes')}</span> : null}
        </S.BoxRowMeta>
      </S.BoxRowCopy>
      <S.RowBoxNumber aria-label={`Box ${box.address || box.boxId}`}>{box.address || box.boxId || '—'}</S.RowBoxNumber>
    </>}
  </S.BoxListRow>;
}
