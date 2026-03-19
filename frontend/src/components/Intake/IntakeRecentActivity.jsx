import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getItemHomeHref } from '../../api/itemDetails';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
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
  padding: 0.62rem 0.75rem;
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

const Body = styled.div`
  padding: 0.58rem;
  display: grid;
  gap: 0.42rem;
`;

const Row = styled.div`
  border: 1px solid rgba(79, 105, 136, 0.4);
  border-radius: 9px;
  padding: 0.45rem 0.5rem;
  display: grid;
  gap: 0.4rem;
  background: rgba(13, 20, 31, 0.87);
`;

const EventLink = styled(Link)`
  color: #eaf4ff;
  text-decoration: none;
  font-size: 0.88rem;
  line-height: 1.3;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Meta = styled.div`
  color: #a8bed3;
  font-size: 0.72rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.42rem;
  flex-wrap: wrap;
`;

const OpenAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 0.62rem;
  border-radius: 8px;
  border: 1px solid rgba(90, 129, 189, 0.6);
  background: rgba(18, 34, 58, 0.92);
  color: #deecff;
  text-decoration: none;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
  }
`;

const MoveAction = styled.button`
  min-height: 32px;
  padding: 0 0.62rem;
  border-radius: 8px;
  border: 1px solid rgba(205, 163, 90, 0.62);
  background: rgba(84, 54, 20, 0.95);
  color: #ffeccf;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
  }
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

function getItemBoxLabel(item, boxLookup) {
  const directLabel = String(item?.box?.label || '').trim();
  const directBoxId = String(item?.box?.box_id || '').trim();
  if (directLabel && directBoxId) return `${directLabel} (Box #${directBoxId})`;
  if (directLabel) return directLabel;
  if (directBoxId) return `Box #${directBoxId}`;

  const mongoRef = String(item?.box?._id || item?.boxId || '').trim();
  if (mongoRef && boxLookup instanceof Map) {
    const box = boxLookup.get(mongoRef);
    const fallbackLabel = String(box?.label || '').trim();
    const fallbackBoxId = String(box?.box_id || '').trim();
    if (fallbackLabel && fallbackBoxId) return `${fallbackLabel} (Box #${fallbackBoxId})`;
    if (fallbackLabel) return fallbackLabel;
    if (fallbackBoxId) return `Box #${fallbackBoxId}`;
  }

  const breadcrumb = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const leaf = breadcrumb.length ? breadcrumb[breadcrumb.length - 1] : null;
  const crumbLabel = String(leaf?.label || '').trim();
  const crumbBoxId = String(leaf?.box_id || '').trim();
  if (crumbLabel && crumbBoxId) return `${crumbLabel} (Box #${crumbBoxId})`;
  if (crumbLabel) return crumbLabel;
  if (crumbBoxId) return `Box #${crumbBoxId}`;

  return 'orphaned pool';
}

export default function IntakeRecentActivity({
  items = [],
  boxLookup,
  loading = false,
  error = '',
  onMoveItem,
}) {
  return (
    <Panel>
      <Header>
        <Title>Recent Intake Activity</Title>
        <Counter>{items.length}</Counter>
      </Header>

      <Body>
        {loading ? <StateText>Loading recent activity…</StateText> : null}
        {!loading && error ? <StateText $error>{error}</StateText> : null}

        {!loading && !error && items.length === 0 ? (
          <StateText>No recent intake activity yet.</StateText>
        ) : null}

        {!loading &&
          !error &&
          items.map((item) => {
            const timestamp = getItemTimestamp(item);
            const boxLabel = getItemBoxLabel(item, boxLookup);
            const itemName = item?.name || 'Unnamed item';
            const quantity = item?.quantity ?? 1;

            return (
              <Row key={item?._id || `${item?.name || 'item'}-${timestamp}`}>
                {item?._id ? (
                  <EventLink to={getItemHomeHref(item._id)} title={itemName}>
                    Added {itemName} to {boxLabel}
                  </EventLink>
                ) : (
                  <div>Added {itemName} to {boxLabel}</div>
                )}

                <Meta>
                  {formatRelativeTime(timestamp)} • {formatFullTimestamp(timestamp)} • qty {quantity}
                </Meta>

                <ActionRow>
                  {item?._id ? (
                    <OpenAction to={getItemHomeHref(item._id)}>
                      Open Item
                    </OpenAction>
                  ) : null}

                  <MoveAction
                    type="button"
                    onClick={() => onMoveItem?.(item?._id)}
                    disabled={!item?._id}
                  >
                    Move
                  </MoveAction>
                </ActionRow>
              </Row>
            );
          })}
      </Body>
    </Panel>
  );
}
