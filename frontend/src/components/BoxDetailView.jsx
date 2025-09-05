// src/views/BoxDetailView.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBoxTreeByShortId } from '../api/boxes';
import { styledComponents as S } from '../styles/BoxDetailView.styles';

export default function BoxDetailView({ onOpenBox, onOpenItem }) {
  const { shortId } = useParams(); // this is your box_id
  const navigate = useNavigate();

  const [tree, setTree] = useState(null);
  const [tab, setTab] = useState('boxes'); // "boxes" | "items"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      setLoading(true);
      setErr('');
      setTree(null);
      try {
        const data = await fetchBoxTreeByShortId(shortId, {
          signal: ctrl.signal,
        });
        if (alive) setTree(data);
      } catch (e) {
        if (alive) setErr(e?.message || 'Failed to load box');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [shortId]);

  // Flatten all items for the "Items" tab — recurse over childBoxes
  const allItems = useMemo(() => {
    if (!tree) return [];
    const out = [];
    (function walk(n) {
      if (!n) return;
      if (Array.isArray(n.items)) out.push(...n.items);
      if (Array.isArray(n.childBoxes)) n.childBoxes.forEach(walk);
    })(tree);
    return out;
  }, [tree]);

  function openBox(box) {
    if (onOpenBox) return onOpenBox(box);
    if (box?.box_id) navigate(`/boxes/${box.box_id}`);
  }

  function openItem(item) {
    if (onOpenItem) return onOpenItem(item);
    if (item?._id) navigate(`/items/${item._id}`);
  }

  if (loading) {
    return (
      <S.Container>
        <S.Heading $flash>Loading…</S.Heading>
      </S.Container>
    );
  }

  if (err || !tree) {
    return (
      <S.Container>
        <S.Heading $flash>Box not found</S.Heading>
        <S.EmptyMessage>{err || 'We couldn’t find that box.'}</S.EmptyMessage>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Heading>
        {tree.label} <S.Meta>#{tree.box_id || tree._id}</S.Meta>
      </S.Heading>

      {/* Immediate child boxes as quick chips by box_id (click to navigate) */}
      {Array.isArray(tree.childBoxes) && tree.childBoxes.length > 0 ? (
        <>
          <S.NodeHeader>
            <S.NodeTitle>Child boxes (box_id):</S.NodeTitle>
          </S.NodeHeader>
          <S.TagRow>
            {tree.childBoxes.map((c) => (
              <S.TagBubble key={c._id || c.box_id} onClick={() => openBox(c)}>
                {c.box_id}
              </S.TagBubble>
            ))}
          </S.TagRow>
        </>
      ) : (
        <S.EmptyMessage>No child boxes</S.EmptyMessage>
      )}

      <S.TabToggle>
        <S.TabButton $active={tab === 'boxes'} onClick={() => setTab('boxes')}>
          Boxes
        </S.TabButton>
        <S.TabButton $active={tab === 'items'} onClick={() => setTab('items')}>
          Items
        </S.TabButton>
      </S.TabToggle>

      {tab === 'boxes' ? (
        <BoxTree node={tree} onOpenBox={openBox} onOpenItem={openItem} />
      ) : (
        <ItemsList items={allItems} onOpenItem={openItem} />
      )}
    </S.Container>
  );
}

/** Recursive tree renderer — expects { _id, box_id, label, items[], childBoxes[] } */
function BoxTree({ node }) {
  const navigate = useNavigate();

  const goToBox = () => {
    navigate(`/boxes/${node.box_id}`);
  };

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
            <S.BoxLabelText>{node.label}</S.BoxLabelText>
            <S.Meta>{node.items?.length ?? 0} items</S.Meta>
            <S.Meta>{node.childBoxes?.length ?? 0} boxes</S.Meta>
          </S.NodeTitle>
        </S.NodeHeader>

        <ItemsList items={node.items} />

        {Array.isArray(node.childBoxes) && node.childBoxes.length > 0 && (
          <S.NodeChildren>
            {node.childBoxes.map((child) => (
              <BoxTree key={child._id || child.box_id} node={child} />
            ))}
          </S.NodeChildren>
        )}
      </S.TreeNode>
    </S.TreeList>
  );
}

/** Flat list — items shaped like your Item model */
function ItemsList({ items = [] }) {
  if (!items.length) return <S.EmptyMessage>No items to show.</S.EmptyMessage>;

  return (
    <S.ItemList>
      {items.map((it) => (
        <S.ItemNode key={it._id}>
          <S.ItemRow>
            <S.ItemQuantity>{it.quantity}</S.ItemQuantity>
            <S.ItemTitle>{it.name}</S.ItemTitle>
          </S.ItemRow>
          {it.notes ? (
            <S.NotePreview>{it.notes}</S.NotePreview>
          ) : (
            <S.NotePreview />
          )}
          {it.tags?.length > 0 && (
            <S.TagRow>
              {it.tags.map((t, i) => (
                <S.TagBubble key={`${it._id}-tag-${i}`}>{t}</S.TagBubble>
              ))}
            </S.TagRow>
          )}
        </S.ItemNode>
      ))}
    </S.ItemList>
  );
}
