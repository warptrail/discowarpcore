// frontend/src/components/BoxDetailView.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { styledComponents as S } from '../styles/BoxDetailView.styles';
import * as S from '../styles/BoxDetailView.styles';
// import * as S from '../styles/BoxTree.styles';
// import * as S from '../styles/ItemsFlatList.styles';

import BoxMetaPanel from './BoxMetaPanel';
import BoxTree from './BoxTree';
import ItemsFlatList from './ItemsFlatList';
import ItemDetails from './ItemDetails';

import flattenBoxes from '../util/flattenBoxes';
import { fetchBoxTreeByShortId } from '../api/boxes';

export default function BoxDetailView() {
  const { shortId } = useParams();
  const navigate = useNavigate();

  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'items'
  const [openItemId, setOpenItemId] = useState(null);

  useEffect(() => {
    if (!shortId) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetchBoxTreeByShortId(shortId, { signal: ac.signal })
      .then((data) => setBox(data))
      .catch((err) => {
        if (err.name !== 'AbortError')
          setError(err.message || 'Failed to load box');
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [shortId]);

  const flatItems = useMemo(() => (box ? flattenBoxes(box) : []), [box]);

  const itemIndexById = useMemo(() => {
    const idx = new Map();
    for (const it of flatItems) {
      const id = String(it?._id ?? it?.id ?? '');
      if (id) idx.set(id, it);
    }
    return idx;
  }, [flatItems]);

  const openItem = openItemId ? itemIndexById.get(openItemId) : null;

  const handleBack = () => navigate(-1);
  const handleNavigateBox = (sid) => {
    setOpenItemId(null);
    navigate(`/boxes/${sid}`);
  };
  const handleToggleItem = (id) => {
    setOpenItemId((curr) => (curr === id ? null : id));
  };
  const handleDetailsNavigate = (href) => {
    setOpenItemId(null);
    navigate(href);
  };

  if (loading) {
    return (
      <S.Container>
        <S.HeaderRow>
          <S.Title>Loading…</S.Title>
          <S.Spacer />
          <S.BackBtn onClick={handleBack}>Back</S.BackBtn>
        </S.HeaderRow>
        <S.Body>Fetching box {shortId}…</S.Body>
      </S.Container>
    );
  }

  if (error || !box) {
    return (
      <S.Container>
        <S.HeaderRow>
          <S.Title>Error</S.Title>
          <S.Spacer />
          <S.BackBtn onClick={handleBack}>Back</S.BackBtn>
        </S.HeaderRow>
        <S.Body>{error || 'Box not found'}</S.Body>
      </S.Container>
    );
  }

  console.log({
    BoxTree,
    ItemsFlatList,
    BoxMetaPanel,
    ItemDetails,
    stylesKeys: Object.keys(S || {}),
  });

  return (
    <S.Container>
      <S.HeaderRow>
        <S.Title>
          {box.label} <S.ShortId>({box.box_id})</S.ShortId>
        </S.Title>
        <S.Spacer />
        <S.BackBtn onClick={handleBack}>Back</S.BackBtn>
      </S.HeaderRow>

      <BoxMetaPanel box={box} />

      <S.Tabs>
        <S.TabButton
          type="button"
          data-active={activeTab === 'tree'}
          onClick={() => setActiveTab('tree')}
        >
          Tree
        </S.TabButton>
        <S.TabButton
          type="button"
          data-active={activeTab === 'items'}
          onClick={() => setActiveTab('items')}
        >
          Items
        </S.TabButton>
      </S.Tabs>

      {activeTab === 'tree' && (
        <BoxTree
          tree={box}
          openItemId={openItemId}
          onOpenItem={handleToggleItem}
          onNavigateBox={handleNavigateBox}
        />
      )}

      {activeTab === 'items' && (
        <ItemsFlatList
          items={flatItems}
          openItemId={openItemId}
          onOpenItem={handleToggleItem}
          title={`Items in ${box.label}`}
        />
      )}

      {openItem && (
        <ItemDetails
          item={openItem}
          itemId={openItemId}
          parentBoxShortId={box.box_id}
          onClose={() => setOpenItemId(null)}
          onNavigate={handleDetailsNavigate} // the only place with navigation to item page
        />
      )}
    </S.Container>
  );
}
