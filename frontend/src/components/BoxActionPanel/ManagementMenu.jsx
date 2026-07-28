import React from 'react';
import * as S from './ManagementMenu.styles';

const ACTIONS = [
  ['edit', '✦', 'Edit details', 'Identity, labels, notes, tags, and photo'],
  ['nest', '↗', 'Nest in another box', 'Move this box under a parent'],
  ['export', '↓', 'Export box', 'Download a copy or printable label'],
  ['empty', '◇', 'Empty box', 'Release the items while keeping the box'],
  ['destroy', '×', 'Destroy box', 'Permanently remove this box'],
];

export default function ManagementMenu({ active, busy, onOpen }) {
  return (
    <S.Menu aria-label="Box management actions">
      <S.MenuIntro>Choose one thing to do with this box.</S.MenuIntro>
      <S.ActionList>
        {ACTIONS.map(([key, icon, title, description]) => (
          <S.ActionRow
            key={key}
            type="button"
            $danger={key === 'destroy'}
            $active={active === key}
            disabled={busy}
            aria-current={active === key ? 'page' : undefined}
            onClick={() => onOpen?.(key)}
          >
            <S.ActionIcon aria-hidden="true">{icon}</S.ActionIcon>
            <S.ActionCopy>
              <S.ActionTitle>{title}</S.ActionTitle>
              <S.ActionDescription>{description}</S.ActionDescription>
            </S.ActionCopy>
            <S.ActionChevron aria-hidden="true">›</S.ActionChevron>
          </S.ActionRow>
        ))}
      </S.ActionList>
    </S.Menu>
  );
}
