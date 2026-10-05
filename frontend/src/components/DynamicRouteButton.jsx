import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const DynamicButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  margin: 1rem auto;
  max-width: 100%;
  font-family: var(--dw-font-ui);
  font-size: 1rem;
  font-weight: bold;
  line-height: 1.2;
  background-color: var(--dw-surface);
  color: var(--dw-text);
  border: 1px solid var(--dw-border);
  min-height: 44px;
  border-radius: var(--dw-radius-sm);
  text-decoration: none;
  text-shadow: none;
  text-indent: 0;
  white-space: nowrap;
  overflow: visible;
  transition: background-color 140ms ease, border-color 140ms ease;
  box-shadow: none;

  &:hover {
    background-color: var(--dw-surface-raised);
    border-color: var(--dw-cyan);
    color: var(--dw-cyan);
    box-shadow: none;
  }

  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

export default function DynamicRouteButton() {
  const location = useLocation();

  let to = '/';
  let label = 'Operations';

  if (location.pathname === '/all-items') {
    to = '/';
    label = 'Back to boxes';
  } else if (location.pathname.startsWith('/boxes/') || location.pathname.startsWith('/box/')) {
    to = '/all-items';
    label = 'View all items';
  } else if (location.pathname === '/') {
    to = '/all-items';
    label = 'View all items';
  } else {
    to = '/';
    label = 'Operations';
  }

  return <DynamicButton to={to}>{label}</DynamicButton>;
}
