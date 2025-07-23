import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const DynamicButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  margin: 2rem auto;
  font-size: 1rem;
  font-weight: bold;
  line-height: 1.2;
  background-color: #1a1a2e;
  color: #f8f8ff !important; /* <--- force visibility */
  border: 2px solid #8866ff;
  border-radius: 6px;
  text-decoration: none;
  text-shadow: none;
  text-indent: 0;
  white-space: nowrap;
  overflow: visible;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(136, 102, 255, 0.15);

  &:hover {
    background-color: #8866ff;
    color: #000 !important;
    box-shadow: 0 0 20px rgba(136, 102, 255, 0.4);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 0 10px rgba(136, 102, 255, 0.6);
  }
`;

export default function DynamicRouteButton() {
  const location = useLocation();

  let to = '/';
  let label = '🏠 Home';

  if (location.pathname === '/all-items') {
    to = '/';
    label = '📦 Back to Boxes';
  } else if (location.pathname.startsWith('/box/')) {
    to = '/all-items';
    label = '📋 View All Items';
  } else if (location.pathname === '/') {
    to = '/all-items';
    label = '📋 View All Items';
  } else {
    to = '/';
    label = '🏠 Home';
  }

  return <DynamicButton to={to}>{label}</DynamicButton>;
}
