import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
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

export default function BulkImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedBatchId = String(searchParams.get('batch') || '').trim();

  const syncBatchParam = useCallback((nextBatchId) => {
    const normalizedBatchId = String(nextBatchId || '').trim();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (normalizedBatchId) {
        next.set('batch', normalizedBatchId);
      } else {
        next.delete('batch');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearInvalidBatchParam = useCallback((invalidBatchId) => {
    const normalizedBatchId = String(invalidBatchId || '').trim();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (String(next.get('batch') || '').trim() === normalizedBatchId) {
        next.delete('batch');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <Wrap>
      <Intro>
        <Title>AI Bulk Import</Title>
        <IntroText>
          Upload one AI-assisted intake package, validate its JSON manifest against the current
          item schema, then import it into the existing item system.
        </IntroText>
        <IntroText>
          For local AI-assisted capture, use <code>npm run intake:tui</code>. This screen remains
          available for manual upload, recovery, provenance review, and fallback imports.
        </IntroText>
      </Intro>

      <BulkImportAiJsonPanel
        selectedBatchIdOverride={linkedBatchId}
        onSelectedBatchIdChange={syncBatchParam}
        onSelectedBatchIdInvalid={clearInvalidBatchParam}
      />
    </Wrap>
  );
}
