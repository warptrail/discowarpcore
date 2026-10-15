import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import TagNavigationLink from '../TagNavigationLink';
import { getTagHref } from '../../util/tagNavigation';

const Group = styled.div`
  display: flex; align-items: center; gap: 5px; min-width: 0; flex: 1; overflow: hidden;
`;
const Strip = styled.div`
  display: flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; flex: 1;
  cursor: pointer;
`;
const Expand = styled.button`
  flex-shrink: 0; width: 44px; min-height: 44px; padding: 0; border: 0; outline: none;
  background: transparent; color: var(--retrieval-mode-accent); font: 600 1rem var(--dw-font-ui); cursor: pointer;
  &:hover, &:focus-visible { background: var(--dw-surface-raised); color: var(--dw-text); border-radius: 4px; }
`;
const Chip = styled(TagNavigationLink)`
  min-width: 0; max-width: min(11rem, 100%); padding: 0; flex-shrink: 0;
  > span { padding: 3px 7px; border: 1px solid color-mix(in srgb, var(--retrieval-mode-accent) 38%, transparent);
    border-radius: 4px; background: var(--dw-surface-raised); color: var(--retrieval-mode-accent);
    font: 600 .8125rem/1.3 var(--dw-font-ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &:hover > span { color: var(--dw-text); border-color: var(--retrieval-mode-accent); }
`;
const Operator = styled.button`
  display: inline-flex; align-items: center; gap: 2px; min-height: 44px; padding: 0 2px;
  border: 0; background: transparent; cursor: pointer; flex-shrink: 0;
  > span { padding: 4px 5px; border-radius: 3px; color: var(--dw-text-secondary); font: 600 .6875rem/1.3 var(--dw-font-ui); }
  > span[data-active='true'] { color: var(--retrieval-mode-accent); background: var(--dw-surface-raised);
    box-shadow: inset 0 -1px var(--retrieval-mode-accent); }
  &:hover { background: var(--dw-surface-raised); border-radius: 4px; }
  &:focus, &:focus-visible { outline: none; border: 0; box-shadow: none; background: var(--dw-surface-raised); border-radius: 4px; }
  &:focus-visible > span { color: var(--dw-text); text-shadow: 0 0 8px var(--retrieval-mode-accent); }
`;

export default function TagCollectionChips({ tags, operator, onChange, onExpand, expanded = false }) {
  const stripRef = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(tags.length);
  useEffect(() => {
    const strip = stripRef.current;
    const check = () => {
      setOverflow(strip.scrollWidth > strip.clientWidth + 1);
      const edge = strip.getBoundingClientRect().right;
      setVisibleCount([...strip.children].filter((chip, index) => index === 0 || chip.getBoundingClientRect().right <= edge + 1).length);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [tags]);
  const all = operator === 'and';
  return <Group aria-label="Collection tags and matching rule">
    <Strip ref={stripRef} title={tags.map(tag => '#' + tag).join(' ')} onClick={event => { if (!event.target.closest('a, button')) onExpand?.(); }}>
      {tags.map((tag, index) => <Chip style={{ visibility: index < visibleCount ? 'visible' : 'hidden' }} key={tag} to={getTagHref(tag)} title={'#' + tag}><span>#{tag}</span></Chip>)}
    </Strip>
    {overflow && onExpand && <Expand type="button" aria-label="Expand full tag combination" aria-expanded={expanded}
      aria-controls="tag-collection-editor" onClick={onExpand}>…</Expand>}
    {tags.length > 1 && onChange && <Operator type="button" aria-pressed={all}
      aria-label={`Match ${all ? 'all tags (AND)' : 'any tag (OR)'}. Switch to ${all ? 'OR' : 'AND'}.`}
      title={all ? 'Match every tag · Switch to OR' : 'Match any tag · Switch to AND'}
      onClick={() => onChange(tags, all ? 'or' : 'and')}>
      <span data-active={all}>AND</span><span data-active={!all}>OR</span>
    </Operator>}
  </Group>;
}
