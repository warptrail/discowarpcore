import React, { useState } from 'react';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import * as S from '../styles/ItemPage.styles';
import { getItemOwnershipContext } from '../util/itemOwnership';
import { getDeclutterBoxPurposeForRoute } from '../util/declutterBoxPurpose';
import {
  formatDepartureRoute,
  getItemDepartureRoute,
  isItemPendingDeparture,
} from '../util/itemDeparture';

function getLatestActivityValue(item, actionId) {
  const configByAction = {
    used: { history: 'usageHistory', fallback: 'dateLastUsed' },
    checked: { history: 'checkHistory', fallback: 'lastCheckedAt' },
    maintained: { history: 'maintenanceHistory', fallback: 'lastMaintainedAt' },
    consumed: { fallback: 'disposition_at' },
  };
  const config = configByAction[actionId] || {};
  const history = Array.isArray(item?.[config.history]) ? item[config.history] : [];
  return history[history.length - 1] || item?.[config.fallback] || '';
}

function formatActivityStat(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Not logged';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? `Today · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ItemButtonBar({
  item,
  pending = false,
  error = '',
  onMoveItem,
  onRemoveFromBox,
  timestampActions = [],
  viewMode = 'all',
  onViewModeChange,
  mediaEditorOpen = false,
  onToggleMedia,
  inDeclutterDeck = false,
  declutterPending = false,
  onDeclutter,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const ownership = getItemOwnershipContext(item);
  const box = ownership.box ?? null;
  const boxMongoId = ownership.boxMongoId || (box?._id ? String(box._id) : '');
  const isGone = String(item?.item_status || '').toLowerCase() === 'gone';
  const resolvedTimestampActions = Array.isArray(timestampActions)
    ? timestampActions
    : [];
  const departurePending = isItemPendingDeparture(item);
  const departureRoute = getItemDepartureRoute(item);
  const suggestedBoxPurpose = getDeclutterBoxPurposeForRoute(departureRoute);

  const hasMediaAction = typeof onToggleMedia === 'function';
  const hasViewToggle = typeof onViewModeChange === 'function';
  const hasDeclutterAction = typeof onDeclutter === 'function';

  if (
    resolvedTimestampActions.length === 0 &&
    !hasMediaAction &&
    !hasViewToggle &&
    !hasDeclutterAction
  ) {
    return null;
  }

  const handleSelectDestination = async ({
    destBoxId,
    destLabel,
    destShortId,
    isOrphanedDestination = false,
  }) => {
    if (isOrphanedDestination) {
      if (!boxMongoId || typeof onRemoveFromBox !== 'function') return;
      const ok = await onRemoveFromBox({ boxMongoId });
      if (ok) setShowPicker(false);
      return;
    }
    if (!destBoxId || typeof onMoveItem !== 'function') return;
    const ok = await onMoveItem({
      destBoxId,
      destLabel,
      destShortId,
      sourceBoxId: boxMongoId || undefined,
    });
    if (ok) setShowPicker(false);
  };

  const handleRemoveFromBox = async () => {
    if (!boxMongoId || typeof onRemoveFromBox !== 'function') return;
    const ok = await onRemoveFromBox({ boxMongoId });
    if (ok) setShowPicker(false);
  };

  const showPickerButton = () => setShowPicker((prev) => !prev);
  const editActions = hasMediaAction ? (
    <S.ItemModeActions aria-label="Item editing commands">
      {hasMediaAction ? (
      <S.ItemModeButton
        type="button"
        $active={mediaEditorOpen}
        aria-pressed={mediaEditorOpen}
        onClick={onToggleMedia}
      >
        Edit image
      </S.ItemModeButton>
      ) : null}
    </S.ItemModeActions>
  ) : null;
  const viewToggle = hasViewToggle ? (
    <S.ViewModeNav aria-label="Item detail view">
      <S.ViewModeButton
        type="button"
        $active={viewMode === 'all'}
        aria-current={viewMode === 'all' ? 'page' : undefined}
        onClick={() => onViewModeChange('all')}
      >
        All Data
      </S.ViewModeButton>
      <S.ViewModeButton
        type="button"
        $active={viewMode === 'hierarchy'}
        aria-current={viewMode === 'hierarchy' ? 'page' : undefined}
        onClick={() => onViewModeChange('hierarchy')}
      >
        Hierarchy
      </S.ViewModeButton>
    </S.ViewModeNav>
  ) : null;

  return (
    <S.ItemButtonBar aria-label="Item controls">
      <S.ItemControlsPanel>
          {hasDeclutterAction ? (
            <S.DeclutterControlGroup>
              <S.DeclutterControlButton
                type="button"
                $active={inDeclutterDeck}
                aria-pressed={inDeclutterDeck}
                aria-label={inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add to Declutter Deck'}
                disabled={declutterPending || !item?._id}
                onClick={onDeclutter}
              >
                <S.DeclutterControlContext>Joint decision</S.DeclutterControlContext>
                <S.DeclutterControlTitle>
                  {declutterPending
                    ? inDeclutterDeck ? 'Removing from deck' : 'Adding to deck'
                    : inDeclutterDeck ? 'In Declutter Deck' : 'Add to Declutter Deck'}
                </S.DeclutterControlTitle>
                <S.DeclutterControlState aria-hidden="true">
                  {declutterPending ? '···' : inDeclutterDeck ? 'Set' : 'Add'}
                </S.DeclutterControlState>
              </S.DeclutterControlButton>
            </S.DeclutterControlGroup>
          ) : null}

          <S.ControlGroup $wide>
            <S.ControlGroupLabel>Inventory</S.ControlGroupLabel>
            <S.ContainerActions>
              {isGone ? (
                <S.ContainerMuted>
                  Reclaim this item before assigning it to a container.
                </S.ContainerMuted>
              ) : ownership.isBoxed ? (
                <>
                  <S.ContainerButton type="button" disabled={pending} onClick={showPickerButton}>
                    Move item
                  </S.ContainerButton>
                  <S.ContainerButton
                    type="button"
                    disabled={pending || !boxMongoId}
                    onClick={handleRemoveFromBox}
                  >
                    Eject
                  </S.ContainerButton>
                </>
              ) : (
                <S.ContainerButton type="button" disabled={pending} onClick={showPickerButton}>
                  Place in box
                </S.ContainerButton>
              )}
            </S.ContainerActions>
          </S.ControlGroup>

          {resolvedTimestampActions.length ? (
            <S.ControlGroup $activity>
              <S.ControlGroupLabel>Activity</S.ControlGroupLabel>
              <S.ContainerTimestampActions>
                {resolvedTimestampActions.map((action) => (
                  <S.ContainerTimestampButton
                    key={action.id}
                    type="button"
                    $tone={action.tone}
                    aria-label={action.label}
                    onClick={action.onClick}
                    disabled={departurePending || pending || action.disabled}
                    >
                    <S.TimestampLabelFull aria-hidden="true">{action.label}</S.TimestampLabelFull>
                    <S.TimestampLabelCompact aria-hidden="true">
                      {action.tone === 'maintained'
                        ? 'Maint'
                        : action.tone === 'checked'
                          ? 'Check'
                          : action.tone === 'consumed'
                            ? 'Use'
                          : action.label}
                    </S.TimestampLabelCompact>
                    <S.ContainerTimestampStat>
                      {formatActivityStat(getLatestActivityValue(item, action.id))}
                    </S.ContainerTimestampStat>
                  </S.ContainerTimestampButton>
                ))}
              </S.ContainerTimestampActions>
              {departurePending ? (
                <S.ActivityLockNotice role="note">
                  Activity locked // {formatDepartureRoute(departureRoute)} departure pending
                </S.ActivityLockNotice>
              ) : null}
            </S.ControlGroup>
          ) : null}

          {viewToggle ? (
            <S.ControlGroup>
              <S.ControlGroupLabel>Display</S.ControlGroupLabel>
              {viewToggle}
            </S.ControlGroup>
          ) : null}

          {editActions ? (
            <S.ControlGroup>
              <S.ControlGroupLabel>Modify</S.ControlGroupLabel>
              {editActions}
            </S.ControlGroup>
          ) : null}

          {showPicker ? (
            <S.ContainerPickerWrap>
              <MoveItemToOtherBox
                itemId={item?._id}
                currentBoxId={boxMongoId || null}
                suggestedPurpose={suggestedBoxPurpose}
                onBoxSelected={handleSelectDestination}
              />
            </S.ContainerPickerWrap>
          ) : null}

          {error ? <S.ContainerError role="alert">{error}</S.ContainerError> : null}

      </S.ItemControlsPanel>
    </S.ItemButtonBar>
  );
}
