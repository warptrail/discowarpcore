import React from 'react';

export default function ItemDetails({ item, triggerFlash }) {
  if (!item) return null;

  return (
    <div>
      <h3>{item.name}</h3>
      <p>Quantity: {item.quantity}</p>

      {/* Test buttons */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => triggerFlash(item._id, 'yellow')}
          style={{
            background: '#ffd700',
            color: '#000',
            padding: '0.4rem 0.8rem',
          }}
        >
          Flash Yellow
        </button>

        <button
          onClick={() => triggerFlash(item._id, 'red')}
          style={{
            background: '#dc3545',
            color: '#fff',
            padding: '0.4rem 0.8rem',
          }}
        >
          Flash Red
        </button>
      </div>
    </div>
  );
}
