// src/views/BoxDetailView.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBoxTreeByShortId } from '../api/boxes';
import { styledComponents as S } from '../styles/BoxDetailView.styles';

// ? Component Imports

import BoxEditPanel from './BoxEditPanel';
import BoxMetaPanel from './BoxMetaPanel';
import TabControlBar from './TabControlBar';
import ItemRow from './ItemRow';

export default function BoxDetailView({ onOpenBox, onOpenItem }) {
  const { shortId } = useParams(); // this is your box_id
  const navigate = useNavigate();

  // ? State
  const [tree, setTree] = useState(null);
  const [tab, setTab] = useState('boxes'); // "boxes" | "items" | "edit"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // fetch helpers
  async function refresh() {
    try {
      setBusy(true);
      const ctrl = new AbortController();
      const data = await fetchBoxTreeByShortId(shortId, {
        signal: ctrl.signal,
      });
      setTree(data);
    } catch (e) {
      setErr(e?.message || 'Failed to refresh this box.');
    } finally {
      setBusy(false);
    }
  }

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

  const itemsCount = allItems.length;
  const totalQuantity = allItems.reduce(
    (sum, it) => sum + Number(it.quantity || 0),
    0
  );

  return (
    <S.Container>
      <S.Heading>
        {tree.label} <S.Meta>#{tree.box_id || tree._id}</S.Meta>
      </S.Heading>
      <BoxMetaPanel
        box={tree}
        onGoToBox={(sid) => {
          if (!sid) return;
          if (typeof openBox === 'function') return openBox(sid);
          if (typeof navigate === 'function') navigate(`/boxes/${sid}`);
        }}
        itemsCount={itemsCount}
        totalQuantity={totalQuantity}
      />

      <TabControlBar mode={tab} onChange={setTab} busy={busy} />

      {tab === 'boxes' && (
        <BoxTree node={tree} onOpenBox={openBox} onOpenItem={openItem} />
      )}

      {tab === 'items' && <ItemsList items={allItems} onOpenItem={openItem} />}

      {tab === 'edit' && (
        <div style={{ marginBottom: 12 }}>
          <BoxEditPanel
            flatItems={allItems}
            boxTree={tree}
            shortId={tree.box_id || tree._id} // matches your existing id usage
            boxMongoId={tree._id}
            onItemsDataUpdated={refresh} // optional; omit if not using refresh()
            onBoxSaved={refresh} // optional
            busy={busy} // optional
            onDeleted={() => navigate('/')} // keep your existing navigate pattern
            onRequestDelete={() => setTab('edit')}
          />
        </div>
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
