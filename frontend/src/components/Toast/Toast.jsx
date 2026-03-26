// Toast.jsx
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_NARROW_BREAKPOINT,
} from '../../styles/tokens';

const Wrap = styled.div`
  position: relative;
  display: flex;
  gap: 0.75rem;
  align-items: ${({ $hasContent }) => ($hasContent ? 'flex-start' : 'center')};
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
  padding-right: ${({ $hasClose }) => ($hasClose ? '3rem' : '1rem')};
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    margin: 6px 0;
    min-height: 44px;
    padding: 0.5rem 0.6rem;
    padding-right: ${({ $hasClose }) => ($hasClose ? '2.7rem' : '0.6rem')};
    border-radius: 8px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.24);
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  gap: ${({ $hasContent }) => ($hasContent ? '0.55rem' : '0.2rem')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.88rem;
    gap: ${({ $hasContent }) => ($hasContent ? '0.4rem' : '0.15rem')};
  }
`;
const Title = styled.div`
  font-weight: 600;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.86rem;
  }
`;
const Msg = styled.div`
  opacity: 0.9;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.82rem;
  }
`;
const ContentWrap = styled.div`
  width: 100%;
`;
const Idle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  opacity: 0.9;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.4rem;
    font-size: 0.82rem;
  }
`;
const Controls = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  flex-wrap: wrap;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 100%;
    justify-content: flex-start;
  }
`;
const Btn = styled.button`
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 7px;
    padding: 0.28rem 0.5rem;
    min-height: 34px;
    font-size: 0.78rem;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const CloseBtn = styled(Btn)`
  position: absolute;
  top: 0.5rem;
  right: 0.55rem;
  min-height: 30px;
  min-width: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  font-size: 0.92rem;
  line-height: 1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    top: 0.38rem;
    right: 0.42rem;
    min-height: 28px;
    min-width: 28px;
    border-radius: 7px;
  }
`;

export default function Toast({
  open,
  title,
  message,
  content,
  variant = 'info', // 'success' | 'warning' | 'danger' | 'info'
  actions = [], // [{id?, label, onClick, kind}] kind 'primary'|'ghost'
  onClose,
  showIdle = true,
  idleIcon = '📦',
  idleText = 'Standing by…',
}) {
  const isIdle = !open;
  const hasContent = !isIdle && !!content;

  return (
    <Wrap
      $variant={variant}
      $idle={isIdle}
      $hasContent={hasContent}
      $hasClose={!isIdle && !!onClose}
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      <Body $hasContent={hasContent}>
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
            {hasContent && <ContentWrap>{content}</ContentWrap>}
          </>
        )}
      </Body>
      {!isIdle && (
        <Controls>
          {actions.map((a, i) => (
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
        </Controls>
      )}
      {!isIdle && onClose ? <CloseBtn onClick={onClose}>✕</CloseBtn> : null}
    </Wrap>
  );
}
