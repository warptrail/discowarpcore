import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getItemHomeHref } from '../../api/itemDetails';
import { rememberAllItemsReturn } from './allItemsReturnState';

const Printout = styled.div`
  position: absolute;
  z-index: 40;
  top: calc(100% - 5px);
  left: 0.5rem;
  right: 0.5rem;
  animation: print-card 180ms cubic-bezier(0.2, 0.78, 0.24, 1) both;

  @keyframes print-card {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Deck = styled.section`
  display: grid;
  grid-template-rows: auto minmax(150px, 1fr) auto;
  height: min(350px, 52dvh);
  overflow: hidden;
  border: 1px solid rgba(103, 212, 202, 0.46);
  border-radius: 2px 2px 8px 8px;
  background: #091015;
  box-shadow:
    0 20px 42px rgba(0, 0, 0, 0.72),
    inset 3px 0 0 rgba(103, 212, 202, 0.12);
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  padding: 0.66rem 0.72rem;
  border-bottom: 1px solid rgba(127, 215, 255, 0.12);
  background: #0b1319;
`;

const Name = styled.h2`
  margin: 0;
  overflow: hidden;
  color: #e6edf3;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Position = styled.div`
  margin-top: 0.2rem;
  color: #67d4ca;
  font: 0.68rem/1.2 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Close = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid rgba(127, 215, 255, 0.26);
  border-radius: 3px;
  background: #0d171e;
  color: #d8f3ff;
  font-size: 1rem;
`;

const Card = styled.div`
  margin: 0;
  padding: 0.9rem 1rem;
  overflow: auto;
  border: 0;
  background: #0b1218;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.8rem;
  color: #4cc6c1;
  font: 800 0.72rem/1.2 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

const DataList = styled.dl`
  display: grid;
  grid-template-columns: minmax(86px, auto) minmax(0, 1fr);
  gap: 0.6rem 0.8rem;
  margin: 0;

  dt {
    color: rgba(185, 195, 205, 0.64);
    font: 0.68rem/1.35 "SFMono-Regular", Consolas, monospace;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    color: rgba(230, 237, 243, 0.94);
    font-size: 0.83rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
`;

const Footer = styled.footer`
  display: grid;
  grid-template-columns: minmax(48px, 0.42fr) minmax(120px, 1fr) minmax(48px, 0.42fr);
  gap: 0.42rem;
  padding: 0.58rem 0.7rem 0.68rem;
  border-top: 1px solid rgba(127, 215, 255, 0.12);
  background: #0a1117;
`;

const NavButton = styled.button`
  min-height: 42px;
  border: 1px solid rgba(127, 215, 255, 0.3);
  border-radius: 3px;
  background: #0d161d;
  color: #e6edf3;
  font: 900 2rem/0.8 "SFMono-Regular", Consolas, monospace;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(103, 212, 202, 0.72);
    background: rgba(18, 48, 60, 0.94);
    color: #aef9ef;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const OpenItemButton = styled.button`
  min-height: 42px;
  border: 1px solid rgba(103, 212, 202, 0.58);
  border-radius: 3px;
  background: #12303c;
  color: #e6edf3;
  font: 820 0.68rem/1 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: #174353;
    box-shadow: 0 0 14px rgba(103, 212, 202, 0.18);
  }

  &:active {
    transform: translateY(1px);
  }
`;

function valueOrDash(value) {
  const text = Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value || '').trim();
  return text || '—';
}

export default function AllItemsMobileDetailDeck({ item, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sectionIndex, setSectionIndex] = useState(0);
  useEffect(() => {
    setSectionIndex(0);
  }, [item?._id]);

  const meta = item?._allItems || {};
  const sections = [
    {
      title: 'Identity',
      rows: [
        ['Quantity', meta.quantityLabel],
        ['Category', meta.categoryLabel],
        ['Status', meta.statusLabel],
        ['Description', item?.description],
      ],
    },
    {
      title: 'Where It Lives',
      rows: [
        ['Box', [meta.boxId, meta.boxLabel].filter(Boolean).join(' · ')],
        ['Location', meta.locationLabel],
        ['Batch', meta.sourceBatchLabel],
      ],
    },
    {
      title: 'Metadata',
      rows: [
        ['Tags', meta.tags],
        ['Owner', meta.ownerLabel],
        ['Priority', meta.keepPriorityLabel],
        ['Condition', item?.condition],
        ['Value', Number(item?.valueCents) > 0 ? `$${(Number(item.valueCents) / 100).toFixed(2)}` : '—'],
      ],
    },
    {
      title: 'Notes & History',
      rows: [
        ['Notes', item?.notes],
        ['Maintenance', item?.maintenanceNotes],
        ['Acquired', item?.dateAcquired],
        ['Last used', item?.dateLastUsed],
      ],
    },
  ];

  if (!item) return null;
  const section = sections[sectionIndex];
  const itemHref = getItemHomeHref(item._id);
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  const openItemPage = () => {
    const returnSnapshot = {
      returnTo,
      scrollY: window.scrollY,
      itemId: String(item._id || ''),
    };
    rememberAllItemsReturn(returnSnapshot);
    navigate(itemHref, {
      state: {
        allItemsReturn: {
          kind: 'all-items-inline-detail',
          ...returnSnapshot,
        },
      },
    });
  };

  return (
    <Printout>
      <Deck
        role="dialog"
        aria-modal="false"
        aria-label={`Details for ${item.name || 'item'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <Header>
          <div>
            <Name>{item.name || 'Unnamed item'}</Name>
            <Position>{sectionIndex + 1} / {sections.length} · {section.title}</Position>
          </div>
          <Close type="button" onClick={onClose} aria-label="Close item details">×</Close>
        </Header>
        <Card>
          <SectionTitle>{section.title}</SectionTitle>
          <DataList>
            {section.rows.map(([label, value]) => (
              <div key={label} style={{ display: 'contents' }}>
                <dt>{label}</dt>
                <dd>{valueOrDash(value)}</dd>
              </div>
            ))}
          </DataList>
        </Card>
        <Footer>
          <NavButton
            type="button"
            aria-label="Previous item detail section"
            title="Previous section"
            onClick={() => setSectionIndex((current) => (
              current - 1 + sections.length
            ) % sections.length)}
          >
            ‹
          </NavButton>
          <OpenItemButton
            type="button"
            onClick={openItemPage}
            aria-label={`Open ${item.name || 'item'} item page`}
          >
            Open item ↗
          </OpenItemButton>
          <NavButton
            type="button"
            aria-label="Next item detail section"
            title="Next section"
            onClick={() => setSectionIndex((current) => (
              current + 1
            ) % sections.length)}
          >
            ›
          </NavButton>
        </Footer>
      </Deck>
    </Printout>
  );
}
