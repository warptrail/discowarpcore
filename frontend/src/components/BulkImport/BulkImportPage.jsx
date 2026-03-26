import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';
import BulkImportTextPanel from './BulkImportTextPanel';
import BulkImportAiJsonPanel from './BulkImportAiJsonPanel';

const Wrap = styled.div`
  display: grid;
  gap: 0.72rem;
`;

const Intro = styled.section`
  border: 1px solid rgba(77, 138, 180, 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(13, 22, 31, 0.93) 0%, rgba(9, 16, 24, 0.96) 100%);
  padding: 0.78rem 0.86rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.08rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2effc;
`;

const IntroText = styled.p`
  margin: 0.36rem 0 0;
  color: #a8c0d8;
  font-size: 0.84rem;
  line-height: 1.45;
`;

const TabRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.52rem;
`;

const TabButton = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 11px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(106, 177, 225, 0.86)' : 'rgba(95, 145, 182, 0.56)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(24, 66, 94, 0.96) 0%, rgba(16, 44, 65, 0.96) 100%)'
      : 'linear-gradient(180deg, rgba(14, 27, 40, 0.95) 0%, rgba(10, 20, 31, 0.96) 100%)'};
  color: ${({ $active }) => ($active ? '#e5f4ff' : '#a8c0d8')};
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: ${({ $active }) => ($active ? 800 : 700)};
  cursor: pointer;

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const TabSubtext = styled.div`
  min-height: 1rem;
  font-size: 0.76rem;
  color: #a6c0d8;
`;

export default function BulkImportPage() {
  const [activeTab, setActiveTab] = useState('text');

  const tabSubtext = useMemo(() => {
    if (activeTab === 'ai') {
      return 'AI JSON mode validates schema, then imports normalized items with audit logging.';
    }
    return 'Text mode imports one item name per line exactly as before.';
  }, [activeTab]);

  return (
    <Wrap>
      <Intro>
        <Title>Bulk Import</Title>
        <IntroText>
          Choose a mode: plain-text item names or standardized AI JSON payload import.
          Both modes import into the existing item system and support orphaned imports.
        </IntroText>
      </Intro>

      <TabRow role="tablist" aria-label="Import mode">
        <TabButton
          type="button"
          role="tab"
          aria-selected={activeTab === 'text'}
          $active={activeTab === 'text'}
          onClick={() => setActiveTab('text')}
        >
          Text Import
        </TabButton>
        <TabButton
          type="button"
          role="tab"
          aria-selected={activeTab === 'ai'}
          $active={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        >
          AI JSON Import
        </TabButton>
      </TabRow>

      <TabSubtext>{tabSubtext}</TabSubtext>

      {activeTab === 'text' ? <BulkImportTextPanel /> : <BulkImportAiJsonPanel />}
    </Wrap>
  );
}
