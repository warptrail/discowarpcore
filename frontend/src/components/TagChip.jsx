// frontend/src/components/TagChip.jsx
import React from 'react';
import { Tag } from '../styles/Tag.styles';

/**
 * Props:
 * - children
 * - onClick?: () => void
 * - selected?: boolean
 * - variant?: 'subtle' | 'outline' | 'filled'
 * - size?: 'xs' | 'sm' | 'md'
 */
export default function TagChip({
  children,
  onClick,
  selected,
  variant = 'subtle',
  size = 'sm',
  ...rest
}) {
  return (
    <Tag
      $variant={variant}
      $size={size}
      $clickable={!!onClick}
      $selected={!!selected}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Tag>
  );
}
