import { lazy, Suspense, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import ConfigurationTabs from './ConfigurationTabs';
import useIntakeBatchManager from '../BulkImport/useIntakeBatchManager';
import useBulkImportText from '../BulkImport/useBulkImportText';

const Logs = lazy(() => import('../SystemLogsPage'));
const Guide = lazy(() => import('./ConfigurationGuide'));
const Workbench = lazy(() => import('./ConfigurationWorkbench'));
const Upload = lazy(() => import('../BulkImport/IntakeBatchCreatePanel'));
const Batches = lazy(() => import('./ConfigurationBatches'));
const TextUpload = lazy(() => import('../BulkImport/BulkImportTextPanel').then((module) => ({ default: module.BulkImportTextWorkspace })));

const TABS = [
  { id: 'guide', label: 'Introduction', hint: 'How to get started' },
  { id: 'json', label: 'JSON', hint: 'Items without images' },
  { id: 'workbench', label: 'Upload workbench', hint: 'Choose your source' },
  { id: 'package', label: 'AI intake package', hint: 'ZIP manifest + images' },
  { id: 'batches', label: 'Existing batches', hint: 'Review, validate, import' },
  { id: 'text', label: 'Text upload', hint: 'One item per line' },
  { id: 'logs', label: 'Logs', hint: 'Activity and removed items' },
];
const Wrap = styled.div`display: grid; gap: 1.25rem; min-width: 0; padding-bottom: 8px;`;
const Hero = styled.header`
  display: grid;
  gap: 0.5rem;
  padding-block: 0.4rem;
  h1 { margin: 0; font-size: clamp(1.6rem, 4vw, 2.35rem); letter-spacing: -0.035em; }
  p { margin: 0; max-width: 72ch; color: var(--dw-text-secondary); line-height: 1.5; font-size: 0.9rem; }
`;
const Feedback = styled.p`
  margin: 1rem 0 0;
  color: ${({ $tone }) => $tone === 'error' ? 'var(--dw-coral)' : 'var(--dw-teal)'};
  line-height: 1.5;
`;

export default function ConfigurationPage() {
  const textController = useBulkImportText();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedBatchId = String(searchParams.get('batch') || '').trim();
  const requestedTab = searchParams.get('tab');
  const legacyTab = { '#operator-guide': 'guide', '#ai-workbench': 'workbench', '#simple-text-upload': 'text' }[window.location.hash];
  const activeTab = TABS.some((tab) => tab.id === requestedTab)
    ? requestedTab : legacyTab || (linkedBatchId ? 'batches' : 'guide');

  const selectTab = useCallback((id) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', id);
      return next;
    });
  }, [setSearchParams]);
  const syncBatchParam = useCallback((id) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set('batch', id);
      else next.delete('batch');
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const clearInvalidBatchParam = useCallback((id) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (next.get('batch') === id) next.delete('batch');
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const onBatchStaged = useCallback(() => selectTab('batches'), [selectTab]);
  const manager = useIntakeBatchManager({
    enabled: activeTab === 'batches',
    selectedBatchIdOverride: linkedBatchId,
    onSelectedBatchIdChange: syncBatchParam,
    onSelectedBatchIdInvalid: clearInvalidBatchParam,
    onBatchStaged,
  });

  let panel;
  switch (activeTab) {
    case 'json': panel = <Upload mode="json" {...manager.createPanelProps} />; break;
    case 'package': panel = <Upload mode="package" {...manager.createPanelProps} />; break;
    case 'workbench': panel = <Workbench onSelect={selectTab} />; break;
    case 'batches': panel = <Batches manager={manager} />; break;
    case 'logs': panel = <Logs />; break;
    case 'text': panel = <TextUpload controller={textController} />; break;
    default: panel = <Guide />;
  }
  return (
    <Wrap>
      <Hero><h1>Configuration</h1>
        <p>Prepare inventory sources, manage batches, and review activity. Start with the how-to guide,
          then open the workspace you need.</p>
      </Hero>
      <ConfigurationTabs tabs={TABS} activeTab={activeTab} onSelect={selectTab}>
        <Suspense fallback={<p role="status">Loading section…</p>}>{panel}</Suspense>
        {['json', 'package', 'batches'].includes(activeTab) && manager.feedback.message &&
          <Feedback role="status" $tone={manager.feedback.tone}>{manager.feedback.message}</Feedback>}
      </ConfigurationTabs>
    </Wrap>
  );
}
