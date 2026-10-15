import useTagReturnSnapshot from '../hooks/useTagReturnSnapshot';
import CompactTagRow from './Tags/CompactTagRow';
import MissingStatus from './MissingItems/MissingStatus';
import { useMissingItem } from './MissingItems/MissingItemsContext';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { joinedWorkspaceBody } from '../styles/workspaceBoundaries';
import { Link } from 'react-router-dom';
import * as MediaStyles from '../styles/ItemPageConsoleView.styles';
import * as PageStyles from '../styles/ItemPage.styles';
import MarkdownContent from './RichText/MarkdownContent';
import { getItemOwnershipContext } from '../util/itemOwnership';
import { formatItemCategory } from '../util/itemCategories';
import { Commands } from './ItemCommands.styles';

const Shell = styled.div`
  ${joinedWorkspaceBody}
  min-width: 0; background: #0d1620;
  overflow: hidden; color: var(--dw-text);
  ${MediaStyles.WikiHero} { border-radius: 12px; }
  ${MediaStyles.WikiFactRail} { display: none; }
  ${MediaStyles.WikiHeroEditButton} { border: 0; color: var(--box-primary); background: transparent; min-height: 44px; }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Rail = styled.div`
  display: flex; flex-wrap: wrap; padding: 4px 12px; gap: 4px;
  border-bottom: 1px solid rgba(var(--box-primary-rgb), .2); background: #101b27;
`;
const Tab = styled.button`
  min-height: 44px; padding: 0 16px; border: 0; border-bottom: 2px solid ${({ $active }) => $active ? 'var(--box-primary)' : 'transparent'};
  border-radius: 6px 6px 0 0; color: ${({ $active }) => $active ? 'var(--box-primary)' : 'var(--dw-text-secondary)'};
  background: ${({ $active }) => $active ? 'rgba(var(--box-primary-rgb), .09)' : 'transparent'};
  font: 500 .85rem var(--dw-font-ui); cursor: pointer;
  @media(max-width: 430px) { flex: 1; padding: 0 8px; }
`;
const Panel = styled.section`
  padding: clamp(14px, 2vw, 24px); min-width: 0;
  &[hidden] { display: none; }
  table { width: 100%; }
  th { color: var(--dw-text-secondary); font-weight: 500; }
  td { font: 400 .85rem/1.5 var(--dw-font-ui); }
  ${PageStyles.ControlGroup} { background: transparent; border: 0; padding: 12px 0; }
  ${PageStyles.ContainerButton}, ${PageStyles.ItemModeButton}, ${PageStyles.ContainerTimestampButton} { min-height: 44px; border-radius: 6px; font-family: var(--dw-font-ui); }
  ${PageStyles.ContainerTimestampButton} { background: rgba(var(--box-primary-rgb), .06); border-color: rgba(var(--box-primary-rgb), .24); }

`;
const Overview = styled.div`
  display: grid; grid-template-columns: minmax(200px, 330px) minmax(0, 1fr); gap: clamp(18px, 3vw, 36px); align-items: start;
  @media(max-width: 678px) {
    grid-template-columns: 1fr;
    > div:first-child { width: 180px; max-width: 100%; justify-self: center; }
  }
`;
const Copy = styled.div`
  min-width: 0; h1 { margin: 0 0 8px; font: 700 clamp(1.5rem, 3vw, 2.2rem)/1.15 var(--dw-font-ui); overflow-wrap: anywhere; }
  p { color: #c7d2de; font: 400 .9rem/1.6 var(--dw-font-ui); }
`;
const Facts = styled.div`display: flex; flex-wrap: wrap; gap: 8px 16px; color: var(--dw-text-secondary); font: 400 .85rem/1.5 var(--dw-font-ui);`;
const Placement = styled.div`
  margin-top: 22px; padding: 16px; border: 1px solid rgba(var(--box-primary-rgb), .28); border-radius: 12px; background: #101b27;
  a { display: inline-flex; gap: 8px; color: var(--box-primary); font: 600 1rem/1.5 var(--dw-font-ui); text-decoration: none; }
  code { font: 600 1rem var(--dw-font-data); }
  p { margin: 8px 0 0; font-size: .85rem; }
`;
const Edit = styled.button`
  min-height: 44px; padding: 0 12px; border: 0; border-radius: 6px; background: rgba(var(--box-primary-rgb), .09);
  color: var(--box-primary); font: 500 .8rem var(--dw-font-ui); cursor: pointer;
`;
const Tags = styled.div`display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; a { padding: 0 6px; border-radius: 6px; color: var(--box-primary); background: rgba(var(--box-primary-rgb), .07); font: 400 .75rem/1.5 var(--dw-font-ui); }`;
const Notes = styled.div`max-width: 760px; h2 { font: 650 1.1rem var(--dw-font-ui); margin: 0 0 16px; }`;

export default function ItemPageWorkspace({ item, media, commands, fields, editing, hierarchy, mediaEditing, onLeaveHierarchy, onEdit, workspaceRef }) {
  const source = useTagReturnSnapshot();
  const [section, setSection] = useState(() => ['overview', 'notes', 'fields', 'commands'].includes(source?.itemSection) ? source.itemSection : 'overview');
  useEffect(() => { if (editing) setSection('fields'); }, [editing]);
  const active = editing || hierarchy ? 'fields' : mediaEditing ? 'overview' : section;
  const currentItem = useMissingItem(item);
  const ownership = getItemOwnershipContext(item);
  const select = (value) => { if (!editing) { if (hierarchy) onLeaveHierarchy?.(); setSection(value); } };
  return <Shell ref={workspaceRef} data-item-page-section={active}>
    <Rail aria-label="Item sections">
      {['overview', 'notes', 'fields', 'commands'].map((key) => <Tab key={key} type="button" $active={active === key} aria-pressed={active === key} disabled={editing && key !== 'fields'} onClick={() => select(key)}>{key[0].toUpperCase() + key.slice(1)}</Tab>)}
    </Rail>
    <Panel hidden={active !== 'overview'} aria-label="Item overview"><Overview>
      <div>{media}</div><Copy><h1>{item.name || 'Untitled item'}</h1>
        <MissingStatus item={item} home /><Facts><span>{formatItemCategory(item.category)}</span><span>Quantity {item.quantity ?? 1}</span><span>{item.item_status === 'gone' ? 'No longer have' : 'Active'}</span></Facts>
        <p>{item.description || 'No description recorded.'}</p><Edit type="button" onClick={() => onEdit('description')}>Edit description</Edit>
        <Placement>{currentItem?.missing?.quantity > 0 ? <small>Recorded home</small> : null}{ownership.boxId ? <Link to={`/boxes/${encodeURIComponent(ownership.boxId)}`}><code>{ownership.boxId}</code>{ownership.boxLabel || 'Open box'}</Link> : <strong>Items Adrift</strong>}<p>{ownership.effectiveLocation || 'Location not recorded'}</p></Placement>
        <Tags><CompactTagRow returnKey={`item:${item._id || item.id}:overview`} tags={item.tags || []} name={item.name} boxId={ownership.placementLabel || ownership.boxId || ''} /></Tags>
      </Copy>
    </Overview></Panel>
    <Panel hidden={active !== 'notes'} aria-label="Item notes"><Notes><h2>Notes</h2><MarkdownContent text={item.notes || 'No notes recorded.'} /><Edit type="button" onClick={() => onEdit('notes')}>Edit notes</Edit></Notes></Panel>
    <Panel hidden={active !== 'fields'} aria-label="Item fields">{fields}</Panel>
    <Panel hidden={active !== 'commands'} aria-label="Item commands"><Commands>{commands}</Commands></Panel>
  </Shell>;
}
