// src/components/ItemTags.jsx

import styled from 'styled-components';

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const Tag = styled.span`
  background-color: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
`;

export default function ItemTags({ tags = [] }) {
  if (!tags.length) return null;

  return (
    <TagList>
      {tags.map((tag, index) => (
        <Tag key={index}>#{tag}</Tag>
      ))}
    </TagList>
  );
}
