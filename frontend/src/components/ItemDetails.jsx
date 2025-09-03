// ItemDetails.jsx
import React from 'react';
import styled from 'styled-components';
import fillerImg from '/src/assets/filler.jpeg'; // <- your filler image

// Outer container inside the expanded panel
const Wrap = styled.section`
  display: grid;
  gap: 12px;
  padding: 12px 12px 14px;
  color: #e6e6e6;
`;

/* Top: two columns – thumbnail (fixed) + quick facts (flex) */
const TopRow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 140px 1fr; /* always two cols, mobile-first */
  align-items: start;

  @media (min-width: 900px) {
    grid-template-columns: 160px 1fr;
  }
`;

const Thumb = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
  background: #0f0f0f;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover; /* crop to square */
  display: block;
`;

const QuickFacts = styled.div`
  display: grid;
  gap: 8px;
  align-content: start;
`;

/* Reusable key/value rows */
const InfoList = styled.div`
  display: grid;
  gap: 6px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  align-items: baseline;

  @media (max-width: 420px) {
    grid-template-columns: 100px 1fr;
  }
`;

const InfoKey = styled.div`
  color: #a6f3bf;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.01em;
`;

const InfoVal = styled.div`
  color: #dcdcdc;
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
`;

/* Notes block (long text allowed) */
const NotesBlock = styled.div`
  color: #d8d8d8;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap; /* keep user line breaks */
  word-break: break-word; /* prevent overflow on long tokens */
`;

/* Tags row (clickable, scales on mobile) */
const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.button`
  all: unset;
  cursor: pointer;
  display: inline-block;

  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 999px;

  font-size: 0.9rem;
  font-weight: 600;
  color: #eaeaea;
  padding: 6px 10px;
  margin: 2px 0;

  @media (max-width: 740px) {
    font-size: 1rem;
    padding: 8px 12px; /* larger tap target on phones */
  }

  &:hover {
    border-color: #3a3a3a;
    background: #222;
  }
  &:active {
    transform: translateY(1px);
  }
`;

/* Footer actions (e.g., “View Item Page”) */
const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const LinkButton = styled.button`
  all: unset;
  cursor: pointer;
  color: #7ee0a1;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid transparent;

  &:hover {
    border-color: #2a4536;
    background: #122019;
  }
`;

/* Utility: format currency safely */
const fmtCurrency = (val, currency = 'USD') => {
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toLocaleString()}`;
  }
};

export default function ItemDetails({
  item,
  onOpenItem, // optional: () => void (navigates to item page)
  onGoToTag, // optional: (tag) => void (navigates to /tags/:tag)
}) {
  if (!item) return null;

  // Base fields
  const name = item?.name || '(Unnamed Item)';
  const notes = item?.notes || ''; // standardized
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const qty = item?.quantity ?? item?.qty ?? null;
  const value = item?.value ?? null; // monetary (number)
  const sku = item?.sku ?? item?.SKU ?? null;
  const brand = item?.brand ?? null;
  const model = item?.model ?? null;
  const serial = item?.serial ?? item?.serialNumber ?? null;
  const cond = item?.condition ?? null;
  const cat = item?.category ?? null;
  const acquired = item?.acquiredDate ?? item?.acquired ?? null;

  // Image
  const imgSrc = item?.imageUrl || fillerImg;

  // Build quick facts (only show rows that exist)
  const quickFacts = [
    ['Quantity', qty != null ? String(qty) : null],
    ['Value', value != null ? fmtCurrency(value) : null],
    ['SKU', sku],
    ['Brand', brand],
    ['Model', model],
    ['Serial', serial],
    ['Condition', cond],
    ['Category', cat],
    ['Acquired', acquired],
  ].filter(([, v]) => v != null && v !== '');

  return (
    <Wrap>
      <TopRow>
        <Thumb>
          <Img src={imgSrc} alt={name} />
        </Thumb>

        <QuickFacts>
          {/* Key/Value grid */}
          {quickFacts.length > 0 && (
            <InfoList>
              {quickFacts.map(([k, v]) => (
                <InfoRow key={k}>
                  <InfoKey>{k}</InfoKey>
                  <InfoVal>{v}</InfoVal>
                </InfoRow>
              ))}
            </InfoList>
          )}

          {/* Tags */}
          <div>
            <TagRow>
              {tags.length
                ? tags.map((t) => (
                    <TagChip
                      key={`itemtag-${t}`}
                      onClick={() => onGoToTag?.(t)}
                    >
                      #{t}
                    </TagChip>
                  ))
                : null}
            </TagRow>
          </div>
        </QuickFacts>
      </TopRow>

      {/* Notes (long text) */}
      {notes ? <NotesBlock>{notes}</NotesBlock> : null}

      {/* Footer action */}
      {onOpenItem && (
        <FooterRow>
          <LinkButton onClick={onOpenItem}>View Item Page</LinkButton>
        </FooterRow>
      )}
    </Wrap>
  );
}
