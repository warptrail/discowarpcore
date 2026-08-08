// src/components/BoxMetaPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import * as S from '../styles/BoxMetaPanel.styles';
import { BOX_CONTEXT_STATE_EVENT } from '../constants/inventoryFinderEvents';
import BoxPresentationHero from './BoxMetaPanel/BoxPresentationHero';
import { getBoxPreviewImageUrl } from '../util/itemImage';

/**
 * BoxMetaPanel
 *
 * Props:
 * - box:        the root box node for this scoped view:
 *               { _id, box_id, label, parentBox, items: [...], childBoxes: [...] }
 * - parentPath: optional array of ancestors in order root → … → parent
 *               e.g. [{ id: '001', label: 'Root' }, { id: '120', label: 'Storage' }]
 * - onNavigateBox: (shortId: string) => void   // navigate to a different box scope
 * - onEditBox: () => void                      // open box edit panel
 * - stats:      optional { boxes, uniqueItems, totalItems } from backend; if omitted, computed here
 */

// ---- local helpers (pure, no side effects) ---------------------------------
function pad3(idLike) {
  const s = String(idLike ?? '').replace(/\D+/g, '');
  return s ? s.padStart(3, '0') : '‒‒‒';
}

function kidsOf(n) {
  const a = n?.childBoxes ?? [];
  return Array.isArray(a) ? a : [];
}

function withCacheBuster(url, token) {
  const source = String(url || '').trim();
  if (!source) return '';
  const marker = Number(token);
  if (!Number.isFinite(marker) || marker <= 0) return source;
  return `${source}${source.includes('?') ? '&' : '?'}v=${marker}`;
}

function walk(root, visit) {
  if (!root) return;
  const stack = [root];
  const seen = new Set();
  while (stack.length) {
    const n = stack.pop();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    visit(n);
    for (const k of kidsOf(n)) stack.push(k);
  }
}

function DescendantBranch({ node, depth = 0, onNavigateBox }) {
  if (!node) return null;

  const nodeId = String(node?.box_id ?? node?.shortId ?? '');
  const nodeLabel = node?.label ?? node?.name ?? 'Box';
  const nested = kidsOf(node);

  return (
    <S.DescendantNode>
      <S.DescendantRow>
        <S.DescendantConnector $depth={depth} />
        <S.DescendantLink
          href={nodeId ? `/boxes/${nodeId}` : undefined}
          onClick={(e) => {
            if (!nodeId) return;
            e.preventDefault();
            onNavigateBox?.(nodeId);
          }}
          title={`${nodeLabel}${nodeId ? ` (${nodeId})` : ''}`}
        >
          <S.BoxIdMono>{pad3(nodeId)}</S.BoxIdMono>
          <S.BoxLinkLabel>{nodeLabel}</S.BoxLinkLabel>
        </S.DescendantLink>
        {nested.length > 0 && (
          <S.DescendantMeta>
            {nested.length} {nested.length === 1 ? 'child' : 'children'}
          </S.DescendantMeta>
        )}
      </S.DescendantRow>

      {nested.length > 0 && (
        <S.DescendantChildren>
          {nested.map((child, idx) => (
            <DescendantBranch
              key={String(
                child?._id ??
                  child?.box_id ??
                  child?.shortId ??
                  `desc-${depth + 1}-${idx}`
              )}
              node={child}
              depth={depth + 1}
              onNavigateBox={onNavigateBox}
            />
          ))}
        </S.DescendantChildren>
      )}
    </S.DescendantNode>
  );
}

// ----------------------------------------------------------------------------

export default function BoxMetaPanel({
  box,
  parentPath = [],
  onNavigateBox,
  imageRefreshToken = 0,
}) {
  const shortId = String(box?.box_id ?? box?.shortId ?? '');
  const title = box?.label ?? box?.name ?? 'Box';
  const group = String(box?.group ?? '').trim();
  const location = String(
    box?.location ?? box?.locationName ?? box?.locationId?.name ?? ''
  ).trim();
  const description = String(box?.description ?? '').trim();
  const notes = String(box?.notes ?? '').trim();
  const previewTags = Array.isArray(box?.tags)
    ? box.tags.map((tag) => String(tag?.value ?? tag ?? '').trim()).filter(Boolean)
    : [];
  const children = kidsOf(box);
  const [metaIndex, setMetaIndex] = useState(0);
  const metadata = useMemo(() => [
    group ? `Group · ${group}` : '',
    `${Array.isArray(box?.items) ? box.items.length : 0} items`,
    children.length ? `${children.length} nested boxes` : '',
    box?.createdAt ? `Created · ${new Date(box.createdAt).toLocaleDateString()}` : '',
    box?.updatedAt ? `Updated · ${new Date(box.updatedAt).toLocaleDateString()}` : '',
    previewTags.length ? `${previewTags.length} tags` : '',
  ].filter(Boolean), [box?.createdAt, box?.items, box?.updatedAt, children.length, group, previewTags.length]);
  useEffect(() => {
    if (metadata.length < 2) return undefined;
    const timer = window.setInterval(() => setMetaIndex((index) => (index + 1) % metadata.length), 3200);
    return () => window.clearInterval(timer);
  }, [metadata.length]);
  const boxImageUrl = getBoxPreviewImageUrl(box);
  const boxImageSrc = withCacheBuster(boxImageUrl, imageRefreshToken);
  const boxLightboxUrl = withCacheBuster(
    box?.image?.original?.url || boxImageUrl,
    imageRefreshToken,
  );

  // Breadcrumb: ancestors (parentPath) + current
  // Build crumbs (root → … → parent → current)
  const crumbs = useMemo(() => {
    if (!box) return [];
    const shortId = String(box.box_id ?? box.shortId ?? '');
    const title = box.label ?? box.name ?? 'Box';

    const base = Array.isArray(parentPath) ? parentPath : [];
    // normalize parentPath entries just in case
    const normalized = base.map((p) => ({
      id: String(p.id ?? p.box_id ?? ''),
      label: p.label ?? 'Box',
    }));
    return [...normalized, { id: shortId, label: title, current: true }];
  }, [box, parentPath]);

  const depth = crumbs.length - 1;
  const currentCrumb = crumbs[crumbs.length - 1];
  const descendantCount = useMemo(() => {
    if (!box) return 0;
    let count = 0;
    walk(box, () => {
      count += 1;
    });
    return Math.max(0, count - 1);
  }, [box]);

  useEffect(() => {
    if (!box) return;
    window.dispatchEvent(
      new CustomEvent(BOX_CONTEXT_STATE_EVENT, {
        detail: { shortId, title, location, breadcrumb: crumbs },
      })
    );
  }, [box, crumbs, location, shortId, title]);

  // Child box click
  const goBox = (id) => {
    if (!id) return;
    onNavigateBox?.(String(id));
  };

  if (!box) return null;

  return (
    <S.Panel>
      <S.IdentityZone>
        <S.IdentityHeader>
          <S.RotatingMeta aria-live="polite">{metadata[metaIndex % Math.max(metadata.length, 1)]}</S.RotatingMeta>
          <S.IdentityActions>
            {!!depth && <S.DepthHint>level {depth}</S.DepthHint>}
          </S.IdentityActions>
        </S.IdentityHeader>

        <BoxPresentationHero
          box={box}
          boxId={pad3(currentCrumb?.id)}
          title={currentCrumb?.label ?? title}
          group={group}
          location={location}
          description={description}
          tags={previewTags}
          notes={notes}
          imageUrl={boxImageSrc}
          lightboxUrl={boxLightboxUrl}
        />
      </S.IdentityZone>

      {children.length > 0 ? <S.ChildrenZone>
        <S.SectionHeader>
          <S.Label>Descendants</S.Label>
          <S.MetaCount>
            {descendantCount} total • {children.length} direct
          </S.MetaCount>
        </S.SectionHeader>
        <S.SectionHint>Select a box below to focus that subtree.</S.SectionHint>
        <S.ChildrenRow>
          {children.length === 0 ? (
            <S.Muted>None</S.Muted>
          ) : (
            children.map((child, idx) => (
              <DescendantBranch
                key={String(
                  child?._id ?? child?.box_id ?? child?.shortId ?? `desc-0-${idx}`
                )}
                node={child}
                depth={0}
                onNavigateBox={goBox}
              />
            ))
          )}
        </S.ChildrenRow>
      </S.ChildrenZone> : null}
    </S.Panel>
  );
}
