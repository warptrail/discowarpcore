import styled from 'styled-components';
import { Control } from '../../styles/primitives';

const Wrap = styled.div`
  display: grid;
  gap: 1rem;
  h2, p { margin: 0; }
  h2 { font-size: 1.1rem; }
  p { color: var(--dw-text-secondary); line-height: 1.6; }
`;
const Routes = styled.div`
  display: grid;
  gap: 0.75rem;
  > div { display: grid; gap: 0.5rem; padding-block: 0.75rem; border-top: 1px solid var(--dw-border-soft); }
  button { justify-self: start; }
`;

export default function ConfigurationWorkbench({ onSelect }) {
  return (
    <Wrap>
      <h2>Upload workbench</h2>
      <p>Choose a source below. Staging saves a reviewable batch without creating inventory.
        After staging, open Existing batches to check the destination, validate, and import.</p>
      <Routes>
        <div><strong>JSON without images</strong><p>Upload a single item, an array, or an items payload.</p>
          <Control onClick={() => onSelect('json')}>Open JSON</Control></div>
        <div><strong>AI intake package</strong><p>Upload a ZIP containing a manifest and its referenced images.</p>
          <Control onClick={() => onSelect('package')}>Open AI intake package</Control></div>
        <div><strong>Plain text</strong><p>Create basic items from one name per line. This path imports directly.</p>
          <Control onClick={() => onSelect('text')}>Open text upload</Control></div>
      </Routes>
      <Control onClick={() => onSelect('batches')}>Review existing batches</Control>
    </Wrap>
  );
}
