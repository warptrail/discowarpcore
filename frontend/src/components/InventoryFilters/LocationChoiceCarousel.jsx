import { useRef, useState } from 'react';
import LocationOptionIcon from './LocationOptionIcon';
import useLoopingLocationCarousel from './useLoopingLocationCarousel';
import useCarouselWallLabel from './useCarouselWallLabel';
import * as S from './LocationLayerStack.styles';

export default function LocationChoiceCarousel({ choices, tier, selected, onSelect, carouselRef, hasClear }) {
  const mainRef = useRef(null);
  const labelRef = useRef(null);
  const [focusKey, setFocusKey] = useState(null);
  const signature = JSON.stringify(choices.map(({ key }) => key));
  const { looping, goToIndex: _goToIndex, ...events } = useLoopingLocationCarousel(carouselRef, mainRef, signature);
  const position = useCarouselWallLabel(carouselRef, labelRef, signature, looping);
  const selectMirror = (key) => {
    [...mainRef.current.querySelectorAll('button')].find((button) => button.dataset.choiceKey === key)?.focus({ preventScroll: true });
    onSelect(key);
  };
  const cycle = (mirror) => <S.Cycle ref={mirror ? undefined : mainRef} aria-hidden={mirror ? 'true' : undefined} data-canonical={mirror ? undefined : 'true'}>
    {choices.map(({ key, label }) => <S.Choice key={key} as={mirror ? 'span' : 'button'} type={mirror ? undefined : 'button'}
      data-choice-key={key} data-keyboard-current={focusKey === key ? 'true' : undefined}
      aria-label={mirror ? undefined : label} title={`${tier.label}: ${label}`} aria-pressed={selected.includes(key)}
      onClick={() => mirror ? selectMirror(key) : onSelect(key)}>
      <LocationOptionIcon tier={tier.key} label={label} />
      <span>{label}</span>
    </S.Choice>)}
  </S.Cycle>;

  return <S.CarouselShell $hasClear={hasClear}>
    <S.WallLabel ref={labelRef} aria-hidden="true" style={{ left: position.x, top: position.y, maxWidth: position.width }}>{tier.key === 'room' ? 'Rooms' : tier.label}</S.WallLabel>
    <S.Carousel ref={carouselRef} role="group" aria-label={`Filter by ${tier.label.toLowerCase()}`} data-looping={looping ? 'true' : 'false'} {...events}
      onFocusCapture={(event) => setFocusKey(event.target.matches(':focus-visible') ? event.target.dataset.choiceKey : null)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusKey(null); }}>
      <S.Track>
        {/* Mirrors complete the visual loop; only canonical buttons enter keyboard/assistive navigation. */}
        {looping ? cycle(true) : null}
        {cycle(false)}
        {looping ? cycle(true) : null}
      </S.Track>
      {!choices.length ? <S.Empty>No {tier.label.toLowerCase()} options available</S.Empty> : null}
    </S.Carousel>
  </S.CarouselShell>;
}
