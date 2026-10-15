import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RetrievalItemLog from './RetrievalItemLog';
import RetrievalItemCommands from './RetrievalItemCommands';
import RetrievalMetadata from './RetrievalMetadata';
import RetrievalItemOverview from './RetrievalItemOverview';
import RetrievalEditableField from './RetrievalEditableField';
import { getRetrievalItemControlModel } from './retrievalItemControlModel';
import * as S from './RetrievalItemPanel.styles';

const FinderItemNotes = lazy(() => import('../InventoryQuickAnswer/FinderItemNotes'));
const SECTIONS = [
  { key: 'overview', label: 'Overview', path: 'M3 3h6v6H3zM13 3h6v6h-6zM3 13h6v6H3zM13 13h6v6h-6z' },
  { key: 'notes', label: 'Notes', path: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5' },
  { key: 'log', label: 'Log', path: 'M12 4a8 8 0 1 1-7 4M3 3v5h5M12 8v5l3 2' },
  { key: 'data', label: 'Data', path: 'M4 6h16M4 12h16M4 18h16M9 3v6M15 9v6M8 15v6' },
  { key: 'commands', label: 'Commands', path: 'm5 7 5 5-5 5M13 17h6' },
];

export default function RetrievalExpandedPanel({ item, panelId, detailResource, themeStyle,
  activeSectionKey: controlledSectionKey, onSectionChange, onLifecycleAction,
  onPreviewImage, onClose, itemNavigationState, onItemUpdated, query = '' }) {
  const [localSectionKey, setLocalSectionKey] = useState('overview');
  const contentRef = useRef(null);
  const model = useMemo(() => getRetrievalItemControlModel(item, detailResource?.data), [item, detailResource?.data]);
  const selectedKey = controlledSectionKey || localSectionKey;
  const activeIndex = Math.max(0, SECTIONS.findIndex(({ key }) => key === selectedKey));
  const activeKey = SECTIONS[activeIndex].key;
  const selectSection = (index) => {
    const key = SECTIONS[(index + SECTIONS.length) % SECTIONS.length].key;
    setLocalSectionKey(key); onSectionChange?.(key);
  };
  const onTabKeyDown = (event) => {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? SECTIONS.length - 1
      : event.key === 'ArrowRight' ? (activeIndex + 1) % SECTIONS.length
        : event.key === 'ArrowLeft' ? (activeIndex + SECTIONS.length - 1) % SECTIONS.length : null;
    if (next == null) return;
    event.preventDefault(); selectSection(next);
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };
  useEffect(() => { contentRef.current?.scrollTo({ top: 0 }); }, [activeKey, item?.id]);
  if (!item) return null;
  const boxHref = model.answer.unboxed ? '/operations?peek=adrift' : item.boxHref || (model.answer.boxId ? `/boxes/${model.answer.boxId}` : '');
  return <S.Panel id={panelId} role="region" aria-label={`Retrieval details for ${model.answer.name}`} style={themeStyle}>
    <S.Tabs $overview={activeKey === 'overview'} role="tablist" aria-label={`Information sections for ${model.answer.name}`} onKeyDown={onTabKeyDown}>
      {SECTIONS.map((section, index) => <S.Tab key={section.key} type="button" role="tab"
        id={`${panelId}-${section.key}-tab`} aria-controls={`${panelId}-${section.key}`}
        aria-selected={index === activeIndex} tabIndex={index === activeIndex ? 0 : -1}
        title={section.key === 'data' ? 'Full metadata and field updates' : section.label} onClick={() => selectSection(index)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={section.path} /></svg><span>{section.label}</span>
      </S.Tab>)}
    </S.Tabs>
    <S.Content ref={contentRef} role="tabpanel" id={`${panelId}-${activeKey}`} aria-labelledby={`${panelId}-${activeKey}-tab`}
      tabIndex={0} $notes={activeKey === 'notes'} $commands={activeKey === 'commands'}>
      {activeKey === 'overview' ? <RetrievalItemOverview item={item} model={model} query={query}
        onPreviewImage={onPreviewImage} detailResource={detailResource} />
        : activeKey === 'notes' ? <Suspense fallback={<S.Status role="status">Loading notes…</S.Status>}>
        <FinderItemNotes key={item.id} notes={model.answer.item.notes} query={query}
          titleAction={<RetrievalEditableField fieldKey="notes" variant="action" />} />
      </Suspense> : activeKey === 'log' ? <RetrievalItemLog model={model} item={detailResource?.data} detailResource={detailResource} />
        : activeKey === 'data' ? <RetrievalMetadata key={item.id} item={detailResource?.data} pages={model.dataPages} detailResource={detailResource} />
          : <RetrievalItemCommands item={item} model={model} detailResource={detailResource} onLifecycleAction={onLifecycleAction} onClose={onClose} onItemUpdated={onItemUpdated} />}
    </S.Content>
    <S.Footer>
      {boxHref ? <Link to={boxHref} state={itemNavigationState}
        aria-label={model.answer.unboxed ? 'Items Adrift' : `Open box ${model.answer.boxId || ''}`}
        title={model.answer.unboxed ? 'Open Items Adrift' : `Open box ${model.answer.boxId || ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={model.answer.unboxed
          ? 'M4 12v8h16v-8M4 16h5l2 3h2l2-3h5M12 3v10M8 9l4 4 4-4'
          : 'm12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10 9-5M12 13 3 8m9 5v8M7.5 5.5l9 5'} /></svg>
        <span>{model.answer.unboxed ? 'Items Adrift' : `Box ${model.answer.boxId || ''}`}</span>
      </Link> : null}
      <Link to={item.itemHref || `/items/${item.id}`} state={itemNavigationState} title={`Open item page for ${model.answer.name}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h7M8 17h7" /></svg>
        <span>Item page</span>
      </Link>
    </S.Footer>
  </S.Panel>;
}
