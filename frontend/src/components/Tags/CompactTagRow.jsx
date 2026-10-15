import { useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import TagLinks from '../TagLinks';
import useTagReturnSnapshot from '../../hooks/useTagReturnSnapshot';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { getTagBubblePlacement } from './tagBubblePlacement';

const Summary = styled.span`
  display: flex; align-items: center; height: ${({ $rows }) => $rows * 28}px; gap: 4px; min-width: 0; width: 100%;
`;
const Preview = styled.span`
  display: block; min-width: 0; flex: 1; overflow: hidden; height: ${({ $rows }) => $rows * 28}px;
  > span { flex-wrap: ${({ $maxRows }) => $maxRows > 1 ? 'wrap' : 'nowrap'}; row-gap: 0; width: 100%; }
  a { flex-shrink: 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  > span > [data-tag-chip]:nth-child(n + ${({ $visible }) => $visible + 1}) { visibility: hidden; }
`;
const More = styled.button`
  flex-shrink: 0; min-width: 44px; height: 28px; min-height: 28px; padding: 0 6px;
  border: 0; border-radius: 4px; background: var(--dw-surface-raised); color: var(--dw-text-secondary);
  font: 500 .75rem/1.3 var(--dw-font-ui); cursor: pointer;
  &:hover { color: var(--dw-text); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Bubble = styled.span`
  position: fixed; inset: auto; margin: 0; padding: 8px; width: min(280px, calc(100vw - 24px));
  max-height: min(340px, calc(100dvh - 24px)); overflow: auto; box-sizing: border-box;
  border: 1px solid var(--box-primary, var(--dw-border)); border-radius: 10px;
  background: radial-gradient(ellipse at 15% 0%, rgba(var(--box-primary-rgb,113,210,255), .07), transparent 70%), var(--dw-background);
  color: var(--dw-text);
  box-shadow: 0 0 10px rgba(var(--box-primary-rgb,113,210,255), .22),
    0 0 24px rgba(var(--box-primary-rgb,113,210,255), .12), 0 8px 24px #0009,
    inset 0 1px 0 rgba(var(--box-primary-rgb,113,210,255), .18);
  &:popover-open { display: block; }
  > header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid rgba(var(--box-primary-rgb,113,210,255), .2);
    color: var(--box-primary, var(--dw-text)); font: 600 .8125rem/1.3 var(--dw-font-ui); }
  > header button { min-width: 44px; min-height: 44px; border: 0; background: transparent; color: var(--dw-text-secondary); cursor: pointer; border-radius: 4px;
    &:hover { color: var(--box-primary, var(--dw-text)); background: var(--dw-surface-raised); }
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; } }
  > span a { white-space: normal; overflow-wrap: anywhere; }
`;
export default function CompactTagRow({ tags = [], name = 'record', boxId, className, returnKey, maxRows = 1, editable = false, onRemove, disabled = false }) {
  const id = useId();
  const source = useTagReturnSnapshot();
  const popupKey = returnKey || `${name}:${boxId || ''}:${tags.join('|')}`;
  const restoreRef = useRef(source?.tagPopupKey === popupKey ? source : null);
  const [restoreTrigger, setRestoreTrigger] = useState(Boolean(restoreRef.current));
  const previewRef = useRef(null);
  const triggerRef = useRef(null);
  const bubbleRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [rows, setRows] = useState(1);
  const [visible, setVisible] = useState(tags.length);
  const [position, setPosition] = useState({ top: 12, left: 12 });
  useEffect(() => {
    const preview = previewRef.current;
    const check = () => {
      const links = [...preview.querySelectorAll('[data-tag-chip]')];
      const bounds = preview.getBoundingClientRect();
      setRows(Math.min(maxRows, Math.max(1, Math.ceil((preview.firstElementChild?.getBoundingClientRect().height || 28) / 28))));
      const fits = link => { const rect = link.getBoundingClientRect(); return rect.right <= bounds.right + 1 && rect.bottom <= bounds.top + maxRows * 28 + 1; };
      setOverflow(links.some(link => !fits(link)));
      setVisible(links.filter((link, index) => index === 0 || fits(link)).length);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(preview);
    return () => observer.disconnect();
  }, [tags, maxRows]);
  useLayoutEffect(() => {
    const snapshot = restoreRef.current;
    if (!snapshot || !triggerRef.current || !triggerRef.current.getClientRects().length) return undefined;
    let frame = 0;
    let lastTop = null;
    let stableFrames = 0;
    const started = performance.now();
    const restore = () => {
      if (document.body.style.position === 'fixed') document.body.style.top = `-${snapshot.scrollY || 0}px`;
      else window.scrollTo({ top: snapshot.scrollY || 0, behavior: 'instant' });
      for (const saved of snapshot.scrollContainers || []) {
        const element = [...document.querySelectorAll('[data-tag-scroll-key], [id]')].find(node => (node.getAttribute('data-tag-scroll-key') || node.id) === saved.key);
        if (element) element.scrollTop = saved.top;
      }
      const anchor = triggerRef.current?.getBoundingClientRect();
      if (!anchor) return;
      stableFrames = lastTop !== null && Math.abs(anchor.top - lastTop) < .5 ? stableFrames + 1 : 0;
      lastTop = anchor.top;
      if ((stableFrames < 3 || anchor.top < 0 || anchor.bottom > window.innerHeight) && performance.now() - started < 2000) {
        frame = requestAnimationFrame(restore); return;
      }
      bubbleRef.current.showPopover();
      bubbleRef.current.scrollTop = snapshot.tagPopupScrollTop || 0;
      const focusLink = [...bubbleRef.current.querySelectorAll('a')].find(link => link.getAttribute('href') === snapshot.tagPopupFocusHref);
      focusLink?.focus({ preventScroll: true });
      restoreRef.current = null;
    };
    frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [overflow]);
  useLayoutEffect(() => {
    if (!open) return undefined;
    const bubble = bubbleRef.current;
    const place = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      if (!anchor) { bubble.hidePopover(); return; }
      if (anchor.bottom < 0 || anchor.top > window.innerHeight) { bubble.hidePopover(); return; }
      const next = getTagBubblePlacement(anchor, bubble.scrollHeight + 2,
        { width: window.innerWidth, height: window.innerHeight });
      setPosition(previous => Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(bubble);
    window.addEventListener('resize', place);
    const onScroll = event => { if (!bubble.contains(event.target)) place(); };
    window.addEventListener('scroll', onScroll, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', onScroll, true); };
  }, [open, overflow]);
  return <Summary $rows={rows} className={className} style={boxId !== undefined ? getBoxThemeCssVars(getBoxTheme(boxId)) : undefined} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    <Preview ref={previewRef} $visible={visible} $rows={rows} $maxRows={maxRows}><TagLinks tags={tags} editable={editable} onRemove={onRemove} disabled={disabled} /></Preview>
    {(overflow || restoreTrigger) && <More ref={triggerRef} type="button" popoverTarget={id} aria-label={`Show all tags for ${name}`}>…</More>}
    <Bubble ref={bubbleRef} data-tag-popup={popupKey} data-tag-return-scroll={restoreTrigger ? source?.scrollY : undefined} onToggle={event => { const next = event.currentTarget.matches(':popover-open'); setOpen(next); if (!next) setRestoreTrigger(false); }} id={id} popover="auto" role="dialog" aria-label={`All tags for ${name}`} style={position}>
      <header>Tags<button type="button" popoverTarget={id} popoverTargetAction="hide" aria-label="Close tag list">×</button></header>
      <TagLinks tags={tags} editable={editable} onRemove={onRemove} disabled={disabled} />
    </Bubble>
  </Summary>;
}
