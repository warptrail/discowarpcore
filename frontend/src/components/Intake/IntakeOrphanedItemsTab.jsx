import React from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import MiniOrphanedList from '../MiniOrphanedList';

const Wrap = styled.div`
  display: grid;
  gap: 0.46rem;
`;

const Info = styled.div`
  color: #9fc2b5;
  font-size: 0.75rem;
  border: 1px solid rgba(106, 162, 132, 0.45);
  border-radius: 9px;
  background: rgba(13, 29, 22, 0.7);
  padding: 0.46rem 0.52rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Viewport = styled.div`
  max-height: min(42vh, 360px);
  overflow: auto;
  border: 1px solid rgba(85, 140, 113, 0.42);
  border-radius: 10px;
  background: rgba(8, 15, 12, 0.54);
  padding: 0.46rem;

  & > section {
    margin-top: 0;
  }
`;

export default function IntakeOrphanedItemsTab({
  currentBox,
  refreshKey = 0,
  onItemMoved,
}) {
  const boxId = String(currentBox?._id || '');

  return (
    <Wrap>
      <Info>
        Assign orphaned items directly into the current Intake box.
      </Info>

      <Viewport>
        <MiniOrphanedList
          boxMongoId={boxId}
          refreshKey={refreshKey}
          assignLabel="Add To Current Box"
          onItemAssigned={(itemId, context = {}) => {
            if (!boxId) return;
            const item = context?.item || null;
            const message = `Added ${item?.name || 'orphaned item'} to box #${currentBox?.box_id || '---'}.`;
            onItemMoved?.({
              itemId,
              destBoxId: boxId,
              item: item
                ? {
                    ...item,
                    boxId,
                    box: {
                      _id: boxId,
                      box_id: currentBox?.box_id,
                      label: currentBox?.label,
                    },
                  }
                : undefined,
              message,
            });
          }}
        />
      </Viewport>
    </Wrap>
  );
}
