import { Link } from 'react-router-dom';
import styled from 'styled-components';
import HomeCommandIcon from './HomeCommandIcon';

const Readout = styled.nav`
  display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; min-width: 0; max-width: 100%;
  padding-block: 4px; color: var(--dw-text); font: 500 .8rem/1.4 var(--dw-font-ui);
`;
const Path = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 5px; min-width: 0;
  a { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; color: var(--dw-text-secondary); text-decoration: none; }
  a:hover { color: var(--box-primary); }
  a:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;
const Id = styled.span`&&& { white-space: nowrap; color: var(--box-primary); font: 750 1.25rem/1.2 var(--dw-font-data); }`;
const Metric = styled.span`
  &&& { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; color: var(--dw-text-secondary); }
  strong { color: var(--dw-text); font-family: var(--dw-font-data); font-weight: 650; }
`;

export default function BoxConsoleMetadata({ shortId, breadcrumb = [], metadata, onReturnHome }) {
  if (!metadata) return null;
  return <Readout aria-label="Box hierarchy and inventory metadata">
    <Path>
      <Link to="/operations" aria-label="Go to Operations home" title="Operations home" onClick={onReturnHome}><HomeCommandIcon size="24px" alt="" /></Link>
      {breadcrumb.slice(0, -1).map((crumb, index) => <Link key={`${crumb.id}:${index}`} to={`/boxes/${encodeURIComponent(crumb.id)}`} title={crumb.label} aria-label={`Parent box ${crumb.id}: ${crumb.label}`}>#{crumb.id} ›</Link>)}
      <Id data-box-console-id>#{shortId}</Id>
    </Path>
    <Metric>Level <strong>{Math.max(0, breadcrumb.length - 1)}</strong></Metric>
    {metadata.sectionCount ? <><Metric><strong>{metadata.sectionCount}</strong> sections</Metric><Metric><strong>{metadata.storageSpaceCount}</strong> storage spaces</Metric></> : <Metric>Simple box</Metric>}
    <Metric title={`${metadata.itemRecords} inventory records; total includes quantities and nested boxes`}><strong>{metadata.totalQuantity}</strong> items total</Metric>
    <Metric><strong>{metadata.nestedBoxCount}</strong> nested boxes</Metric>
  </Readout>;
}
