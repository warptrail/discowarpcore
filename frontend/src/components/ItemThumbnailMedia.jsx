import { useState } from 'react';
import styled from 'styled-components';
import InventoryObjectShape from './InventoryObjectShape';
import { getItemMicroThumbnailCandidates } from '../util/itemImage';
import { getBoxTheme, getBoxThemeCssVars } from '../util/inventoryColorTheme';

const Frame = styled.span`
  display: grid; place-items: center; min-width: 0; min-height: 0; flex-shrink: 0;
  width: ${({ $size }) => $size ? `${$size}px` : '100%'};
  height: ${({ $size }) => $size ? `${$size}px` : '100%'};
  overflow: hidden; border-radius: inherit; background: var(--dw-surface-raised, #162332);
  > img { display: block; width: 100%; height: 100%; object-fit: cover; }
  > svg { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; object-fit: contain; }
`;

function ThumbnailContent({ item, candidates, alt, imageAs = 'img' }) {
  const Image = imageAs;
  const [attempt, setAttempt] = useState(0);
  return candidates[attempt]
    ? <Image src={candidates[attempt]} alt={alt} loading="lazy" decoding="async" draggable={false} onError={() => setAttempt(current => current + 1)} />
    : <InventoryObjectShape item={item} />;
}

export default function ItemThumbnailMedia({ item, sources, size, boxId, alt = '', imageAs }) {
  const candidates = sources || getItemMicroThumbnailCandidates(item);
  const owner = boxId ?? item?.box?.box_id ?? item?.parentBoxId;
  return <Frame $size={size} style={owner ? getBoxThemeCssVars(getBoxTheme(owner)) : undefined}>
    <ThumbnailContent key={candidates.join('\n')} item={item} candidates={candidates} alt={alt} imageAs={imageAs} />
  </Frame>;
}
