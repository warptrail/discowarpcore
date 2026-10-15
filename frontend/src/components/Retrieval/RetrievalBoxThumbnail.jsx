import { useState } from 'react';
import styled, { css } from 'styled-components';
import { getBoxThumbnailUrl } from '../../util/itemImage';
import InventoryBoxCube from '../InventoryBoxCube';

const Frame = styled.div`
  position: relative;
  align-self: stretch;
  min-height: 100px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 60%, rgba(var(--box-primary-rgb), .16), rgba(8, 17, 27, .7));
  > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transform: scale(1.14);
  }
  > svg { width: 100%; height: 100%; position: absolute; inset: 0; }
  ${({ $compact }) => $compact && css`
    width: 32px; height: 32px; min-height: 32px; align-self: center;
    > svg { width: 24px; height: 24px; inset: auto; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  `}
`;

export default function RetrievalBoxThumbnail({ box, compact = false }) {
  const src = getBoxThumbnailUrl(box);
  const [failedSource, setFailedSource] = useState('');
  return (
    <Frame $compact={compact} aria-hidden="true">
      {src && src !== failedSource ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailedSource(src)} />
      ) : (
        <InventoryBoxCube identity={box.boxId || box.box_id || box.id} />
      )}
    </Frame>
  );
}
