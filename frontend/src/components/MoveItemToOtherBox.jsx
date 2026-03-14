import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 0.35rem 0 0;
`;

const BoxList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.36rem;
`;

const BoxItem = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.52rem;
  align-items: center;
  min-height: 40px;
  padding: 0.38rem 0.62rem;
  border: 1px solid #2f3a32;
  border-radius: 8px;
  background: linear-gradient(90deg, #23252a 0%, #1d1f23 62%);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    background: linear-gradient(90deg, #274233 0%, #1f2d26 62%);
    border-color: #4ec77b;
    box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.2);
  }
`;

const BoxName = styled.span`
  min-width: 0;
  font-size: 0.92rem;
  line-height: 1.2;
  color: #e8edf2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: ${({ $depth = 0 }) => `${Math.min(Math.max($depth, 0), 6) * 0.42}rem`};
`;

const MetaLane = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const MetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 0.44rem;
  border-radius: 999px;
  border: 1px solid #394646;
  background: #1a2122;
  color: #d8e7e7;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

const IdPill = styled(MetaPill)`
  border-color: #426b56;
  background: #15261f;
  color: #cff1dd;
  font-weight: 700;
`;

const LevelPill = styled(MetaPill)`
  border-color: #405270;
  background: #182030;
  color: #cfdbf9;
`;

export default function MoveItemToOtherBox({
  currentBoxId, // owning/source box id
  onBoxSelected, // ({ destBoxId, destLabel, destShortId }) => void
}) {
  const [otherBoxes, setOtherBoxes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Guard: don’t fetch until we have a real id
    if (!currentBoxId) return;

    let isAlive = true; // if component unmounts or id changes, ignore late responses

    (async () => {
      try {
        setLoading(true);

        const url = `http://localhost:5002/api/boxes/exclude/${encodeURIComponent(
          String(currentBoxId)
        )}`;
        const res = await fetch(url);

        const contentType = res.headers.get('content-type') || '';
        const bodyText = await res.text(); // read once

        if (!res.ok) {
          console.warn('exclude failed', res.status, bodyText.slice(0, 160));
          if (isAlive) setOtherBoxes([]);
          return;
        }

        // Parse JSON safely (some servers forget proper headers)
        let data = [];
        if (
          contentType.includes('application/json') ||
          // eslint-disable-next-line no-useless-escape
          /^[\[{]/.test(bodyText.trim())
        ) {
          try {
            data = JSON.parse(bodyText);
          } catch {
            console.warn(
              'exclude: JSON parse failed. Preview:',
              bodyText.slice(0, 120)
            );
            data = [];
          }
        } else {
          console.warn(
            'exclude: non-JSON response. CT:',
            contentType,
            'Preview:',
            bodyText.slice(0, 120)
          );
          data = [];
        }

        if (isAlive) setOtherBoxes(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isAlive) {
          console.error('❌ Failed to fetch boxes:', err);
          setOtherBoxes([]);
        }
      } finally {
        if (isAlive) setLoading(false);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, [currentBoxId]);

  const handleSelect = (box) => {
    onBoxSelected?.({
      destBoxId: box._id,
      destLabel: box.label,
      destShortId: box.box_id,
    });
  };

  const normalizedBoxes = useMemo(() => {
    const list = Array.isArray(otherBoxes) ? otherBoxes : [];
    const byId = new Map(
      list
        .filter((box) => box?._id)
        .map((box) => [String(box._id), box]),
    );

    const getParentId = (box) => {
      const parent = box?.parentBox;
      if (!parent) return null;
      if (typeof parent === 'string') return parent;
      if (typeof parent === 'object') return parent?._id || parent?.id || null;
      return null;
    };

    const getDepth = (box) => {
      let depth = 0;
      let cursorId = getParentId(box);
      let guard = 0;

      while (cursorId && guard < 64) {
        depth += 1;
        const parent = byId.get(String(cursorId));
        if (!parent) break;
        cursorId = getParentId(parent);
        guard += 1;
      }

      return depth;
    };

    const toSortableNumericId = (boxId) => {
      const parsed = Number.parseInt(String(boxId ?? '').trim(), 10);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return list
      .map((box) => ({
        ...box,
        _itemCount: Array.isArray(box?.items) ? box.items.length : 0,
        _depth: getDepth(box),
      }))
      .sort((a, b) => {
        const aNum = toSortableNumericId(a?.box_id);
        const bNum = toSortableNumericId(b?.box_id);
        if (aNum !== null && bNum !== null) return aNum - bNum;
        if (aNum !== null) return -1;
        if (bNum !== null) return 1;
        return String(a?.box_id ?? '').localeCompare(String(b?.box_id ?? ''));
      });
  }, [otherBoxes]);

  // Simple states so you never see weird "()" outputs
  if (loading && normalizedBoxes.length === 0) {
    return <Container>(loading boxes…)</Container>;
  }
  if (!normalizedBoxes.length) {
    return <Container>(no other boxes)</Container>;
  }

  return (
    <Container>
      <BoxList>
        {normalizedBoxes.map((box) => (
          <BoxItem
            key={box._id || `${box.box_id}-${box.label}`}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(box)}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && handleSelect(box)
            }
          >
            <BoxName $depth={box._depth}>
              {box.label || '(Untitled Box)'}
            </BoxName>
            <MetaLane>
              <IdPill>#{box.box_id ?? '---'}</IdPill>
              <MetaPill>
                {box._itemCount} {box._itemCount === 1 ? 'item' : 'items'}
              </MetaPill>
              <LevelPill>L{box._depth}</LevelPill>
            </MetaLane>
          </BoxItem>
        ))}
      </BoxList>
    </Container>
  );
}
