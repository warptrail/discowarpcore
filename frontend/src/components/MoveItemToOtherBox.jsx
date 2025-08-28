import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 0.5rem 0;
`;

const BoxList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
`;

const BoxItem = styled.li`
  padding: 0.5rem 0.75rem;
  border: 1px solid #2f2f2f;
  border-radius: 6px;
  background: #222;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: #2d3d31;
    border-color: #4ec77b;
  }
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

  // Simple states so you never see weird "()" outputs
  if (loading && otherBoxes.length === 0) {
    return <Container>(loading boxes…)</Container>;
  }
  if (!otherBoxes.length) {
    return <Container>(no other boxes)</Container>;
  }

  return (
    <Container>
      <BoxList>
        {otherBoxes.map((box) => (
          <BoxItem
            key={box._id || `${box.box_id}-${box.label}`}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(box)}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && handleSelect(box)
            }
          >
            {box.label} ({box.box_id})
          </BoxItem>
        ))}
      </BoxList>
    </Container>
  );
}
