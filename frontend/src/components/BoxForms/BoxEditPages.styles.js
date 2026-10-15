import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';
import * as Form from './BoxEditForm.styles';

export const Workspace = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  @media (max-height: 640px) { gap: 6px; }
`;

export const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  flex: 0 0 auto;
  border-bottom: 1px solid var(--dw-border);
`;

export const Tab = styled.button`
  ${controlStyles}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  min-width: 0;
  padding: 4px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'transparent'};
  border-radius: 0;
  background: transparent;
  color: ${({ $active }) => $active ? 'var(--dw-cyan)' : 'var(--dw-text-secondary)'};
  font-size: .75rem;
  font-weight: 500;
  svg { width: 18px; height: 18px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  &:focus-visible { outline-offset: -3px; }
  @media (max-width: 600px) { span { display: none; } }
`;

export const Heading = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  h3 { margin: 0; font: 600 .95rem/1.3 var(--dw-font-ui); }
  span { color: var(--dw-text-muted); font: 500 .75rem/1.3 var(--dw-font-data); }
`;

export const Page = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  &[hidden] { display: none; }
  > * { flex-shrink: 0; }
  ${Form.IdentityCompactGrid} {
    grid-template-columns: 88px minmax(0, 1fr);
    > :last-child { grid-column: auto; }
  }
  ${Form.LocationStructureGrid} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 0;
    > :first-child, > :last-child { grid-column: auto; }
  }
  ${Form.LocationSubform} { padding: 0; border: 0; background: transparent; }
`;

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  && { flex-shrink: 1; }
  @media (max-height: 640px) { gap: 6px; }
  ${Form.TagList} { flex-wrap: nowrap; overflow-x: auto; align-items: center; }
  ${Form.TagChip}, ${Form.TagAdder} { flex-shrink: 0; }
  ${Form.TagAdder} { width: 180px; }
  ${Form.CompactContextGrid} {
    flex: 1;
    min-height: 0;
    padding: 0;
    border: 0;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    @media (max-height: 640px) { gap: 3px; }
    @media (min-width: 560px) { grid-template-rows: minmax(0, 1fr); }
  }
  ${Form.Field} { min-height: 0; }
  ${Form.Label} { margin-bottom: 0; line-height: 1.2; }
  ${Form.Textarea} {
    flex: 1;
    height: 100%;
    min-height: 56px;
    max-height: 220px;
    resize: none;
    @media (max-height: 640px) { min-height: 40px; }
  }
`;

export const Navigation = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 auto;
  padding-top: 8px;
  border-top: 1px solid var(--dw-border-soft);
`;

export const PageButton = styled.button`
  ${controlStyles}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 4px 10px;
  border: 0;
  background: transparent;
  color: var(--dw-cyan);
  font-size: .8rem;
  font-weight: 500;
  svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; }
`;
