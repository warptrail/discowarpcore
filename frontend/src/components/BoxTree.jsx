import { useNavigate } from 'react-router-dom';
import ItemRow from './ItemRow.shared';
import * as S from './BoxTree.styles';

export default function BoxTree({
  boxId,
  boxesById,
  childrenByBoxId,
  itemsById,
  onOpenItem,
  selectedItemId,
}) {
  const navigate = useNavigate();
  const box = boxesById.get(String(boxId));
  if (!box) return null;

  const childIds = childrenByBoxId.get(String(boxId)) || [];
  const itemIds = Array.isArray(box.items) ? box.items.map(String) : [];

  const goToBox = () => navigate(`/boxes/${box.box_id}`);

  return (
    <S.TreeList>
      <S.TreeNode
        role="link"
        tabIndex={0}
        onClick={goToBox}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToBox();
          }
        }}
      >
        <S.NodeHeader>
          <S.NodeTitle>
            <S.BoxLabelText>{box.label || box.name}</S.BoxLabelText>
            <S.Meta>{itemIds.length} items</S.Meta>
            <S.Meta>{childIds.length} boxes</S.Meta>
          </S.NodeTitle>
        </S.NodeHeader>

        {/* The only change vs your old code: use the shared ItemRow */}
        <ItemRow
          itemIds={itemIds}
          itemsById={itemsById}
          onOpenItem={onOpenItem}
          selectedId={selectedItemId}
          showThumb
          showTags
          showMeta
          compact
        />

        {childIds.length > 0 && (
          <S.NodeChildren>
            {childIds.map((cid) => (
              <BoxTree
                key={cid}
                boxId={cid}
                boxesById={boxesById}
                childrenByBoxId={childrenByBoxId}
                itemsById={itemsById}
                onOpenItem={onOpenItem}
                selectedItemId={selectedItemId}
              />
            ))}
          </S.NodeChildren>
        )}
      </S.TreeNode>
    </S.TreeList>
  );
}
