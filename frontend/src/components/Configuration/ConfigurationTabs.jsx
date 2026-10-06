import { useRef } from 'react';
import styled from 'styled-components';
import { controlStyles, panelStyles } from '../../styles/primitives';

const Stack = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 230px) minmax(0, 1fr);
  align-items: start;
  gap: 1rem;
  min-width: 0;
  @media (max-width: 700px) { grid-template-columns: minmax(0, 1fr); }
`;
const Rail = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.25rem 6px 8px 0;
  @media (max-width: 700px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
const Tab = styled.button`
  ${controlStyles}
  display: grid;
  gap: 0.3rem;
  text-align: left;
  min-width: 0;
  min-height: 64px;
  padding: 0.65rem 0.8rem;
  border-left: 3px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'var(--dw-border)'};
  background: ${({ $active }) => $active ? 'var(--dw-surface-raised)' : 'var(--dw-surface)'};
  color: ${({ $active }) => $active ? 'var(--dw-cyan)' : 'var(--dw-text)'};
  box-shadow: 3px 3px 0 var(--dw-background), 4px 4px 0 var(--dw-border-soft);
  transform: ${({ $active }) => $active ? 'translate(2px, 2px)' : 'none'};
  transition: transform 160ms ease, background 160ms ease;
  span { color: var(--dw-text-muted); font-size: 0.75rem; font-weight: 400; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const Content = styled.section`
  ${panelStyles}
  padding: clamp(0.65rem, 2vw, 1.2rem);
  border-top: 3px solid var(--dw-cyan);
  box-shadow: 4px 4px 0 var(--dw-background), 5px 5px 0 var(--dw-border-soft);
  min-width: 0;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }
`;

export default function ConfigurationTabs({ tabs, activeTab, onSelect, children }) {
  const refs = useRef([]);
  const orientation = 'vertical';
  const onKeyDown = (event, index) => {
    let next;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % tabs.length;
    if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onSelect(tabs[next].id);
  };
  return (
    <Stack>
      <Rail role="tablist" aria-label="Configuration sections" aria-orientation={orientation}>
        {tabs.map((tab, index) => (
          <Tab key={tab.id} ref={(node) => { refs.current[index] = node; }}
            id={`configuration-tab-${tab.id}`} type="button" role="tab"
            aria-selected={activeTab === tab.id} aria-controls={`configuration-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1} $active={activeTab === tab.id}
            onClick={() => onSelect(tab.id)} onKeyDown={(event) => onKeyDown(event, index)}>
            {tab.label}<span>{tab.hint}</span>
          </Tab>
        ))}
      </Rail>
      <Content id={`configuration-panel-${activeTab}`} role="tabpanel" tabIndex={0}
        aria-labelledby={`configuration-tab-${activeTab}`}>
        {children}
      </Content>
    </Stack>
  );
}
