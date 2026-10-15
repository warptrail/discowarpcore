// Read-only component QA: no inventory APIs, records or application routes.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from '../src/styles/globalStyles';
import FinderItemDetails from '../src/components/InventoryQuickAnswer/FinderItemDetails';
import FinderItemControls from '../src/components/InventoryQuickAnswer/FinderItemControls';
import FinderMatchFrame from '../src/components/InventoryQuickAnswer/FinderMatchFrame';
import * as S from '../src/components/InventoryQuickAnswer/FinderItemFocus.styles';

const longNote = '# Fish care log\n\n**Keep dry**, away from *direct heat*.\n\n- [x] Label checked\n- [ ] Inspect next month\n\n> Handle gently.\n\n| Location | Condition |\n| --- | --- |\n| Shelf | Good |\n\n`reference: fish-001`\n\n' + Array.from({ length: 35 }, (_, i) => `## Check ${i + 1}\n\nThis is a synthetic fish note for scrolling verification, not a real inventory record.`).join('\n\n') + '\n\nEND OF NOTE';
const answers = [longNote, 'A short plain note.\nKeep this second line readable.', ''].map((notes, index) => ({ id: `fixture-${index}`, name: `${['Markdown', 'Plain', 'Empty'][index]} note — synthetic fixture`, boxId: '102', boxLabel: 'Read-only test box', item: { notes, category: 'Fixture', quantity: 1 }, path: [], placement: { tiers: {} } }));
const Notice = styled.p`margin: 12px; color: var(--dw-text-muted); font-size: .8rem;`;
const Panel = styled(S.Panel)`top: 56px; left: max(8px, calc((100vw - 960px) / 2)); width: min(960px, calc(100vw - 16px)); height: min(640px, calc(100dvh - 64px));`;

export default function Fixture() {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState('notes');
  const answer = answers[index];
  return <MemoryRouter><GlobalStyles /><Notice>Synthetic Notes fixture — no inventory writes.</Notice>
    <Panel role="dialog" aria-label="Notes QA fixture">
      <FinderMatchFrame expanded index={index} total={answers.length} onStep={(step) => setIndex((index + step + answers.length) % answers.length)}>
        <S.Body id="finder-item-information" $notes={view === 'notes'}><FinderItemDetails answer={answer} query="fish" view={view} /></S.Body>
      </FinderMatchFrame>
      <FinderItemControls answer={answer} view={view} onViewChange={setView} search="?q=fish" />
    </Panel>
  </MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
