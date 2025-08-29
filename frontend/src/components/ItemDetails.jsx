// ItemDetails.jsx
import React from 'react';
import styled from 'styled-components';

const DetailsInner = styled.div`
  min-height: 0;
  display: grid;
  gap: 10px;
  padding: 8px 4px 10px;
`;

const Thumb = styled.div`
  height: 140px;
  border-radius: 8px;
  background: linear-gradient(
      180deg,
      rgba(63, 164, 106, 0.18),
      rgba(30, 30, 30, 0.25)
    ),
    radial-gradient(
      35% 50% at 50% 0%,
      rgba(63, 164, 106, 0.22),
      transparent 70%
    ),
    #111;
  border: 1px solid #2a2a2a;
`;

const FullDesc = styled.div`
  color: #cfcfcf;
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
`;

const TagBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow: hidden;
  min-height: 26px;
`;

const TagChip = styled.span`
  white-space: nowrap;
  font-size: 11px;
  color: #d7d7d7;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 999px;
  padding: 4px 8px;
`;

const RowFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
  color: #9ea39f;
  font-size: 12px;
  opacity: 0.9;
`;

const ActionLink = styled.button`
  all: unset;
  cursor: pointer;
  color: #7ee0a1;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;

  &:hover {
    border-color: #2a4536;
    background: #122019;
  }
`;

export default function ItemDetails({
  item,
  onOpenItem, // () => void  (navigate to item page)
}) {
  if (!item) return null;

  const name = item?.name || '(Unnamed Item)';
  const desc = item?.description || item?.desc || '';
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const qty = item?.quantity ?? item?.qty ?? 1;

  return (
    <DetailsInner>
      {/* Filler image for now */}
      <Thumb aria-label={`${name} image`} />

      {/* Full description (no clamp) */}
      {desc ? <FullDesc>{desc}</FullDesc> : null}

      {/* Tags (present even if empty to keep rhythm consistent) */}
      <TagBar>
        {tags.length
          ? tags
              .slice(0, 24)
              .map((t) => <TagChip key={`${item._id}-${t}`}>#{t}</TagChip>)
          : null}
      </TagBar>

      <RowFooter>
        <div>Quantity: {qty}</div>
        <ActionLink onClick={onOpenItem}>Open item page</ActionLink>
      </RowFooter>
    </DetailsInner>
  );
}
