import styled from 'styled-components';
import { consoleControlStyles } from './IntakeConsole.styles';
import CaptureGlyph from './CaptureGlyph';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import RetrievalBoxThumbnail from '../Retrieval/RetrievalBoxThumbnail';

const Context = styled.aside`
  display: none;
  @media (min-width: 1100px) {
    display: grid;
    align-content: start;
    gap: 12px;
    position: sticky;
    top: calc(var(--dw-header-height, 100px) + 12px);
    min-width: 0;
    padding: 16px;
    border-bottom: 1px solid var(--dw-border-soft);
    border-radius: 2px 12px 2px 2px;
    background: var(--dw-surface);
    h2, p {
      margin: 0;
      overflow-wrap: anywhere;
    }
    h2 {
      color: var(--dw-text-muted);
      font-size: .75rem;
      font-weight: 400;
    }
    p {
      color: var(--dw-text-secondary);
      font-size: 0.85rem;
      line-height: 1.5;
    }
    strong {
      color: var(--box-primary, var(--dw-violet));
    }
    button {
      ${consoleControlStyles}
      color: var(--dw-cyan);
      font-size: .8rem;
    }
  }
`;
const Thumbnail = styled.div`
  width: 96px;
  height: 96px;
  overflow: hidden;
  > div {
    height: 100%;
    min-height: 96px;
  }
`;

export default function IntakeDestinationContext({ box, onChange }) {
  return (
    <Context aria-label="Current Intake destination" style={getBoxThemeCssVars(getBoxTheme(box?.box_id, { kind: box ? undefined : 'orphaned' }))}>
      <h2>Current destination</h2>
      {box ? <>
        <Thumbnail><RetrievalBoxThumbnail box={box} /></Thumbnail>
        <strong>#{box.box_id} {box.label || box.name || 'Untitled box'}</strong>
        <p>{String(box.location || '').trim() || 'UNKNOWN'}</p>
      </> : <><strong>Items Adrift</strong><p>New items remain outside a box until placed.</p></>}
      <button type="button" onClick={onChange}><CaptureGlyph kind="change" /> Change destination</button>
    </Context>
  );
}
