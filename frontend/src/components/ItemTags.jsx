// src/components/ItemTags.jsx

import TagLinks from './TagLinks';

export default function ItemTags({ tags = [] }) {
  if (!tags.length) return null;

  return <TagLinks tags={tags} />;
}
