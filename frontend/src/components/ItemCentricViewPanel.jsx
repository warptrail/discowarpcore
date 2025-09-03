// src/components/ItemCentricViewPanel.jsx
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

/**
 * ItemCentricViewPanel
 * Props:
 *   - item: the enriched item object from your API (see example in your message)
 *   - fallbackSrc (optional): path to a local filler image (default provided)
 *   - onClose (optional): callback to close a side panel or modal
 */
export default function ItemCentricViewPanel({
  item,
  fallbackSrc = '/assets/filler-item.png',
  onClose,
}) {
  const [imgSrc, setImgSrc] = useState(item?.imagePath || fallbackSrc);

  const orphaned = !item?.box;
  const tags = useMemo(
    () => (Array.isArray(item?.tags) ? item.tags : []),
    [item]
  );

  if (!item) {
    return (
      <Panel role="region" aria-live="polite">
        <EmptyState>Item not found.</EmptyState>
      </Panel>
    );
  }

  return (
    <Panel role="region" aria-label={`Item details: ${item.name}`}>
      <HeaderRow>
        <Title>{item.name}</Title>
        <Actions>
          {onClose && (
            <GhostButton onClick={onClose} aria-label="Close details panel">
              ✕
            </GhostButton>
          )}
        </Actions>
      </HeaderRow>

      <MediaRow>
        <Thumb
          src={imgSrc}
          alt={item.name}
          onError={() => setImgSrc(fallbackSrc)}
          loading="eager"
        />
        <QuickFacts>
          <Fact>
            <FactLabel>Quantity:</FactLabel>
            <FactValue>{item.quantity ?? 1}</FactValue>
          </Fact>
          <Fact>
            <FactLabel>Status:</FactLabel>
            <FactValue>{orphaned ? 'Orphaned' : 'Assigned'}</FactValue>
          </Fact>
          {!orphaned && (
            <Fact>
              <FactLabel>Box:</FactLabel>
              <FactValue>
                <BoxLink
                  to={`/boxes/${item.box.box_id}`}
                  title={`Go to box ${item.box.box_id}`}
                >
                  <BoxBadge>{item.box.box_id}</BoxBadge>
                  <span>{item.box.label}</span>
                </BoxLink>
              </FactValue>
            </Fact>
          )}
        </QuickFacts>
      </MediaRow>

      {item.notes && (
        <Section>
          <SectionTitle>Notes</SectionTitle>
          <Notes>{item.notes}</Notes>
        </Section>
      )}

      {tags.length > 0 && (
        <Section>
          <SectionTitle>Tags</SectionTitle>
          <TagRow>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </TagRow>
        </Section>
      )}
    </Panel>
  );
}

/* -------------------- styled-components -------------------- */

const Panel = styled.section`
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme?.colors?.panelBg || '#0e0f13'};
  color: ${({ theme }) => theme?.colors?.textPrimary || '#e7ecf3'};
  border: 1px solid
    ${({ theme }) => theme?.colors?.border || 'rgba(120, 130, 155, 0.25)'};
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  letter-spacing: 0.3px;
  text-shadow: 0 0 12px rgba(0, 255, 255, 0.1);
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const GhostButton = styled.button`
  background: transparent;
  border: 1px solid
    ${({ theme }) => theme?.colors?.border || 'rgba(120, 130, 155, 0.35)'};
  color: ${({ theme }) => theme?.colors?.textSecondary || '#b9c3cf'};
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease;
  &:hover {
    transform: translateY(-1px);
    border-color: ${({ theme }) => theme?.colors?.accent || '#4debd4'};
  }
`;

const MediaRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  margin-top: 14px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Thumb = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid
    ${({ theme }) => theme?.colors?.accentDim || 'rgba(77, 235, 212, 0.35)'};
  box-shadow: 0 0 0 4px rgba(77, 235, 212, 0.06),
    inset 0 0 24px rgba(77, 235, 212, 0.05);
`;

const QuickFacts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  row-gap: 8px;
  column-gap: 10px;
  align-content: start;
`;

const Fact = styled.div`
  display: contents;
`;

const FactLabel = styled.dt`
  color: ${({ theme }) => theme?.colors?.textSecondary || '#a9b2bf'};
  font-size: 0.9rem;
`;

const FactValue = styled.dd`
  margin: 0;
  font-size: 0.95rem;
`;

const BoxLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme?.colors?.link || '#9ae7ff'};
  &:hover {
    text-decoration: underline;
  }
`;

const BoxBadge = styled.span`
  display: inline-block;
  min-width: 38px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme?.colors?.accent || '#4debd4'};
  color: ${({ theme }) => theme?.colors?.accentText || '#bff6ef'};
  font-size: 0.8rem;
  text-align: center;
  background: linear-gradient(
    180deg,
    rgba(77, 235, 212, 0.08),
    rgba(77, 235, 212, 0.02)
  );
`;

const Section = styled.section`
  margin-top: 16px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#a9b2bf'};
  font-weight: 600;
`;

const Notes = styled.p`
  margin: 0;
  line-height: 1.5;
  color: ${({ theme }) => theme?.colors?.textPrimary || '#e7ecf3'};
  white-space: pre-wrap;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px dashed ${({ theme }) => theme?.colors?.accent || '#4debd4'};
  background: rgba(77, 235, 212, 0.06);
  color: ${({ theme }) => theme?.colors?.accentText || '#bff6ef'};
  font-size: 0.85rem;
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#a9b2bf'};
`;
