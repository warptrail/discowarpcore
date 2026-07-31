import React, { useState } from 'react';
import * as S from './ItemDossier.styles';

export default function ItemActivityDisclosure({
  actions = [],
  timestamps = {},
}) {
  const [open, setOpen] = useState(false);
  const activityActions = Array.isArray(actions) ? actions : [];

  if (!activityActions.length) return null;

  return (
    <S.Disclosure>
      <S.DisclosureButton
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>Log activity</span>
        <S.DisclosureState>{open ? 'CLOSE' : 'OPEN'}</S.DisclosureState>
      </S.DisclosureButton>

      <S.DisclosureBody $open={open} aria-hidden={!open}>
        <div>
          <S.ActivityGrid>
            {activityActions.map((action) => (
              <S.ActivityButton
                key={action.id}
                type="button"
                disabled={action.disabled}
                onClick={action.onClick}
              >
                <S.ActivityTitle>{action.label}</S.ActivityTitle>
                <S.ActivityTime>
                  {timestamps?.[action.id] || 'Not logged yet'}
                </S.ActivityTime>
              </S.ActivityButton>
            ))}
          </S.ActivityGrid>
        </div>
      </S.DisclosureBody>
    </S.Disclosure>
  );
}
