import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import MoveItemToOtherBox from './MoveItemToOtherBox';
import * as S from '../styles/ItemPage.styles';
import { getDeclutterBoxPurposeForRoute } from '../util/declutterBoxPurpose';
import {
  formatDepartureRoute,
  getItemDepartureRoute,
  getItemDepartureState,
} from '../util/itemDeparture';
import { getItemOwnershipContext } from '../util/itemOwnership';

const DEPARTURE_COPY = {
  marked_for_destruction: {
    label: 'Trash approved · physical departure pending',
    detail: 'This item is due to depart inventory as soon as the physical trash disposition is completed. It is still active inventory until then.',
  },
  staged_for_donation: {
    label: 'Confirmed departure · staged for donation',
    detail: 'This item is still active inventory until the donation is physically completed.',
  },
  staged_for_sale: {
    label: 'Confirmed departure · staged for sale',
    detail: 'This item is still active inventory until the sale is physically completed.',
  },
  needs_staging: {
    label: 'Departure approved · staging box needed',
    detail: 'This item is due to leave inventory and needs a physical staging destination.',
  },
  needs_routing: {
    label: 'Confirmed departure · needs routing',
    detail: 'This item is due to leave inventory and needs its physical route confirmed.',
  },
  awaiting_gift: {
    label: 'Gift approved · handoff pending',
    detail: 'This item remains active inventory until it is physically given to its recipient.',
  },
};

const FALLBACK_COPY = {
  label: 'Departure approved · physical completion pending',
  detail: 'This item remains active inventory until the departure job is completed.',
};

function formatTimestamp(value) {
  if (!value) return 'Decision recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Decision recorded' : date.toLocaleString();
}

export default function ItemDepartureAlert({
  item,
  disabled = false,
  onMoveItem,
  onMarkGoneRequest,
}) {
  const state = getItemDepartureState(item);
  const route = getItemDepartureRoute(item);
  const suggestedPurpose = getDeclutterBoxPurposeForRoute(route);
  const canCompleteDeparture = ['discard', 'donate', 'sell', 'gift'].includes(route);
  const ownership = getItemOwnershipContext(item);
  const sourceBoxId = ownership.boxMongoId || null;
  const copy = DEPARTURE_COPY[state] || FALLBACK_COPY;
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [destinationBusy, setDestinationBusy] = useState(false);
  const destinationPanelId = useId();

  useEffect(() => {
    setDestinationsOpen(false);
    setDestinationBusy(false);
  }, [item?._id]);

  const handleSelectDestination = async ({
    destBoxId,
    destLabel,
    destShortId,
  }) => {
    if (!destBoxId || typeof onMoveItem !== 'function' || destinationBusy) return;
    setDestinationBusy(true);
    try {
      const ok = await onMoveItem({
        destBoxId,
        destLabel,
        destShortId,
        sourceBoxId: sourceBoxId || undefined,
      });
      if (ok) setDestinationsOpen(false);
    } finally {
      setDestinationBusy(false);
    }
  };

  return (
    <S.DepartureAlert role="status" $urgent>
      <S.DepartureAlertHeader>
        <S.DepartureAlertHeading>
          <S.DepartureAlertKicker $urgent>
            INVENTORY LIFECYCLE // DEPARTURE ALERT
          </S.DepartureAlertKicker>
          <S.DepartureAlertTitle>{copy.label}</S.DepartureAlertTitle>
        </S.DepartureAlertHeading>
        <S.DepartureAlertStatus>ACTIVE // EXIT PENDING</S.DepartureAlertStatus>
      </S.DepartureAlertHeader>
      <S.DepartureAlertDetail>{copy.detail}</S.DepartureAlertDetail>
      <S.DepartureAlertMeta aria-label="Pending departure details">
        <span><b>Route</b>{formatDepartureRoute(route)}</span>
        <span><b>Decision</b>{formatTimestamp(item?.declutterCandidate?.confirmedAt)}</span>
        <span><b>Inventory</b>Activity locked</span>
      </S.DepartureAlertMeta>
      <S.DepartureAlertActions>
        <S.DepartureInlineToggle
          type="button"
          aria-expanded={destinationsOpen}
          aria-controls={destinationPanelId}
          disabled={disabled || !suggestedPurpose || typeof onMoveItem !== 'function'}
          onClick={() => setDestinationsOpen((current) => !current)}
        >
          {destinationsOpen ? 'Hide suggested boxes' : 'Suggested boxes'}
          <span aria-hidden="true">{destinationsOpen ? '−' : '+'}</span>
        </S.DepartureInlineToggle>
        <S.DepartureAlertLink to="/declutter?mode=actions">
          View marked-for-destruction box ↗
        </S.DepartureAlertLink>
        {typeof onMarkGoneRequest === 'function' ? (
          <S.DepartureLifecycleButton
            type="button"
            disabled={disabled || !canCompleteDeparture}
            onClick={onMarkGoneRequest}
          >
            Confirm no longer have
          </S.DepartureLifecycleButton>
        ) : null}
      </S.DepartureAlertActions>
      {destinationsOpen ? (
        <S.DepartureDestinationPanel id={destinationPanelId}>
          <S.DepartureDestinationHeader>
            <span>Route-matched destinations</span>
            <small>Select a box to move this item now.</small>
          </S.DepartureDestinationHeader>
          <MoveItemToOtherBox
            itemId={item?._id}
            currentBoxId={sourceBoxId}
            suggestedPurpose={suggestedPurpose}
            suggestedOnly
            showOrphanOption={false}
            showRecentDestinations={false}
            disabled={disabled || destinationBusy}
            onBoxSelected={handleSelectDestination}
          />
        </S.DepartureDestinationPanel>
      ) : null}
    </S.DepartureAlert>
  );
}
