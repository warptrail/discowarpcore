import { Link } from 'react-router-dom';
import { getOccasion, occasionStyle } from './occasionPresets';
import LoadoutGlyph from './LoadoutGlyph';
import * as S from './Loadouts.styles';

export default function LoadoutGallery({ loadouts }) {
  return (
    <S.Grid as="nav" aria-label="Your six loadouts">
      {loadouts.map(loadout => {
        const theme = getOccasion(loadout.occasion);
        return (
          <S.Card as={Link} key={loadout.id} to={`/loadouts?loadout=${loadout.id}`} style={occasionStyle(loadout.occasion)}>
            <LoadoutGlyph kind={theme.glyph} className="badge" />
            <h2>{loadout.name}</h2>
            <p>{theme.description}</p>
            <S.CardFoot>
              <span>{loadout.entries.length} items</span>
              <small>Open kit →</small>
            </S.CardFoot>
            <LoadoutGlyph kind={theme.glyph} className="scene" />
          </S.Card>
        );
      })}
    </S.Grid>
  );
}
