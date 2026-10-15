import * as S from './QuickAnswerCarousel.styles';

// One finder frame and navigation pair for the compact and expanded item views.
export default function FinderMatchFrame({ children, index, total, onStep, expanded = false, onClose }) {
  return <S.Shell $expanded={expanded} aria-label={expanded ? 'Expanded matching item finder' : 'Matching item carousel'} aria-roledescription="carousel">
    <S.Heading><span>Item finder</span><S.Counter role="status" aria-live="polite">{index >= 0 ? index + 1 : '—'} / {total}</S.Counter>
      {onClose ? <S.CloseButton type="button" aria-label="Close item focus" title="Collapse item finder" onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </S.CloseButton> : null}
    </S.Heading>
    <S.Arrow $expanded={expanded} type="button" aria-label="Previous matching item" title="Previous matching item" disabled={index < 0 || total < 2} onClick={() => onStep(-1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7" /></svg>
    </S.Arrow>
    {children}
    {!expanded && total > 1 ? <S.CarouselEdges data-carousel-edges aria-hidden="true" /> : null}
    <S.Arrow $expanded={expanded} type="button" aria-label="Next matching item" title="Next matching item" disabled={index < 0 || total < 2} onClick={() => onStep(1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 5 7 7-7 7" /></svg>
    </S.Arrow>
  </S.Shell>;
}
