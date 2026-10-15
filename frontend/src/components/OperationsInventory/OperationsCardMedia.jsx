import styled, { css } from 'styled-components';
import { styledComponents as S } from '../../styles/BoxList.styles';
import RetrievalBoxThumbnail from '../Retrieval/RetrievalBoxThumbnail';

const MediaSlot = styled.div`
  display: contents;
  @media (min-width: 1100px) {
    display: block;
    position: relative;
    isolation: isolate;
    flex: 0 0 88px;
    width: 88px;
    height: 88px;
    margin: 8px 0 0 8px;
    ${S.BoxImageFrame} {
      width: 80px;
      height: 80px;
      min-height: 0;
      align-self: start;
      box-sizing: border-box;
      border: 1px solid rgba(var(--box-primary-rgb), 0.3);
      border-radius: var(--dw-radius-sm);
      box-shadow: none;
      > div { height: 100%; min-height: 0; }
      > div > img { transform: none; }
      &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
    }
    ${({ $compact }) => $compact && css`
      flex-basis: 56px; width: 56px; height: 56px; margin: 4px 0 0 6px;
      ${S.BoxImageFrame} { width: 56px; height: 56px; }
    `}
  }
`;

export default function OperationsCardMedia({ node, boxImageUrl, density, openPhoto, compact = false }) {
  return (
    <MediaSlot $compact={compact} data-operations-card-media>
      {boxImageUrl ? (
        <S.BoxImageTrigger
          $density={density}
          aria-label={`View box photo for ${node.label || node.name || `box ${node.box_id}`}`}
          title="Open box photo preview"
          data-operations-box-preview-trigger="true"
          onClick={openPhoto}
        >
          <RetrievalBoxThumbnail box={node} />
        </S.BoxImageTrigger>
      ) : (
        <S.BoxImageFrame $density={density}>
          <RetrievalBoxThumbnail box={node} />
        </S.BoxImageFrame>
      )}
    </MediaSlot>
  );
}
