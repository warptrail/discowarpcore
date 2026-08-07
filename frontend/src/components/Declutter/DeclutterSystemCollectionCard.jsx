import * as S from './Declutter.styles';

const ROUTES = [
  { key: 'discard', label: 'Trash', icon: '🗑' },
  { key: 'donate', label: 'Donate', icon: '🎁' },
  { key: 'sell', label: 'Sell', icon: '🏷' },
  { key: 'gift', label: 'Gift', icon: '🎀' },
  { key: 'needs_routing', label: 'Route', icon: '?' },
];

export default function DeclutterSystemCollectionCard({ candidates = [], onOpen }) {
  if (!candidates.length) return null;

  const counts = Object.fromEntries(ROUTES.map(({ key }) => [key, 0]));
  candidates.forEach((candidate) => {
    const route = String(candidate?.stagingRoute || 'needs_routing');
    counts[route] = Number(counts[route] || 0) + 1;
  });

  return (
    <S.SystemCollectionButton type="button" onClick={onOpen}>
      <S.SystemCollectionTop>
        <div>
          <S.Eyebrow>System collection</S.Eyebrow>
          <S.SystemCollectionTitle>Marked for Destruction</S.SystemCollectionTitle>
          <S.SmallText>Confirmed exits • items may still be anywhere in the house</S.SmallText>
        </div>
        <S.SystemCollectionTotal>{candidates.length}</S.SystemCollectionTotal>
      </S.SystemCollectionTop>
      <S.SystemCollectionRoutes>
        {ROUTES.filter(({ key }) => counts[key] > 0).map(({ key, label, icon }) => (
          <span key={key}><i aria-hidden="true">{icon}</i>{label}<strong>{counts[key]}</strong></span>
        ))}
      </S.SystemCollectionRoutes>
      <S.SystemCollectionOpen>Open Actions →</S.SystemCollectionOpen>
    </S.SystemCollectionButton>
  );
}
