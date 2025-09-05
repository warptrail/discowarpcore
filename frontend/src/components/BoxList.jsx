// src/views/BoxList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { styledComponents as S } from '../styles/BoxList.styles';

/**
 * boxes: [{
 *   _id, box_id, label, location, description, notes,
 *   tags: string[], items: [{ _id, name, quantity }],
 *   childBoxes: same[]
 * }]
 */
export default function BoxList({ boxes = [], heading = 'Boxes' }) {
  return (
    <S.Container>
      <S.Heading>{heading}</S.Heading>
      {!boxes || boxes.length === 0 ? (
        <S.EmptyMessage>No boxes yet.</S.EmptyMessage>
      ) : (
        boxes.map((node) => (
          <Branch key={node._id || node.box_id} node={node} />
        ))
      )}
    </S.Container>
  );
}

function Branch({ node }) {
  const navigate = useNavigate();
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const tags = Array.isArray(node.tags) ? node.tags : [];
  const items = Array.isArray(node.items) ? node.items : [];

  const itemQtyTotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );
  const itemChips = items.slice(0, 8).map((it) => it.name || 'Untitled');

  const go = () => navigate(`/boxes/${node.box_id}`);

  return (
    <>
      <S.BoxCard onClick={go}>
        {/* Header */}
        <S.BoxHeader>
          <S.ShortId>#{node.box_id}</S.ShortId>
          <S.BoxTitle>{node.label || 'Untitled'}</S.BoxTitle>
        </S.BoxHeader>

        {/* Labeled fields */}
        {node.location && (
          <S.FieldGroup>
            <S.FieldLabel>Location</S.FieldLabel>
            <S.FieldValue>{node.location}</S.FieldValue>
          </S.FieldGroup>
        )}

        {node.description && (
          <S.FieldGroup>
            <S.FieldLabel>Description</S.FieldLabel>
            <S.FieldValue>{node.description}</S.FieldValue>
          </S.FieldGroup>
        )}

        {node.notes && (
          <S.FieldGroup>
            <S.FieldLabel>Notes</S.FieldLabel>
            <S.FieldValue>{node.notes}</S.FieldValue>
          </S.FieldGroup>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <S.FieldGroup>
              <S.FieldLabel>Tags</S.FieldLabel>
              <S.FieldValue />
            </S.FieldGroup>
            <S.TagRow>
              {tags.map((t, i) => (
                <S.TagBubble key={`${node._id || node.box_id}-tag-${i}`}>
                  {t}
                </S.TagBubble>
              ))}
            </S.TagRow>
          </>
        )}

        {/* Footer stats */}
        <S.BoxFooter>
          <S.StatPill $variant="boxes">
            {childBoxes.length} {childBoxes.length === 1 ? 'box' : 'boxes'}
          </S.StatPill>
          <S.StatPill $variant="items">
            {itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}
          </S.StatPill>
          <S.StatPill>
            {node.location ? truncate(node.location, 24) : '—'}
          </S.StatPill>
        </S.BoxFooter>

        {/* Low-priority tiny item chips */}
        {itemChips.length > 0 && (
          <>
            <S.FieldGroup>
              <S.FieldLabel>Items</S.FieldLabel>
              <S.FieldValue />
            </S.FieldGroup>
            <S.TagRow>
              {itemChips.map((name, i) => (
                <S.TagBubble $tiny key={`${node._id || node.box_id}-chip-${i}`}>
                  {name}
                </S.TagBubble>
              ))}
            </S.TagRow>
          </>
        )}
      </S.BoxCard>

      {/* Children */}
      {childBoxes.length > 0 && (
        <S.NodeChildren>
          {childBoxes.map((child) => (
            <Branch key={child._id || child.box_id} node={child} />
          ))}
        </S.NodeChildren>
      )}
    </>
  );
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}
