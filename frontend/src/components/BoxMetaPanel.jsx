// src/components/BoxMetaPanel.jsx
import React, { useMemo } from 'react';
import * as S from '../styles/BoxMetaPanel.styles';

/**
 * BoxMetaPanel
 *
 * Props:
 * - box:        the root box node for this scoped view:
 *               { _id, box_id, label, parentBox, items: [...], childBoxes: [...] }
 * - parentPath: optional array of ancestors in order root → … → parent
 *               e.g. [{ id: '001', label: 'Root' }, { id: '120', label: 'Storage' }]
 * - onNavigateBox: (shortId: string) => void   // navigate to a different box scope
 * - stats:      optional { boxes, uniqueItems, totalItems } from backend; if omitted, computed here
 */

// ---- local helpers (pure, no side effects) ---------------------------------
function pad3(idLike) {
  const s = String(idLike ?? '').replace(/\D+/g, '');
  return s ? s.padStart(3, '0') : '‒‒‒';
}

function itemsOf(n) {
  const a = n?.items ?? [];
  return Array.isArray(a) ? a : [];
}
function kidsOf(n) {
  const a = n?.childBoxes ?? [];
  return Array.isArray(a) ? a : [];
}

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function getRenderableBoxTags(tags, { blockedValues = [] } = {}) {
  const source = Array.isArray(tags) ? tags : [];
  if (!source.length) return [];

  const blocked = new Set(
    (Array.isArray(blockedValues) ? blockedValues : [])
      .map((entry) => normalizeToken(entry))
      .filter(Boolean)
  );
  const seen = new Set();
  const result = [];

  for (const rawTag of source) {
    const label = String(rawTag || '').trim();
    if (!label) continue;
    const key = normalizeToken(label);
    if (!key || seen.has(key) || blocked.has(key)) continue;
    seen.add(key);
    result.push(label);
  }

  return result;
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

function computeStatsFromTree(root) {
  let boxes = 0;
  const names = new Set();
  let totalItems = 0;

  walk(root, (n) => {
    boxes += 1;
    for (const it of itemsOf(n)) {
      const nm = String(it?.name ?? '')
        .trim()
        .toLowerCase();
      if (nm) names.add(nm);
      totalItems += Number.isFinite(it?.quantity) ? it.quantity : 1;
    }
  });

  return { boxes, uniqueItems: names.size, totalItems };
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
  stats,
}) {
  const shortId = String(box?.box_id ?? box?.shortId ?? '');
  const title = box?.label ?? box?.name ?? 'Box';
  const group = String(box?.group ?? '').trim();
  const notes = String(box?.notes ?? '').trim();
  const location = String(
    box?.location ?? box?.locationName ?? box?.locationId?.name ?? ''
  ).trim();
  const tags = useMemo(
    () =>
      getRenderableBoxTags(box?.tags, {
        blockedValues: [group, location],
      }),
    [box?.tags, group, location]
  );
  const children = kidsOf(box);
  const boxImageUrl =
    box?.image?.display?.url ||
    box?.image?.thumb?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    '';

  // Badge logic (uses only data we have on this node)
  const scope = useMemo(() => {
    if (!box) return { tone: 'lilac', text: 'Standalone' };
    const hasParent = !!box.parentBox;
    if (hasParent) return { tone: 'teal', text: 'In tree' };
    if (children.length > 0) return { tone: 'amber', text: 'Root of tree' };
    return { tone: 'lilac', text: 'Standalone' };
  }, [box, children.length]);

  // Prefer backend stats if provided, otherwise compute from subtree
  const safeStats = useMemo(
    () =>
      box
        ? stats ?? computeStatsFromTree(box)
        : { boxes: 0, uniqueItems: 0, totalItems: 0 },
    [stats, box]
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
  const ancestorCrumbs = crumbs.slice(0, -1);
  const descendantCount = useMemo(() => {
    if (!box) return 0;
    let count = 0;
    walk(box, () => {
      count += 1;
    });
    return Math.max(0, count - 1);
  }, [box]);

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
          <S.ScopeBadge $tone={scope.tone}>{scope.text}</S.ScopeBadge>
          {!!depth && <S.DepthHint>level {depth}</S.DepthHint>}
        </S.IdentityHeader>

        {ancestorCrumbs.length > 0 && (
          <S.PathContext>
            <S.PathLabel>Ancestors</S.PathLabel>
            <S.Crumbs aria-label="Ancestor path">
              {ancestorCrumbs.map((c, idx) => {
                const isLastAncestor = idx === ancestorCrumbs.length - 1;
                const id = c.id;
                const label = c.label;
                return (
                  <React.Fragment key={`${id}:${idx}`}>
                    <S.Crumb
                      href={id ? `/boxes/${id}` : undefined}
                      onClick={(e) => {
                        if (!id) return;
                        e.preventDefault();
                        onNavigateBox?.(id);
                      }}
                      title={`${label}${id ? ` (${id})` : ''}`}
                    >
                      <S.BoxIdMono>{pad3(id)}</S.BoxIdMono>
                      <S.CrumbLabel>{label}</S.CrumbLabel>
                    </S.Crumb>
                    {!isLastAncestor && <S.CrumbSep>›</S.CrumbSep>}
                  </React.Fragment>
                );
              })}
            </S.Crumbs>
          </S.PathContext>
        )}

        <S.CurrentBox
          aria-current="page"
          aria-label={`Current box ${currentCrumb?.label ?? title}`}
          title={`${title}${shortId ? ` (${shortId})` : ''}`}
        >
          <S.CurrentBoxId>{pad3(currentCrumb?.id)}</S.CurrentBoxId>
          <S.CurrentBoxMain>
            <S.CurrentBoxTitle>{currentCrumb?.label ?? title}</S.CurrentBoxTitle>
            <S.CurrentBoxInfoRow>
              {group ? (
                <S.CurrentBoxLocationChip $variant="group">
                  <S.CurrentBoxLocationLabel $variant="group">
                    Group
                  </S.CurrentBoxLocationLabel>
                  <S.CurrentBoxLocationValue>{group}</S.CurrentBoxLocationValue>
                </S.CurrentBoxLocationChip>
              ) : null}
              <S.CurrentBoxLocationChip $variant="location" $empty={!location}>
                <S.CurrentBoxLocationLabel $variant="location" $empty={!location}>
                  Location
                </S.CurrentBoxLocationLabel>
                <S.CurrentBoxLocationValue>{location || 'Unassigned'}</S.CurrentBoxLocationValue>
              </S.CurrentBoxLocationChip>
            </S.CurrentBoxInfoRow>
            {tags.length ? (
              <S.CurrentBoxTagsSection>
                <S.CurrentBoxTagsLabel>Tags</S.CurrentBoxTagsLabel>
                <S.CurrentBoxTagsRow>
                  {tags.map((tag, index) => (
                    <S.CurrentBoxTag key={`${shortId || 'box'}-tag-${index}-${tag}`}>
                      {tag}
                    </S.CurrentBoxTag>
                  ))}
                </S.CurrentBoxTagsRow>
              </S.CurrentBoxTagsSection>
            ) : null}
          </S.CurrentBoxMain>
        </S.CurrentBox>

        {boxImageUrl ? (
          <S.BoxImageWrap>
            <S.BoxImage src={boxImageUrl} alt={`${title} image`} />
          </S.BoxImageWrap>
        ) : null}
      </S.IdentityZone>

      <S.NotesZone>
        <S.Label>Notes</S.Label>
        {notes ? <S.NotesBody>{notes}</S.NotesBody> : <S.NotesEmpty>No notes</S.NotesEmpty>}
      </S.NotesZone>

      <S.MetaZone>
        <S.StatGroup>
          <S.StatItem>
            <S.StatLabel>Boxes</S.StatLabel>
            <S.StatValue $tone="lilac">{safeStats.boxes}</S.StatValue>
          </S.StatItem>
          <S.StatItem>
            <S.StatLabel>Unique</S.StatLabel>
            <S.StatValue $tone="teal">{safeStats.uniqueItems}</S.StatValue>
          </S.StatItem>
          <S.StatItem>
            <S.StatLabel>Total</S.StatLabel>
            <S.StatValue $tone="amber">{safeStats.totalItems}</S.StatValue>
          </S.StatItem>
        </S.StatGroup>
      </S.MetaZone>

      <S.ChildrenZone>
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
      </S.ChildrenZone>
    </S.Panel>
  );
}
