import React, { useContext, useEffect, useMemo, useState } from 'react';

import IntakeQuickItemMaker from '../Intake/IntakeQuickItemMaker';
import MiniOrphanedList from '../MiniOrphanedList';
import { ToastContext } from '../Toast';
import * as S from './BoxDetailTabContent.styles';

const ORPHAN_SORT_OPTIONS = [
  { value: 'recent', label: 'Date Orphaned (Newest)' },
  { value: 'oldest', label: 'Date Orphaned (Oldest)' },
  { value: 'alpha', label: 'Alphabetical (A-Z)' },
];

function formatBoxContextLabel(box) {
  const shortId = String(box?.box_id || '').trim();
  const label = String(box?.label || box?.name || '').trim();
  if (shortId && label) return `#${shortId} ${label}`;
  if (shortId) return `#${shortId}`;
  if (label) return label;
  return 'Selected box';
}

export default function BoxInlineItemActions({
  box,
  onItemsChanged,
  compact = false,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [activePanel, setActivePanel] = useState('');

  const selectedBox = useMemo(() => {
    const mongoId = String(box?._id ?? box?.id ?? '').trim();
    if (!mongoId) return null;

    return {
      _id: mongoId,
      box_id: String(box?.box_id ?? box?.shortId ?? '').trim(),
      label: String(box?.label ?? box?.name ?? '').trim(),
    };
  }, [box]);

  const selectedBoxContext = formatBoxContextLabel(selectedBox);

  useEffect(() => {
    setActivePanel('');
  }, [selectedBox?._id]);

  const handleToggle = (nextPanel) => {
    setActivePanel((prev) => (prev === nextPanel ? '' : nextPanel));
  };

  const handleQuickItemCreated = async (payload = {}) => {
    const itemName = String(payload?.item?.name || '').trim();
    const fallbackMessage = itemName
      ? `Created "${itemName}" in ${selectedBoxContext}.`
      : `Created item in ${selectedBoxContext}.`;
    const message = String(payload?.message || '').trim() || fallbackMessage;

    showToast?.({
      variant: 'success',
      title: 'Item created',
      message,
      timeoutMs: 2800,
    });
    await Promise.resolve(onItemsChanged?.());
  };

  const handleOrphanAssigned = async () => {
    await Promise.resolve(onItemsChanged?.());
  };

  return (
    <S.InlineActionsArea $compact={compact}>
      <S.InlineActionsRow $compact={compact}>
        <S.InlineActionButton $compact={compact}
          type="button"
          $active={activePanel === 'create'}
          onClick={() => handleToggle('create')}
          disabled={!selectedBox?._id}
        >
          {activePanel === 'create'
            ? 'Hide Quick Create'
            : 'Quick Create Item in This Box'}
        </S.InlineActionButton>

        <S.InlineActionButton $compact={compact}
          type="button"
          $tone="assign"
          $active={activePanel === 'assign'}
          onClick={() => handleToggle('assign')}
          disabled={!selectedBox?._id}
        >
          {activePanel === 'assign'
            ? 'Hide Items Adrift'
            : 'Assign Item Adrift to This Box'}
        </S.InlineActionButton>
      </S.InlineActionsRow>

      {!selectedBox?._id ? (
        <S.QuickCreateNotice>
          Select a box to enable inline create and Items Adrift assignment actions.
        </S.QuickCreateNotice>
      ) : null}

      {activePanel === 'create' && selectedBox?._id ? (
        <S.InlinePanelShell>
          <S.InlinePanelHeader>
            <S.InlinePanelTitle>Quick Item Maker</S.InlinePanelTitle>
            <S.InlinePanelContext>
              Creating inside: {selectedBoxContext}
            </S.InlinePanelContext>
          </S.InlinePanelHeader>

          <IntakeQuickItemMaker
            mode="inBox"
            targetBox={selectedBox}
            title="Quick Item Maker"
            hint={`Creating inside: ${selectedBoxContext}`}
            submitLabel="Create Item in Box"
            onItemCreated={handleQuickItemCreated}
          />
        </S.InlinePanelShell>
      ) : null}

      {activePanel === 'assign' && selectedBox?._id ? (
        <S.InlinePanelShell>
          <S.InlinePanelHeader>
            <S.InlinePanelTitle>Assign Items Adrift</S.InlinePanelTitle>
            <S.InlinePanelContext>
              Target: {selectedBoxContext}
            </S.InlinePanelContext>
          </S.InlinePanelHeader>

          <MiniOrphanedList
            boxMongoId={selectedBox._id}
            title="Items Adrift"
            assignLabel="Assign"
            showControls
            paginationMode="paged"
            fixedViewportHeight="min(68vh, 560px)"
            searchPlaceholder="Search Items Adrift..."
            sortOptions={ORPHAN_SORT_OPTIONS}
            emptyText="No Items Adrift match the current search."
            assignSuccessMessage={(item) => {
              const itemName = String(item?.name || '').trim();
              return itemName
                ? `Assigned "${itemName}" from Items Adrift to ${selectedBoxContext}.`
                : `Assigned an item from Items Adrift to ${selectedBoxContext}.`;
            }}
            onItemAssigned={handleOrphanAssigned}
          />
        </S.InlinePanelShell>
      ) : null}
    </S.InlineActionsArea>
  );
}
