import React from 'react';
import styled from 'styled-components';
import { getBoxColorTones } from '../Retrieval/boxColors';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid rgba(93, 131, 162, 0.45);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(13, 19, 29, 0.93) 0%, rgba(10, 15, 22, 0.96) 100%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.52rem 0.66rem;
  border-bottom: 1px solid rgba(76, 106, 132, 0.4);
  background: linear-gradient(90deg, rgba(96, 139, 180, 0.2) 0%, rgba(96, 139, 180, 0) 55%);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d8e6f4;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Counter = styled.span`
  color: #9db2c7;
  font-size: 0.73rem;
`;

const Controls = styled.div`
  border-bottom: 1px solid rgba(76, 106, 132, 0.32);
  padding: 0.46rem 0.5rem;
  display: grid;
  gap: 0.38rem;
  background: rgba(10, 16, 24, 0.72);
`;

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
`;

const ToggleButton = styled.button`
  min-height: 28px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(218, 194, 122, 0.72)' : 'rgba(80, 113, 143, 0.52)')};
  background: ${({ $active }) => ($active ? 'rgba(85, 67, 28, 0.64)' : 'rgba(13, 22, 33, 0.86)')};
  color: ${({ $active }) => ($active ? '#f4e5b8' : '#afc4d8')};
  padding: 0.2rem 0.45rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    filter: brightness(1.08);
  }
`;

const BatchChip = styled.button`
  min-height: 30px;
  border-radius: 8px;
  border: 1px solid ${({ $active, $accentRgb }) =>
    $active ? `rgba(${$accentRgb}, 0.82)` : 'rgba(80, 113, 143, 0.5)'};
  background: ${({ $active, $accentRgb }) =>
    $active ? `rgba(${$accentRgb}, 0.22)` : 'rgba(13, 22, 33, 0.82)'};
  color: ${({ $active, $accentRgb }) =>
    $active ? `rgb(${$accentRgb})` : '#a9bed4'};
  padding: 0.22rem 0.46rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 780;
  cursor: pointer;
  max-width: 100%;

  &:hover {
    filter: brightness(1.08);
  }
`;

const ChipLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const ChipCount = styled.span`
  color: #879db3;
  font-size: 0.62rem;
  white-space: nowrap;
`;

const Body = styled.div`
  padding: 0.5rem;
  display: grid;
  gap: 0.34rem;
  max-height: min(48vh, 360px);
  overflow: auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: none;
    overflow: visible;
  }
`;

const Row = styled.div`
  border: 1px solid rgba(79, 105, 136, 0.46);
  border-radius: 9px;
  padding: 0.32rem 0.38rem;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 0.42rem;
  background: rgba(13, 20, 31, 0.87);
  background:
    linear-gradient(90deg, ${({ $batchRgb }) => ($batchRgb ? `rgba(${$batchRgb}, 0.22)` : 'rgba(13, 20, 31, 0.87)')} 0%, rgba(13, 20, 31, 0.87) 38%),
    rgba(13, 20, 31, 0.87);
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  border-color: ${({ $active, $batchRgb, $clickable }) =>
    $active
      ? 'rgba(223, 180, 96, 0.72)'
      : $batchRgb
        ? `rgba(${$batchRgb}, 0.58)`
      : $clickable
        ? 'rgba(94, 126, 158, 0.5)'
        : 'rgba(79, 105, 136, 0.4)'};
  box-shadow: ${({ $active, $batchRgb }) =>
    $active
      ? '0 0 0 1px rgba(223, 180, 96, 0.24)'
      : $batchRgb
        ? `inset 3px 0 0 rgb(${$batchRgb})`
        : 'none'};

  &:hover {
    ${({ $clickable }) => ($clickable ? 'filter: brightness(1.07);' : '')}
  }
`;

const Thumb = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 7px;
  border: 1px solid rgba(88, 129, 173, 0.5);
  overflow: hidden;
  background: rgba(12, 19, 30, 0.94);
  display: grid;
  place-items: center;
  color: #99b6d4;
  font-size: 0.56rem;
  text-transform: uppercase;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RowBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.12rem;
`;

const Primary = styled.div`
  font-size: 0.8rem;
  line-height: 1.24;
  font-weight: 600;
  overflow-wrap: anywhere;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: baseline;
  gap: 0.24rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const PrimaryItem = styled.span`
  min-width: 0;
  color: #f0f8ff;
  font-weight: 600;
  overflow-wrap: anywhere;
`;

const PrimaryDestination = styled.span`
  min-width: 0;
  color: #c5d9ee;
  display: inline-flex;
  align-items: baseline;
  gap: 0.18rem;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.24rem;
`;

const MetaText = styled.span`
  color: #8ea6be;
  font-size: 0.64rem;
  line-height: 1.2;
`;

const MetaSep = styled.span`
  color: #6f89a3;
  font-size: 0.62rem;
  line-height: 1;
`;

const Arrow = styled.span`
  color: #7f98b0;
  font-weight: 500;
`;

const QtyValue = styled.span`
  color: #adc3d9;
  font-weight: 650;
`;

const LocatorToken = styled.span`
  color: ${({ $boxNeonRgb }) => `rgba(${$boxNeonRgb || '119, 213, 255'}, 1)`};
  text-shadow: ${({ $boxNeonRgb }) => `0 0 6px rgba(${$boxNeonRgb || '119, 213, 255'}, 0.34)`};
  font-size: 0.69rem;
  line-height: 1;
  font-weight: 820;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const BatchToken = styled.span`
  color: ${({ $batchRgb }) => ($batchRgb ? `rgb(${$batchRgb})` : '#9db2c7')};
  font-size: 0.62rem;
  line-height: 1.2;
  font-weight: 780;
  overflow-wrap: anywhere;
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#efc2c2' : '#95acc3')};
  font-size: 0.78rem;
  padding: 0.12rem 0.08rem;
`;

function getItemTimestamp(item) {
  const createdAt = Date.parse(item?.createdAt || item?.created_at || '');
  if (Number.isFinite(createdAt)) return createdAt;

  const id = String(item?._id || '');
  if (id.length >= 8) {
    const seconds = Number.parseInt(id.slice(0, 8), 16);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }

  return 0;
}

function formatFullTimestamp(timestamp) {
  if (!timestamp) return 'unknown time';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp);
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'unknown';

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return `${Math.floor(days / 7)}w ago`;
}

function getItemDestination(item, boxLookup) {
  const directLabel = String(item?.box?.label || '').trim();
  const directBoxId = String(item?.box?.box_id || '').trim();
  if (directLabel || directBoxId) {
    return {
      label: directLabel || `#${directBoxId}`,
      boxId: directBoxId,
    };
  }

  const mongoRef = String(item?.box?._id || item?.boxId || '').trim();
  if (mongoRef && boxLookup instanceof Map) {
    const box = boxLookup.get(mongoRef);
    const fallbackLabel = String(box?.label || '').trim();
    const fallbackBoxId = String(box?.box_id || '').trim();
    if (fallbackLabel || fallbackBoxId) {
      return {
        label: fallbackLabel || `#${fallbackBoxId}`,
        boxId: fallbackBoxId,
      };
    }
  }

  const breadcrumb = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const leaf = breadcrumb.length ? breadcrumb[breadcrumb.length - 1] : null;
  const crumbLabel = String(leaf?.label || '').trim();
  const crumbBoxId = String(leaf?.box_id || '').trim();
  if (crumbLabel || crumbBoxId) {
    return {
      label: crumbLabel || `#${crumbBoxId}`,
      boxId: crumbBoxId,
    };
  }

  return {
    label: 'orphaned pool',
    boxId: '',
  };
}

function getItemBatchId(item) {
  return String(item?.sourceBatchId || item?.sourceBatch?.id || '').trim();
}

function getItemBatchLabel(item) {
  const sourceBatch = item?.sourceBatch && typeof item.sourceBatch === 'object'
    ? item.sourceBatch
    : null;
  return (
    String(sourceBatch?.label || '').trim() ||
    String(sourceBatch?.batchName || '').trim() ||
    String(sourceBatch?.batchId || '').trim() ||
    getItemBatchId(item)
  );
}

function getItemImageUrl(item) {
  return (
    item?.image?.thumb?.url ||
    item?.image?.display?.url ||
    ''
  );
}

export default function IntakeRecentActivity({
  items = [],
  boxLookup,
  loading = false,
  error = '',
  onMoveItem,
  selectedItemId = '',
  batchOptions = [],
  selectedBatchIds = [],
  onlyOrphanedItems = false,
  onToggleBatch,
  onToggleOnlyOrphaned,
  onClearFilters,
}) {
  const selectedBatchSet = new Set(
    (Array.isArray(selectedBatchIds) ? selectedBatchIds : [])
      .map((batchId) => String(batchId || '').trim())
      .filter(Boolean),
  );
  const batchToneMap = new Map(
    (Array.isArray(batchOptions) ? batchOptions : []).map((batch, index) => {
      const tones = getBoxColorTones(index + 1);
      return [String(batch?.id || '').trim(), tones.neonRgb];
    }),
  );
  const filtersActive = selectedBatchSet.size > 0 || onlyOrphanedItems;

  return (
    <Panel>
      <Header>
        <Title>Recent Intake Activity</Title>
        <Counter>{items.length}</Counter>
      </Header>

      <Controls>
        <ControlRow>
          <ToggleButton
            type="button"
            $active={onlyOrphanedItems}
            onClick={onToggleOnlyOrphaned}
          >
            Orphaned Only
          </ToggleButton>

          {filtersActive ? (
            <ToggleButton type="button" onClick={onClearFilters}>
              Clear Filters
            </ToggleButton>
          ) : null}
        </ControlRow>

        {batchOptions.length > 0 ? (
          <ControlRow>
            {batchOptions.map((batch, index) => {
              const batchId = String(batch?.id || '').trim();
              const accentRgb = batchToneMap.get(batchId) || getBoxColorTones(index + 1).neonRgb;
              const active = selectedBatchSet.has(batchId);
              const batchLabel = batch?.label || batchId;
              const countLabel = onlyOrphanedItems
                ? `${batch?.orphanedCount || 0} orphaned of ${batch?.count || 0} total`
                : `${batch?.count || 0} items`;

              return (
                <BatchChip
                  key={batchId}
                  type="button"
                  $active={active}
                  $accentRgb={accentRgb}
                  aria-pressed={active}
                  aria-label={`Toggle batch ${batchLabel}, ${countLabel}`}
                  title={`${batchLabel} · ${countLabel}`}
                  onClick={() => onToggleBatch?.(batchId)}
                >
                  <ChipLabel>{batchLabel}</ChipLabel>
                  <ChipCount>
                    {onlyOrphanedItems ? `${batch?.orphanedCount || 0}/${batch?.count || 0}` : batch?.count || 0}
                  </ChipCount>
                </BatchChip>
              );
            })}
          </ControlRow>
        ) : null}
      </Controls>

      <Body>
        {loading ? <StateText>Loading recent activity…</StateText> : null}
        {!loading && error ? <StateText $error>{error}</StateText> : null}

        {!loading && !error && items.length === 0 ? (
          <StateText>
            {filtersActive ? 'No intake activity matches the active filters.' : 'No recent intake activity yet.'}
          </StateText>
        ) : null}

        {!loading &&
          !error &&
          items.map((item) => {
            const timestamp = getItemTimestamp(item);
            const destination = getItemDestination(item, boxLookup);
            const itemName = item?.name || 'Unnamed item';
            const quantity = item?.quantity ?? 1;
            const itemId = String(item?._id || '');
            const clickable = !!itemId;
            const isActive = itemId && itemId === String(selectedItemId || '');
            const imageUrl = getItemImageUrl(item);
            const boxIdLabel = String(destination?.boxId || '').trim();
            const boxToken = boxIdLabel ? `#${boxIdLabel}` : '';
            const boxTones = getBoxColorTones(boxIdLabel || 0);
            const batchId = getItemBatchId(item);
            const batchLabel = getItemBatchLabel(item);
            const batchRgb = batchId ? batchToneMap.get(batchId) || '' : '';

            return (
              <Row
                key={item?._id || `${item?.name || 'item'}-${timestamp}`}
                $clickable={clickable}
                $active={isActive}
                $batchRgb={batchRgb}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={() => {
                  if (!clickable) return;
                  onMoveItem?.(itemId);
                }}
                onKeyDown={(event) => {
                  if (!clickable) return;
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onMoveItem?.(itemId);
                }}
              >
                <Thumb>
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
                </Thumb>

                <RowBody>
                  <Primary>
                    <PrimaryItem>{itemName}</PrimaryItem>
                    <PrimaryDestination>
                      <Arrow>→</Arrow>
                      <span>{destination.label}</span>
                    </PrimaryDestination>
                  </Primary>
                  <Meta>
                    <MetaText>{formatRelativeTime(timestamp)}</MetaText>
                    <MetaSep>•</MetaSep>
                    <MetaText>{formatFullTimestamp(timestamp)}</MetaText>
                    <MetaSep>•</MetaSep>
                    <MetaText>qty <QtyValue>{quantity}</QtyValue></MetaText>
                    {boxToken ? (
                      <>
                        <MetaSep>•</MetaSep>
                        <LocatorToken $boxNeonRgb={boxTones.neonRgb}>
                          {boxToken}
                        </LocatorToken>
                      </>
                    ) : null}
                    {batchLabel ? (
                      <>
                        <MetaSep>•</MetaSep>
                        <BatchToken $batchRgb={batchRgb}>
                          {batchLabel}
                        </BatchToken>
                      </>
                    ) : null}
                  </Meta>
                </RowBody>
              </Row>
            );
          })}
      </Body>
    </Panel>
  );
}
