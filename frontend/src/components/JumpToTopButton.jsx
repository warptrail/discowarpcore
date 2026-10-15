import { useEffect, useState } from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: grid;
  place-items: center;
  width: 40px;
  min-height: 40px;
  padding: 0;
  border: 1px solid var(--dw-border-soft);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: var(--dw-text-secondary);
  cursor: pointer;

  svg { width: 18px; height: 18px; }
  &:hover { color: var(--dw-cyan); border-color: var(--dw-cyan); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  @media (pointer: coarse) { width: 44px; min-height: 44px; }
`;

export default function JumpToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > Math.max(400, window.innerHeight * 0.75));
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  if (!visible) return null;

  return (
    <Button
      type="button"
      aria-label="Jump to top"
      title="Jump to top"
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V6m-5 5 5-5 5 5M6 3h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Button>
  );
}
