// BoxActionToast.jsx
import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  position: sticky;
  bottom: 8px;
  z-index: 50;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: ${({ $variant }) =>
    $variant === 'success'
      ? '#10361f'
      : $variant === 'warning'
      ? '#3a2f10'
      : $variant === 'danger'
      ? '#3a1010'
      : '#102633'};
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'success'
        ? '#2f9e44'
        : $variant === 'warning'
        ? '#e0a800'
        : $variant === 'danger'
        ? '#e03131'
        : '#228be6'};
  color: #eaeaea;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
`;
const Title = styled.div`
  font-weight: 600;
`;
const Msg = styled.div`
  opacity: 0.9;
`;
const Spacer = styled.div`
  flex: 1;
`;
const Btn = styled.button`
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

export default function BoxActionToast({
  open,
  title,
  message,
  variant = 'info', // 'success' | 'warning' | 'danger' | 'info'
  actions = [], // [{label, onClick, kind}] kind 'primary'|'ghost'
  onClose,
}) {
  if (!open) return null;
  return (
    <Wrap $variant={variant} role="status" aria-live="polite">
      <div>
        {title && <Title>{title}</Title>}
        {message && <Msg>{message}</Msg>}
      </div>
      <Spacer />
      {actions.map((a, i) => (
        <Btn
          key={i}
          onClick={a.onClick}
          style={
            a.kind === 'primary'
              ? { background: '#fff', color: '#111', borderColor: '#fff' }
              : {}
          }
        >
          {a.label}
        </Btn>
      ))}
      {onClose && <Btn onClick={onClose}>✕</Btn>}
    </Wrap>
  );
}
