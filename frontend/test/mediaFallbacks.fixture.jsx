import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';
import GlobalStyles from '../src/styles/globalStyles';
import ItemRowThumbnail from '../src/components/ItemRowThumbnail';
import { getBoxTheme, getBoxThemeCssVars } from '../src/util/inventoryColorTheme';

const Page = styled.main`padding: 16px; color: var(--dw-text);`;
const List = styled.div`display: grid; gap: 8px; margin-top: 12px;`;
const Row = styled.div`display: flex; align-items: center; gap: 12px; height: 76px; background: var(--dw-surface);`;
const Button = styled.button`min-height: 44px; padding: 8px; background: var(--dw-surface-raised); color: var(--dw-cyan); border: 1px solid var(--dw-border);`;
const photo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#20415d"/><text x="10" y="55" fill="white" font-size="16">Photo</text></svg>');
const samples = [
  { id: 'alpha', name: 'Missing alpha', sources: [] },
  { id: 'bravo', name: 'Missing bravo', sources: [] },
  { id: 'charlie', name: 'Missing charlie', sources: [] },
  { id: 'photo', name: 'Real photo', sources: [photo] },
  { id: 'backup', name: 'Photo with broken first source', sources: ['/test/intentionally-missing-photo.png', photo] },
  { id: 'broken', name: 'All photo sources failed', sources: ['/test/intentionally-missing-photo.png'] },
];

export default function Fixture() {
  const [reverse, setReverse] = useState(false);
  const rows = reverse ? [...samples].reverse() : samples;
  return <><GlobalStyles /><Page style={getBoxThemeCssVars(getBoxTheme('001'))}>
    <p>Synthetic missing-media checks. No inventory requests.</p>
    <Button onClick={() => setReverse((value) => !value)}>Reverse rows</Button>
    <List>{rows.map((row) => <Row key={row.id} data-fixture-item={row.id}>
      <ItemRowThumbnail itemId={row.id} boxId="001" name={row.name} sources={row.sources} quantityLabel="×1" />
      <span>{row.name}</span>
    </Row>)}</List>
  </Page></>;
}

createRoot(document.getElementById('root')).render(<Fixture />);
