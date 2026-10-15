import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOperationsItemPeekNavigation } from '../../util/operationsItemNavigation';
import { getFinderItemNavigation } from '../../util/finderItemNavigation';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { getItemMicroThumbnailCandidates } from '../../util/itemImage';
import useLoopingCarousel from '../Carousel/useLoopingCarousel';
import useAnswerCarouselDepth from './useAnswerCarouselDepth';
import SearchHighlight from '../SearchHighlight';
import { getSearchTerms, getSearchExcerpt } from '../../util/searchHighlight';
import { getAnswerMatchFields } from './answerMatchFields';
import * as S from './QuickAnswerCarousel.styles';
import FinderMatchFrame from './FinderMatchFrame';

function ItemThumbnail({ item }) {
  const candidates = getItemMicroThumbnailCandidates(item);
  const [attempt, setAttempt] = useState(0);
  return <S.Thumbnail>
    {candidates[attempt] ? <img src={candidates[attempt]} alt="" draggable={false} loading="lazy" decoding="async" onError={() => setAttempt((index) => index + 1)} />
      : <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m4 17 5-5 4 4 3-3 4 4" /><circle cx="15" cy="8" r="2" /></svg>}
  </S.Thumbnail>;
}

export default function QuickAnswerCarousel({ answers, query = '', index = 0, onSelect, focusOpen = false }) {
  const viewRef = useRef(null);
  const mainRef = useRef(null);
  const route = useLocation();
  const navigate = useNavigate();
  const terms = getSearchTerms(query);
  const signature = answers.map(({ id }) => id).join('|');
  const { looping, goToIndex, ...events } = useLoopingCarousel(viewRef, mainRef, signature, { itemSelector: '[data-carousel-item]', centered: true, gap: 8, alwaysLoop: answers.length > 1, activeIndex: index });
  useAnswerCarouselDepth(viewRef, signature, looping, onSelect);
  const wasFocused = useRef(focusOpen);
  useLayoutEffect(() => {
    // Reveal the last expanded match on collapse without changing normal swipe motion.
    if (wasFocused.current && !focusOpen) goToIndex(index, { behavior: 'instant' });
    wasFocused.current = focusOpen;
  }, [focusOpen, index, goToIndex]);
  const step = (direction) => {
    if (answers.length < 2) return;
    const next = (index + direction + answers.length) % answers.length;
    goToIndex(next, { fromIndex: index, direction });
    onSelect(next);
  };
  const cycle = (mirror) => <S.Cycle ref={mirror ? undefined : mainRef} aria-hidden={mirror || undefined} data-canonical={mirror ? undefined : 'true'}>
    {answers.map((answer, answerIndex) => {
      const location = answer.path.length ? answer.path.join(' › ') : 'Location not recorded';
      const fields = getAnswerMatchFields(answer, query);
      const hint = fields[0];
      const itemNavigation = getFinderItemNavigation({ search: route.search, state: route.state, itemId: answer.id });
      const boxNavigation = getOperationsItemPeekNavigation({ search: route.search, state: route.state, boxId: answer.boxId });
      return <S.Card key={answer.id} data-answer-visual data-answer-index={answerIndex} style={getBoxThemeCssVars(getBoxTheme(answer.boxId))}>
        <S.ItemLink {...(mirror ? { as: 'span', onClick: () => navigate(itemNavigation.to, { state: itemNavigation.state }) } : itemNavigation)}
          draggable={false} data-carousel-item={mirror ? undefined : 'true'} aria-label={mirror ? undefined : `Locate ${answer.name}`} aria-haspopup={mirror ? undefined : 'dialog'}
          aria-description={!mirror && fields.length ? `Keyword matched in ${fields.map(({ label }) => label.toLowerCase()).join(', ')}` : undefined}
          aria-current={!mirror && answerIndex === index ? 'true' : undefined} title={answer.name}>
          <ItemThumbnail key={getItemMicroThumbnailCandidates(answer.item)[0] || answer.id} item={answer.item} />
          <S.Details>
            <S.Name $hasHint={!!hint}><SearchHighlight text={answer.name} terms={terms} /></S.Name>
            <S.BoxName title={answer.boxLabel}><SearchHighlight text={answer.boxLabel || (answer.unboxed ? 'Items Adrift' : 'Box name not recorded')} terms={terms} /></S.BoxName>
            <S.Path title={location}><SearchHighlight text={location} terms={terms} /></S.Path>
            {hint ? <S.MatchHint title={fields.map(({ label, value }) => `${label}: ${value}`).join('\n')} aria-label={`Keyword matched in ${fields.map(({ label }) => label.toLowerCase()).join(', ')}`}>
              <b>{hint.label}:</b> <SearchHighlight text={getSearchExcerpt(hint.value, terms, { length: 48, context: 0 })} terms={terms} />
            </S.MatchHint> : null}
          </S.Details>
        </S.ItemLink>
        {answer.boxId ? <S.BoxLink {...(mirror ? { as: 'span', onClick: () => navigate(boxNavigation.to, { state: boxNavigation.state }) } : boxNavigation)} draggable={false} aria-label={mirror ? undefined : `Open box ${answer.boxId}`} title={`Open box ${answer.boxId}`}>#<SearchHighlight text={answer.boxId} terms={terms} /></S.BoxLink> : null}
      </S.Card>;
    })}
  </S.Cycle>;
  return <FinderMatchFrame index={index} total={answers.length} onStep={step}>
    <S.Viewport ref={viewRef} id="operations-match-carousel" data-looping={looping ? 'true' : 'false'} {...events} onDragStart={(event) => event.preventDefault()}>
      <S.Track $looping={looping}>{looping ? cycle(true) : null}{cycle(false)}{looping ? cycle(true) : null}</S.Track>
    </S.Viewport>
  </FinderMatchFrame>;
}
