import React, { useEffect, useState } from 'react';

import {
  ActivitySlide,
  CostsSlide,
  DetailsSlide,
  NotesSlide,
  OverviewSlide,
} from './ItemDossierCarouselSlides';
import * as S from './ItemDossier.styles';

const SLIDES = [
  { id: 'overview', label: 'Overview', tone: 'teal' },
  { id: 'notes', label: 'Notes', tone: 'lilac' },
  { id: 'details', label: 'Details', tone: 'coral' },
  { id: 'costs', label: 'Costs', tone: 'amber' },
  { id: 'activity', label: 'Activity', tone: 'green' },
];

export default function ItemDossierCarousel({ itemName, ...slideProps }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = SLIDES[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [itemName]);

  const selectSlide = (index) => {
    setActiveIndex(Math.max(0, Math.min(index, SLIDES.length - 1)));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectSlide(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectSlide(activeIndex + 1);
    }
  };

  return (
    <S.Carousel
      aria-label={`${itemName || 'Item'} information`}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
    >
      <S.CarouselHeader>
        <S.CarouselHeadingGroup>
          <S.CarouselEyebrow>Item dossier</S.CarouselEyebrow>
          <S.CarouselTitle>{activeSlide.label}</S.CarouselTitle>
        </S.CarouselHeadingGroup>
        <S.CarouselHeaderControls>
          <S.CarouselArrow
            type="button"
            $compact
            disabled={activeIndex === 0}
            aria-label="Previous item section"
            onClick={() => selectSlide(activeIndex - 1)}
          >
            <span aria-hidden="true">←</span>
          </S.CarouselArrow>
          <S.CarouselPosition aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </S.CarouselPosition>
          <S.CarouselArrow
            type="button"
            $compact
            disabled={activeIndex === SLIDES.length - 1}
            aria-label="Next item section"
            onClick={() => selectSlide(activeIndex + 1)}
          >
            <span aria-hidden="true">→</span>
          </S.CarouselArrow>
        </S.CarouselHeaderControls>
      </S.CarouselHeader>

      <S.CarouselViewport>
        <S.CarouselTrack $activeIndex={activeIndex}>
          {SLIDES.map((slide, index) => (
            <S.CarouselSlide
              key={slide.id}
              $active={index === activeIndex}
              $tone={slide.tone}
              aria-hidden={index !== activeIndex}
              aria-label={`${slide.label}, slide ${index + 1} of ${SLIDES.length}`}
              aria-roledescription="slide"
            >
              {index === activeIndex ? (
                <S.CarouselSlideScroll>
                  {slide.id === 'overview' ? (
                    <OverviewSlide itemName={itemName} {...slideProps} />
                  ) : null}
                  {slide.id === 'notes' ? <NotesSlide {...slideProps} /> : null}
                  {slide.id === 'details' ? <DetailsSlide {...slideProps} /> : null}
                  {slide.id === 'costs' ? <CostsSlide {...slideProps} /> : null}
                  {slide.id === 'activity' ? <ActivitySlide {...slideProps} /> : null}
                </S.CarouselSlideScroll>
              ) : null}
            </S.CarouselSlide>
          ))}
        </S.CarouselTrack>
      </S.CarouselViewport>

      <S.CarouselNavigation aria-label="Item information sections">
        <S.CarouselTabs>
          {SLIDES.map((slide, index) => (
            <S.CarouselTab
              key={slide.id}
              type="button"
              $active={index === activeIndex}
              $tone={slide.tone}
              aria-current={index === activeIndex ? 'step' : undefined}
              aria-label={`Show ${slide.label}`}
              onClick={() => selectSlide(index)}
            >
              <S.CarouselTabMark
                $active={index === activeIndex}
                $tone={slide.tone}
                aria-hidden="true"
              />
              <span>{slide.label}</span>
            </S.CarouselTab>
          ))}
        </S.CarouselTabs>
      </S.CarouselNavigation>
    </S.Carousel>
  );
}
