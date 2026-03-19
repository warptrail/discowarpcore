import * as S from './Retrieval.styles';

const normalize = (value) => String(value || '').trim().toLowerCase();

export default function LocationBadge({ label, path, compact = false }) {
  const locationLabel = String(label || 'Unknown Location').trim() || 'Unknown Location';
  const locationPath = String(path || '').trim();

  const showPath =
    locationPath && normalize(locationPath) !== normalize(locationLabel);

  return (
    <S.LocationWrap>
      <S.LocationBadge $compact={compact} title={locationPath || locationLabel}>
        {locationLabel}
      </S.LocationBadge>
      {showPath ? <S.LocationPath>{locationPath}</S.LocationPath> : null}
    </S.LocationWrap>
  );
}
