import { useState } from 'react';
import styled from 'styled-components';
import { getBoxThumbnailUrl } from '../../util/itemImage';

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
`;

// Seed the orientation by identity: visually varied, stable across sorting and renders.
function cubeFaces(identity) {
  let seed = 0;
  for (const character of String(identity)) seed = (Math.imul(seed, 31) + character.charCodeAt(0)) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
  seed = (seed ^ (seed >>> 16)) >>> 0;
  const yaw = .3 + (seed % 100) / 100 * .8;
  const pitch = -.3 - ((seed >>> 5) % 100) / 100 * .3;
  const roll = (((seed >>> 9) % 100) / 100 - .5) * .35;
  const project = ([x, y, z]) => {
    const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
    const rz = z * Math.cos(yaw) - x * Math.sin(yaw);
    const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
    return `${(40 + (rx * Math.cos(roll) - ry * Math.sin(roll)) * 19).toFixed(2)},${(43 + (rx * Math.sin(roll) + ry * Math.cos(roll)) * 19).toFixed(2)}`;
  };
  return [
    [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
    [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
    [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
  ].map((vertices) => vertices.map(project).join(' '));
}

export default function RetrievalBoxThumbnail({ box }) {
  const src = getBoxThumbnailUrl(box);
  const [failedSource, setFailedSource] = useState('');
  const faces = cubeFaces(box.boxId || box.box_id || box.id);
  return (
    <Frame aria-hidden="true">
      {src && src !== failedSource ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailedSource(src)} />
      ) : (
        <svg viewBox="0 0 80 90" fill="none">
          <ellipse cx="40" cy="77" rx="24" ry="4" fill="black" opacity=".2" />
          {faces.map((points, index) => (
            <polygon key={index} points={points}
              fill={index === 0 ? 'var(--box-secondary, var(--box-primary))' : 'var(--box-primary)'}
              fillOpacity={[.22, .42, .68][index]}
              stroke="var(--box-primary)" strokeOpacity=".8" strokeWidth=".8" strokeLinejoin="round" />
          ))}
        </svg>
      )}
    </Frame>
  );
}
