import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { API_BASE } from '../api/API_BASE';
import { getItemHomeHref } from '../api/itemDetails';
import { ToastContext } from './Toast';

const Panel = styled.section`
  margin-top: 0.9rem;
  border: 1px solid #2b3430;
  border-radius: 10px;
  background: linear-gradient(180deg, #141817 0%, #101312 100%);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.5rem 0.68rem;
  border-bottom: 1px solid #25302b;
  background: linear-gradient(90deg, rgba(78, 199, 123, 0.12) 0%, transparent 48%);
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d9e5de;
`;

const Count = styled.span`
  font-size: 0.72rem;
  color: #a5b3ab;
`;

const Body = styled.div`
  display: grid;
  gap: 0.35rem;
  padding: 0.5rem 0.55rem 0.56rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  min-height: 34px;
  padding: 0.28rem 0.42rem 0.28rem 0.52rem;
  border-radius: 7px;
  border: 1px solid #2a332f;
  background: #171b1a;
`;

const Identity = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.38rem;
`;

const Name = styled.span`
  min-width: 0;
  color: #e4ece8;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NameLink = styled(Link)`
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  color: #e4ece8;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgba(78, 199, 123, 0.86);
  }
`;

const Meta = styled.span`
  font-size: 0.7rem;
  color: #a3b0a8;
  white-space: nowrap;
`;

const AssignBtn = styled.button`
  border: 1px solid #3f6f55;
  border-radius: 7px;
  min-height: 26px;
  padding: 0 0.58rem;
  background: #1b2c23;
  color: #def2e7;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #4ec77b;
    background: #244031;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const StateText = styled.div`
  font-size: 0.75rem;
  color: ${({ $error }) => ($error ? '#f2b8b8' : '#9faea6')};
  padding: 0.1rem 0.12rem;
`;

const parseOrphanedTime = (item) => {
  const raw = item?.orphanedAt;
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : null;
};

const formatOrphanedTime = (raw) => {
  if (!raw) return '—';
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(ts);
};

const sortOrphanedItems = (items) => {
  return [...items].sort((a, b) => {
    const ta = parseOrphanedTime(a);
    const tb = parseOrphanedTime(b);
    if (ta == null && tb == null) {
      return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
        sensitivity: 'base',
      });
    }
    if (ta == null) return 1;
    if (tb == null) return -1;
    return tb - ta;
  });
};

export default function MiniOrphanedList({
  boxMongoId,
  onItemAssigned,
  orphanedItems,
  fetchOrphanedItems,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;

  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assigningId, setAssigningId] = useState(null);

  const usesParentItems = Array.isArray(orphanedItems);
  const sourceItems = usesParentItems ? orphanedItems : localItems;
  const sortedItems = useMemo(
    () => sortOrphanedItems(Array.isArray(sourceItems) ? sourceItems : []),
    [sourceItems],
  );

  const fetchLocalOrphanedItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/items/orphaned?sort=recent&limit=10000`);
      const body = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(body?.error || body?.message || 'Failed to load orphaned items');
      }
      setLocalItems(Array.isArray(body) ? body : []);
    } catch (e) {
      setError(e?.message || 'Failed to load orphaned items');
      setLocalItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (usesParentItems) return;
    fetchLocalOrphanedItems();
  }, [usesParentItems, fetchLocalOrphanedItems]);

  const refreshOrphaned = useCallback(async () => {
    if (typeof fetchOrphanedItems === 'function') {
      await fetchOrphanedItems();
      return;
    }
    await fetchLocalOrphanedItems();
  }, [fetchOrphanedItems, fetchLocalOrphanedItems]);

  const handleAssign = async (item) => {
    const itemId = item?._id;
    if (!itemId || !boxMongoId || assigningId) return;

    setAssigningId(itemId);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/boxed-items/${boxMongoId}/addItem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to assign item');
      }

      // Fast local removal for this panel, then canonical refresh below.
      setLocalItems((prev) => prev.filter((it) => String(it?._id) !== String(itemId)));

      await Promise.all([
        onItemAssigned?.(itemId),
        refreshOrphaned(),
      ]);

      showToast?.({
        variant: 'success',
        title: 'Item assigned',
        message: `Assigned "${item?.name || 'Item'}" to this box.`,
        timeoutMs: 2600,
      });
    } catch (e) {
      const msg = e?.message || 'Failed to assign item';
      setError(msg);
      showToast?.({
        variant: 'danger',
        title: 'Assign failed',
        message: msg,
        timeoutMs: 4200,
      });
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Panel>
      <Header>
        <Title>Orphaned Items</Title>
        <Count>{sortedItems.length}</Count>
      </Header>

      <Body>
        {loading && <StateText>Loading orphaned items…</StateText>}
        {!loading && error && <StateText $error>{error}</StateText>}
        {!loading && !error && sortedItems.length === 0 && (
          <StateText>No orphaned items.</StateText>
        )}

        {!loading &&
          !error &&
          sortedItems.map((item) => (
            <Row key={item?._id || `${item?.name}-${item?.orphanedAt || 'none'}`}>
              <Identity>
                {item?._id ? (
                  <NameLink
                    to={getItemHomeHref(item._id)}
                    title={item?.name || '(Unnamed Item)'}
                  >
                    {item?.name || '(Unnamed Item)'}
                  </NameLink>
                ) : (
                  <Name title={item?.name || '(Unnamed Item)'}>
                    {item?.name || '(Unnamed Item)'}
                  </Name>
                )}
                <Meta>qty {item?.quantity ?? 1}</Meta>
                <Meta>{formatOrphanedTime(item?.orphanedAt)}</Meta>
              </Identity>

              <AssignBtn
                type="button"
                onClick={() => handleAssign(item)}
                disabled={!boxMongoId || assigningId === item?._id}
              >
                {assigningId === item?._id ? 'Assigning…' : 'Assign'}
              </AssignBtn>
            </Row>
          ))}
      </Body>
    </Panel>
  );
}
