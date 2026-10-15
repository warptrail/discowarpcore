import styled, { css } from 'styled-components';
import { RETRIEVAL_MODE_COLORS } from '../../styles/tokens';

const Dock = styled.div`
  --retrieval-mode-accent: ${({ $mode }) => RETRIEVAL_MODE_COLORS[$mode] || RETRIEVAL_MODE_COLORS.items};
  min-width: 0;
`;
const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  align-items: center;
  gap: 4px;
  padding: calc(3px * (1 - var(--header-progress, 0))) 3px;
  border: 1px solid var(--dw-border);
  border-left: 3px solid var(--retrieval-mode-accent);
  border-radius: 4px;
  background: var(--dw-surface);
  transition: padding 220ms ease-out;
  > button { width: 44px; min-width: 44px; height: 44px; padding: 0; margin: 0; align-self: center; }
  @media (min-width: 1100px) {
    grid-template-columns: auto minmax(0, 1fr) 44px; gap: 8px;
  }
  ${({ $tags }) => $tags && css`
    grid-template-columns: auto minmax(0, 1fr) auto 44px;
    > button { grid-row: 2; grid-column: 4; }
    @media (min-width: 1100px) {
      grid-template-columns: auto auto auto minmax(0, 1fr) 44px;
      > button { grid-column: 5; }
      > #retrieval-console-search-mount { grid-row: 2; grid-column: 4; }
    }
  `}
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const ControlsMount = styled.div`min-width: 0; display: ${({ $tags }) => $tags ? 'contents' : 'block'};`;
const SearchMount = styled.div`
  display: none; min-width: 0;
  @media (min-width: 1100px) {
    display: block;
    input { min-height: 44px; height: 44px; }
    label { gap: 0; }
    p:empty { display: none; }
  }
`;
const FinderMount = styled.div`
  min-width: 0;
  max-height: max(160px, calc(100dvh - 180px));
  overflow-y: auto;
  overscroll-behavior: contain;
  &:empty { display: none; }
`;

export default function RetrievalHeaderConsole({ mode = 'items', trigger, compact = false, tags = false }) {
  return <Dock $mode={mode} data-retrieval-console="true" data-tags={tags ? 'true' : 'false'} data-compact={compact ? 'true' : 'false'}>
    <Row $tags={tags}>
      <ControlsMount $tags={tags} id="retrieval-header-controls-mount" />
      <SearchMount id="retrieval-console-search-mount" />
      {trigger}
    </Row>
    <FinderMount id="retrieval-console-finder-mount" />
  </Dock>;
}
