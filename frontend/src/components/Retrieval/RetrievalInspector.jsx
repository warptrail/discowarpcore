import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import RetrievalItemSheet from './RetrievalItemSheet.styles';
import useIsMobile from '../../hooks/useIsMobile';
import RetrievalExpandedPanel from './RetrievalExpandedPanel';
import RetrievalItemHeading from './RetrievalItemHeading';
import RetrievalItemEditorProvider from './RetrievalItemEditorProvider';
import { useRetrievalItemEditing } from './RetrievalItemEditingContext';
import { getRetrievalItemPanelTheme } from './retrievalItemPanelTheme';

const ContentMount = styled.div`display: flex; flex: 1; min-width: 0; min-height: 0;`;

function RetrievalInspectorContent({ item, onClose, themeStyle, ...panelProps }) {
  const desktop = !useIsMobile(1099);
  const editing = useRetrievalItemEditing();
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null;
    const element = document.createElement('div');
    element.style.cssText = 'display:flex;flex:1;flex-direction:column;min-width:0;min-height:0;';
    return element;
  });
  const attachHost = useCallback((container) => { if (container && host) container.appendChild(host); }, [host]);
  if (!item || !host) return null;
  return <>
    <RetrievalItemSheet compact fillBody centered={desktop}
      headerVariant={panelProps.activeSectionKey === 'overview' || !panelProps.activeSectionKey ? 'handle' : 'mini'}
      keepHeaderVisible={!desktop} slideFromBottom={!desktop} swipeToClose={!desktop}
      openingDurationMs={desktop ? 200 : 360} topOffset={desktop ? 0 : undefined}
      layer={1} titleLabel={item.name} title={<RetrievalItemHeading item={item} detail={panelProps.detailResource?.data}
        sectionKey={panelProps.activeSectionKey} />}
      closeLabel="Close inspection" beforeClose={() => !editing.isActive} onClose={onClose} style={themeStyle}>
      <ContentMount ref={attachHost} />
    </RetrievalItemSheet>
    {createPortal(<RetrievalExpandedPanel item={item} themeStyle={themeStyle} onClose={onClose} {...panelProps} />, host)}
  </>;
}

export default function RetrievalInspector({ item, onClose, ...panelProps }) {
  const themeStyle = getRetrievalItemPanelTheme(item);
  return <RetrievalItemEditorProvider item={panelProps.detailResource?.data}
    detailResource={panelProps.detailResource} onItemUpdated={panelProps.onItemUpdated}
    onBoxUpdated={panelProps.onBoxUpdated} themeStyle={themeStyle}>
    <RetrievalInspectorContent item={item} onClose={onClose} themeStyle={themeStyle} {...panelProps} />
  </RetrievalItemEditorProvider>;
}
