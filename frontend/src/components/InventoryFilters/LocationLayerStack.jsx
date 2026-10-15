import { useEffect, useRef, useState } from 'react';
import { getLocationMapScope, LOCATION_MAP_TIERS } from '../Location/locationHierarchy';
import { availableLocationLayers, nextLocationLayer, selectLocationLayerScope } from './locationLayerModel';
import LocationChoiceCarousel from './LocationChoiceCarousel';
import * as S from './LocationLayerStack.styles';

export default function LocationLayerStack({ locations, scope, options, selectedRooms, onRoomsChange, onTierChange, extraRoomOptions = [], summary, hasSelection = false, onClear }) {
  const [requestedLayer, setRequestedLayer] = useState(null);
  const carouselRef = useRef(null);
  const trailRef = useRef(null);
  const focusAfterChange = useRef(null);
  const available = availableLocationLayers(scope, options);
  const hasTrail = available.length > 1;
  const visibleLayer = Math.min(requestedLayer ?? available.at(-1), available.at(-1));
  const tier = LOCATION_MAP_TIERS[visibleLayer];
  const choices = [
    ...(visibleLayer === 0 ? extraRoomOptions : []),
    ...options[tier.key].map((name) => ({ key: name, label: name })),
  ];
  const selected = visibleLayer === 0 && selectedRooms ? selectedRooms : scope[tier.key] ? [scope[tier.key]] : [];

  useEffect(() => {
    if (!focusAfterChange.current) return;
    const target = focusAfterChange.current === 'trail'
      ? trailRef.current?.querySelector('[aria-current="step"]') ?? carouselRef.current?.querySelector('button')
      : carouselRef.current?.querySelector('button');
    focusAfterChange.current = null;
    target?.focus({ preventScroll: true });
  }, [visibleLayer]);

  const select = (key) => {
    const removing = selected.includes(key);
    let nextScope;
    if (visibleLayer === 0 && onRoomsChange) {
      const rooms = removing ? selected.filter((name) => name !== key) : [...selected, key];
      onRoomsChange(rooms);
      nextScope = { room: rooms.length === 1 ? rooms[0] : '' };
    } else {
      nextScope = selectLocationLayerScope(scope, tier.key, removing ? '' : key);
      onTierChange(tier.key, removing ? [] : [key]);
    }
    const next = getLocationMapScope(locations, nextScope);
    const nextLayer = nextLocationLayer(next.scope, next.options, visibleLayer);
    focusAfterChange.current = nextLayer !== visibleLayer ? 'choice' : null;
    setRequestedLayer(nextLayer);
  };

  return <S.Stage $depth={visibleLayer} data-location-layer={tier.key} role="group" aria-label={`Location: ${summary}`}>
    {LOCATION_MAP_TIERS.slice(0, visibleLayer).map((ancestor, index) => (
      <S.Backplate key={ancestor.key} $index={index} style={{ '--layer-color': ancestor.color }} aria-hidden="true" />
    ))}
    <S.Face key={tier.key} $hasTrail={hasTrail} style={{ '--layer-color': tier.color }}>
      {hasTrail ? <S.Trail ref={trailRef} $hasClear={hasSelection} aria-label="Location layers">
        {available.map((index) => {
          if (index === 0 && visibleLayer === 0) return null;
          const label = index === 0 ? 'Rooms' : scope[LOCATION_MAP_TIERS[index - 1].key];
          return <S.Crumb key={index} type="button" aria-label={`Browse ${LOCATION_MAP_TIERS[index].label} options`}
            aria-current={index === visibleLayer ? 'step' : undefined} title={index === 0 ? 'Rooms — select one or more' : label}
            onClick={() => {
              focusAfterChange.current = index !== visibleLayer ? 'trail' : null;
              setRequestedLayer(index);
            }}>
            {index > 0 ? <><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg><span>{label}</span></>
              : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="M13 8H3m4-4L3 8l4 4" /></svg>}
          </S.Crumb>;
        })}
      </S.Trail> : null}
      {hasSelection ? <S.Clear type="button" aria-label="Clear selected location" title={`Clear location: ${summary}`} onClick={() => {
        focusAfterChange.current = visibleLayer !== 0 ? 'choice' : null;
        onClear?.();
        setRequestedLayer(0);
        if (visibleLayer === 0) carouselRef.current?.querySelector('button')?.focus({ preventScroll: true });
      }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg></S.Clear> : null}
      <S.Wall $hasTrail={hasTrail}>
        <LocationChoiceCarousel choices={choices} tier={tier} selected={selected} onSelect={select}
          carouselRef={carouselRef} hasClear={hasSelection && !hasTrail} />
      </S.Wall>
    </S.Face>
  </S.Stage>;
}
