import React, { useState } from 'react';
import ItemLifecycleActionsBar from './ItemLifecycleActionsBar';

function MoveItemBar({
  itemId,
  initialItem,
  sourceBoxId,
  refreshBox,
  navigate,
  onMoveRequest,
  onOrphanRequest,
}) {
  const [showMovePanel, setShowMovePanel] = useState(false);
  const [moveResult, setMoveResult] = useState(null);

  const handleBoxSelected = ({ destBoxId, destLabel, destShortId }) => {
    onMoveRequest({
      itemId,
      itemName: initialItem?.name,
      itemQuantity: initialItem?.quantity,
      sourceBoxId,
      destBoxId,
      destLabel,
      destShortId,
    });

    setShowMovePanel(false);
  };

  const handleUndo = () => {
    console.log(`🔄 Undoing move of item ${itemId}`);
    setMoveResult(null);
    refreshBox();
  };

  const handleOrphan = () => {
    console.log(`🛑 Orphaning item ${itemId}`);
    onOrphanRequest();
    refreshBox();
  };

  const handleDestroy = () => {
    console.log(`💥 Destroying item ${itemId}`);
    refreshBox();
  };

  return (
    <ItemLifecycleActionsBar
      moveResult={moveResult}
      itemId={itemId}
      navigate={navigate}
      handleUndo={handleUndo}
      handleOrphan={handleOrphan}
      handleDestroy={handleDestroy}
      showMovePanel={showMovePanel}
      setShowMovePanel={setShowMovePanel}
      sourceBoxId={sourceBoxId}
      handleBoxSelected={handleBoxSelected}
    />
  );
}

export default MoveItemBar;
