import SectionBadge from '../BoxForms/SectionBadge';
import { useEffect, useRef, useState } from 'react';
import { BOX_CARD_FIELDS } from '../OperationsQuickPeek/operationsBoxFields';
import { createPortal } from 'react-dom';
import useOperationsDockGeometry from './useOperationsDockGeometry';
import { getNestedTrayId, getTreeNodeKey } from './operationsTreeLayout';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import * as S from './OperationsTreeInspector.styles';

export function TreeNode({ node, root = false, expandedKeys, isSearchExpanded, onToggle, onInspect, onEditBoxField }) {
  const [editing, setEditing] = useState(false);
  const editRef = useRef(null);
  const children = node.childBoxes || [];
  const expanded = root || expandedKeys.has(getTreeNodeKey(node)) || isSearchExpanded(node);
  const quantity = (node.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  const name = node.label || node.name || 'Untitled';
  const childId = `inspector-children-${encodeURIComponent(getTreeNodeKey(node))}`;
  return <li style={getBoxThemeCssVars(getBoxTheme(node.box_id))}>
    <S.Row>
      {children.length && !root ? <button type="button" aria-label={`${expanded ? 'Collapse' : 'Expand'} nested boxes in ${node.box_id}`}
        aria-expanded={expanded} aria-controls={childId} disabled={isSearchExpanded(node)} onClick={() => onToggle(node)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d={expanded ? 'M2 4l4 4 4-4' : 'M4 2l4 4-4 4'} stroke="currentColor" /></svg>
      </button> : <span aria-hidden="true" style={{ width: 32, flexShrink: 0 }} />}
      <S.Select type="button" aria-label={`Inspect box ${node.address || node.box_id}, ${name}`} onClick={event => onInspect(node, event.currentTarget)}>
        <code>{node.address || node.box_id}</code><strong>{name}{node.kind === "cabinet" ? <> · <SectionBadge compartmentKey={node.compartmentKey} /></> : null}</strong><span>{quantity} {quantity === 1 ? 'item' : 'items'}</span>
      </S.Select>
      {onEditBoxField && node.kind !== "cabinet" ? <S.Edit ref={editRef} type="button" aria-label={`Edit fields for box ${node.box_id}`} aria-expanded={editing} aria-controls={`${childId}-fields`} onClick={() => setEditing(current => !current)}>⋯</S.Edit> : null}
    </S.Row>
    {editing && node.kind !== "cabinet" ? <S.Fields id={`${childId}-fields`} role="group" data-tree-field-actions aria-label={`Edit box ${node.box_id} fields`} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setEditing(false); requestAnimationFrame(() => editRef.current?.focus()); }
    }}>
      {BOX_CARD_FIELDS.map(field => <button key={field.key} type="button" aria-label={`Edit box ${node.box_id} ${field.label}`}
        onClick={event => { onEditBoxField(node, field.key, event.currentTarget); setEditing(false); }}>{field.label}</button>)}
    </S.Fields> : null}
    {children.length > 0 && expanded ? <ul id={childId} aria-label={`Boxes inside ${node.box_id}`}>
      {children.map(child => <TreeNode key={getTreeNodeKey(child)} node={child} expandedKeys={expandedKeys}
        isSearchExpanded={isSearchExpanded} onToggle={onToggle} onInspect={onInspect} onEditBoxField={onEditBoxField} />)}
    </ul> : null}
  </li>;
}

export default function OperationsTreeInspector({ target, occupied, open, roots, activeRoot, onActivate, onClose, ...treeProps }) {
  const geometry = useOperationsDockGeometry(target, open);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open || occupied) return undefined;
    const frame = requestAnimationFrame(() => {
      if (document.activeElement?.matches('[data-nested-box-toggle]')) closeRef.current?.focus();
    });
    const escape = event => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.target.closest?.('[data-tree-field-actions]') || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault(); event.stopImmediatePropagation(); onClose();
    };
    window.addEventListener('keydown', escape, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', escape, true); };
  }, [open, occupied, onClose]);
  if (!open || !activeRoot || !target) return null;
  const activeKey = getTreeNodeKey(activeRoot);
  const selectTab = (event, index) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % roots.length : event.key === 'ArrowLeft' ? (index + roots.length - 1) % roots.length : event.key === 'Home' ? 0 : event.key === 'End' ? roots.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); onActivate(roots[next]);
    document.getElementById(`inspector-branch-${getTreeNodeKey(roots[next])}`)?.focus();
  };
  return createPortal(<S.Panel aria-label="Containment inspector" aria-hidden={occupied} inert={occupied || undefined}
    data-tree-inspector style={{ '--operations-dock-top': `${geometry.top}px`, '--operations-dock-left': `${geometry.left}px` }}>
    <header><div><h2>Containment</h2><p>Select a box to inspect its contents.</p></div>
      <S.Close ref={closeRef} type="button" aria-label="Close nested box tree" onClick={onClose}>×</S.Close></header>
    <S.Tabs role="tablist" aria-label="Open box branches">{roots.map((node, index) => <button key={getTreeNodeKey(node)}
      id={`inspector-branch-${getTreeNodeKey(node)}`} type="button" role="tab" aria-selected={getTreeNodeKey(node) === activeKey}
      aria-controls={getNestedTrayId(node)} tabIndex={getTreeNodeKey(node) === activeKey ? 0 : -1}
      style={getBoxThemeCssVars(getBoxTheme(node.box_id))} title={node.label || node.name}
      onClick={() => onActivate(node)} onKeyDown={event => selectTab(event, index)}>#{node.box_id}</button>)}</S.Tabs>
    <S.Body id={getNestedTrayId(activeRoot)} role="tabpanel" aria-labelledby={`inspector-branch-${activeKey}`} data-branch-scroll>
      <ul aria-label={`Containment tree for box ${activeRoot.box_id}`}><TreeNode node={activeRoot} root {...treeProps} /></ul>
    </S.Body>
  </S.Panel>, target);
}
