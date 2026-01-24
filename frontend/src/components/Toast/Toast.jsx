// Toast.jsx
import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  margin: 10px 0;
  min-height: 56px;
  background: ${({ $variant, $idle }) =>
    $idle
      ? '#0f141a'
      : $variant === 'success'
        ? '#10361f'
        : $variant === 'warning'
          ? '#3a2f10'
          : $variant === 'danger'
            ? '#3a1010'
            : '#102633'};
  border: 1px solid
    ${({ $variant, $idle }) =>
      $idle
        ? 'rgba(255,255,255,0.12)'
        : $variant === 'success'
          ? '#2f9e44'
          : $variant === 'warning'
            ? '#e0a800'
            : $variant === 'danger'
              ? '#e03131'
              : '#228be6'};
  color: ${({ $idle }) => ($idle ? 'rgba(234,234,234,0.82)' : '#eaeaea')};
  padding: 0.75rem 1rem;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
`;
const Title = styled.div`
  font-weight: 600;
`;
const Msg = styled.div`
  opacity: 0.9;
`;
const Idle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

export default function Toast({
  open,
  title,
  message,
  variant = 'info', // 'success' | 'warning' | 'danger' | 'info'
  actions = [], // [{id?, label, onClick, kind}] kind 'primary'|'ghost'
  onClose,
  showIdle = true,
  idleIcon = '📦',
  idleText = 'Standing by…',
}) {
  const isIdle = !open;
  return (
    <Wrap
      $variant={variant}
      $idle={isIdle}
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      <div>
        {isIdle ? (
          showIdle ? (
            <Idle>
              <span aria-hidden="true">{idleIcon}</span>
              <span>{idleText}</span>
            </Idle>
          ) : null
        ) : (
          <>
            {title && <Title>{title}</Title>}
            {message && <Msg>{message}</Msg>}
          </>
        )}
      </div>
      <Spacer />
      {!isIdle &&
        actions.map((a, i) => (
          <Btn
            key={
              a?.id ?? `${a?.label ?? 'action'}-${a?.kind ?? 'default'}-${i}`
            }
            onClick={a.onClick}
            style={
              a.kind === 'primary'
                ? { background: '#fff', color: '#111', borderColor: '#fff' }
                : a.kind === 'danger'
                  ? {
                      background: '#e03131',
                      color: '#fff',
                      borderColor: '#e03131',
                    }
                  : {}
            }
          >
            {a.label}
          </Btn>
        ))}
      {!isIdle && onClose && <Btn onClick={onClose}>✕</Btn>}
    </Wrap>
  );
}
