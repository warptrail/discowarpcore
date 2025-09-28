import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Container,
  Header,
  Table,
  CellLabel,
  CellValue,
  Crumb,
  Status,
  TestButtons,
} from '../styles/ItemDetails.styles';
import { fetchItemDetails, createAborter } from '../api/itemDetails';

export default function ItemDetails({ item, triggerFlash }) {
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper: safe date formatting
  const fmt = (d) => (d ? dayjs(d).format('YYYY-MM-DD') : '—');

  useEffect(() => {
    if (!item?._id) return;

    const { signal, cancel } = createAborter();
    setLoading(true);
    setError(null);

    fetchItemDetails(item._id, { signal })
      .then((data) => setItemData(data))
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Failed to load item details');
        }
      })
      .finally(() => setLoading(false));

    return () => cancel();
  }, [item?._id]);

  if (loading) return <Status>Loading…</Status>;
  if (error) return <Status>Error: {error}</Status>;
  if (!itemData) return null;

  const {
    name,
    description,
    notes,
    location,
    dateAcquired,
    dateLastUsed,
    usageHistory,
    valueCents,
    value,
    avgUseIntervalDays,
    quantity,
    tags,
    imagePath,
    orphanedAt,
    box,
    breadcrumb,
    depth,
    topBox,
  } = itemData;

  return (
    <Container>
      <Header>{name}</Header>

      <Table>
        <tbody>
          <tr>
            <CellLabel>Description</CellLabel>
            <CellValue>{description || '—'}</CellValue>
          </tr>
          <tr>
            <CellLabel>Notes</CellLabel>
            <CellValue>{notes || '—'}</CellValue>
          </tr>
          <tr>
            <CellLabel>Location</CellLabel>
            <CellValue>{location || '—'}</CellValue>
          </tr>
          <tr>
            <CellLabel>Date Acquired</CellLabel>
            <CellValue>{fmt(dateAcquired)}</CellValue>
          </tr>
          <tr>
            <CellLabel>Last Used</CellLabel>
            <CellValue>{fmt(dateLastUsed)}</CellValue>
          </tr>
          <tr>
            <CellLabel>Usage History</CellLabel>
            <CellValue>
              {usageHistory?.length
                ? usageHistory.map((d, i) => (
                    <span key={i}>
                      {fmt(d)}
                      {i < usageHistory.length - 1 ? ', ' : ''}
                    </span>
                  ))
                : '—'}
            </CellValue>
          </tr>
          <tr>
            <CellLabel>Avg Interval (days)</CellLabel>
            <CellValue>{avgUseIntervalDays ?? '—'}</CellValue>
          </tr>
          <tr>
            <CellLabel>Quantity</CellLabel>
            <CellValue>{quantity}</CellValue>
          </tr>
          <tr>
            <CellLabel>Tags</CellLabel>
            <CellValue>{tags?.length ? tags.join(', ') : '—'}</CellValue>
          </tr>
          <tr>
            <CellLabel>Value (cents)</CellLabel>
            <CellValue>{valueCents}</CellValue>
          </tr>
          <tr>
            <CellLabel>Value ($)</CellLabel>
            <CellValue>{value}</CellValue>
          </tr>
          <tr>
            <CellLabel>Orphaned At</CellLabel>
            <CellValue>{fmt(orphanedAt)}</CellValue>
          </tr>
          <tr>
            <CellLabel>Image Path</CellLabel>
            <CellValue>{imagePath || '—'}</CellValue>
          </tr>
        </tbody>
      </Table>

      {box && (
        <Table>
          <tbody>
            <tr>
              <CellLabel>Box</CellLabel>
              <CellValue>
                {box.label} ({box.box_id})
              </CellValue>
            </tr>
            <tr>
              <CellLabel>Box Description</CellLabel>
              <CellValue>{box.description || '—'}</CellValue>
            </tr>
            <tr>
              <CellLabel>Depth</CellLabel>
              <CellValue>{depth}</CellValue>
            </tr>
            <tr>
              <CellLabel>Top Box</CellLabel>
              <CellValue>
                {topBox?.label || '—'} ({topBox?.box_id || '—'})
              </CellValue>
            </tr>
          </tbody>
        </Table>
      )}

      {breadcrumb?.length > 0 && (
        <div>
          {breadcrumb.map((b, i) => (
            <Crumb key={b._id || i}>
              {b.label} ({b.box_id})
            </Crumb>
          ))}
        </div>
      )}

      <TestButtons>
        <button onClick={() => triggerFlash(item._id, 'yellow')}>
          Yellow Flash
        </button>
        <button onClick={() => triggerFlash(item._id, 'red')}>Red Flash</button>
      </TestButtons>
    </Container>
  );
}
