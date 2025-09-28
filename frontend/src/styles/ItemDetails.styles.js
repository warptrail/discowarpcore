import styled, { keyframes } from 'styled-components';

export const Container = styled.div`
  padding: 1rem;
  font-size: 0.9rem;
  color: #eee;
`;

export const Header = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.2rem;
  color: #fff;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

export const CellLabel = styled.td`
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  color: #aaa;
  width: 30%;
`;

export const CellValue = styled.td`
  padding: 0.25rem 0.5rem;
`;

export const Crumb = styled.span`
  display: inline-block;
  margin-right: 0.5rem;
  &:after {
    content: '›';
    margin-left: 0.5rem;
    opacity: 0.6;
  }
  &:last-child:after {
    content: '';
  }
`;

export const Status = styled.div`
  padding: 1rem;
  color: #ccc;
`;

export const TestButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;

  button {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:first-child {
    background: #ffd700;
    color: #000;
  }

  button:last-child {
    background: #dc3545;
    color: #fff;
  }
`;
const shimmer = keyframes`
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
`;

export const Skeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;

  div {
    height: 0.9rem;
    border-radius: 4px;
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 37%, #2a2a2a 63%);
    background-size: 400% 100%;
    animation: ${shimmer} 1.4s ease infinite;
  }
`;

// optional: generic error message style
export const ErrorMsg = styled.div`
  padding: 1rem;
  color: #ff6b6b;
  font-size: 0.9rem;
`;
