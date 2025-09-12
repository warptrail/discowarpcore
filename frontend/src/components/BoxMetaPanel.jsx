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

// ----------------------------------------------------------------------------

export default function BoxMetaPanel({
  box,
  parentPath = [],
  onNavigateBox,
  stats,
}) {
  if (!box) return null;

  const shortId = String(box.box_id ?? box.shortId ?? '');
  const title = box.label ?? box.name ?? 'Box';
  const children = kidsOf(box);

  // Badge logic (uses only data we have on this node)
  const scope = useMemo(() => {
    const hasParent = !!box.parentBox;
    if (hasParent) return { tone: 'teal', text: 'In tree' };
    if (children.length > 0) return { tone: 'amber', text: 'Root of tree' };
    return { tone: 'lilac', text: 'Standalone' };
  }, [box.parentBox, children.length]);

  // Prefer backend stats if provided, otherwise compute from subtree
  const safeStats = useMemo(
    () => stats ?? computeStatsFromTree(box),
    [stats, box]
  );

  // Breadcrumb: ancestors (parentPath) + current
  // Build crumbs (root → … → parent → current)
  const crumbs = useMemo(() => {
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

  // Child box click
  const goBox = (id) => {
    if (!id) return;
    onNavigateBox?.(String(id));
  };

  return (
    <S.Panel>
      {/* Row 1: Scope badge + breadcrumb chips */}
      <S.TopRow>
        <S.Crumbs aria-label="Breadcrumb">
          {/* Scope badge: Standalone / Root of tree / In tree */}
          <S.ScopeBadge
            $tone={
              box.parentBox
                ? 'teal'
                : Array.isArray(box.childBoxes) && box.childBoxes.length
                ? 'amber'
                : 'lilac'
            }
          >
            {box.parentBox
              ? 'In tree'
              : Array.isArray(box.childBoxes) && box.childBoxes.length
              ? 'Root of tree'
              : 'Standalone'}
          </S.ScopeBadge>

          {/* Depth hint — optional, omit if you don’t want it */}
          {!!depth && <S.CrumbSep>level {depth}</S.CrumbSep>}

          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            const id = c.id;
            const label = c.label;
            const chip = (
              <S.Crumb
                key={`${id}:${idx}`}
                href={id ? `/boxes/${id}` : undefined}
                onClick={(e) => {
                  if (!id || isLast) return;
                  e.preventDefault();
                  onNavigateBox?.(id);
                }}
                aria-current={isLast ? 'page' : undefined}
                title={`${label}${id ? ` (${id})` : ''}`}
              >
                <S.BoxIdMono>{pad3(id)}</S.BoxIdMono>
                <span>{label}</span>
              </S.Crumb>
            );

            return isLast ? (
              <React.Fragment key={`${id}:${idx}`}>{chip}</React.Fragment>
            ) : (
              <React.Fragment key={`${id}:${idx}`}>
                {chip}
                <S.CrumbSep>›</S.CrumbSep>
              </React.Fragment>
            );
          })}
        </S.Crumbs>
      </S.TopRow>

      {/* Row 2: Stats row (own soft panel for breathing room) */}
      <S.StatsRow>
        <S.StatGroup>
          <S.StatPill $tone="lilac">{safeStats.boxes} boxes</S.StatPill>
          <S.StatPill $tone="teal">{safeStats.uniqueItems} unique</S.StatPill>
          <S.StatPill $tone="amber">{safeStats.totalItems} total</S.StatPill>
        </S.StatGroup>
      </S.StatsRow>

      <S.Divider />

      {/* Row 3: Children (links) */}
      <S.ChildrenBlock>
        <S.Label>Children</S.Label>
        <S.ChildrenRow>
          {children.length === 0 ? (
            <S.Muted>None</S.Muted>
          ) : (
            children.map((c) => {
              const kidId = String(c?.box_id ?? c?.shortId ?? '');
              const kidLabel = c?.label ?? c?.name ?? 'Box';
              const key = String(c?._id ?? kidId);
              return (
                <S.BoxLink
                  key={key}
                  href={kidId ? `/boxes/${kidId}` : undefined}
                  onClick={(e) => {
                    if (!kidId) return;
                    e.preventDefault();
                    goBox(kidId);
                  }}
                  title={`${kidLabel}${kidId ? ` (${kidId})` : ''}`}
                >
                  <S.BoxIdMono>{pad3(kidId)}</S.BoxIdMono>
                  <span>{kidLabel}</span>
                </S.BoxLink>
              );
            })
          )}
        </S.ChildrenRow>
      </S.ChildrenBlock>
    </S.Panel>
  );
}
