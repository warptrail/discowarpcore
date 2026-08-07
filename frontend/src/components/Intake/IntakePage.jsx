import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { ToastContext } from '../Toast';
import IntakeCurrentBoxPanel from './IntakeCurrentBoxPanel';
import IntakeBoxEditorPanel from './IntakeBoxEditorPanel';
import IntakeCurrentBoxItemsPanel from './IntakeCurrentBoxItemsPanel';
import IntakeRapidActions from './IntakeRapidActions';
import IntakeRecentActivity from './IntakeRecentActivity';
import IntakeQuickItemMaker from './IntakeQuickItemMaker';
import IntakeWorkspaceTabs from './IntakeWorkspaceTabs';
import BoxCreate from '../BoxCreate';

const CURRENT_BOX_STORAGE_KEY = 'intake.currentBoxId';
const BATCH_FILTER_STORAGE_KEY = 'intake.selectedBatchIds';
const ORPHAN_FILTER_STORAGE_KEY = 'intake.onlyOrphanedItems';
const ORGANIZE_CONSOLE_TOAST_ID = 'intake-organize-console';

const Wrap = styled.div`
  display: grid;
  gap: 0.8rem;
  min-width: 0;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0.35rem 0 2rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    input,
    textarea,
    select {
      font-size: 16px !important;
    }
  }
`;

const Workspace = styled.main`
  display: grid;
  gap: 0.58rem;
  min-width: 0;
  width: 100%;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: -0.4rem -0.5rem -0.9rem;
    pointer-events: none;
    background:
      radial-gradient(
        circle at 14% 0%,
        rgba(var(--box-primary-rgb), 0.1),
        transparent 38%
      ),
      radial-gradient(
        circle at 88% 12%,
        rgba(var(--box-secondary-rgb), 0.055),
        transparent 34%
      );
    opacity: 0.82;
    transition: background 220ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      transition: none;
    }
  }
`;

const WorkspacePanel = styled.section`
  display: grid;
  gap: 0.58rem;
  min-width: 0;
  width: 100%;
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#ffc5c5' : '#a6d7d0')};
  font-size: 0.8rem;
  line-height: 1.4;
`;

function readStoredCurrentBoxId() {
  if (typeof window === 'undefined') return '';

  try {
    return String(window.localStorage.getItem(CURRENT_BOX_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function readStoredBatchIds() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(BATCH_FILTER_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value || '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function readStoredBoolean(key, fallback = false) {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (value == null) return fallback;
    return value === 'true';
  } catch {
    return fallback;
  }
}

function persistCurrentBoxId(value) {
  if (typeof window === 'undefined') return;

  try {
    if (value) {
      window.localStorage.setItem(CURRENT_BOX_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(CURRENT_BOX_STORAGE_KEY);
  } catch {
    // localStorage unavailable in some private browsing modes.
  }
}

function persistBatchIds(values) {
  if (typeof window === 'undefined') return;

  try {
    const normalized = Array.from(
      new Set(
        (Array.isArray(values) ? values : [])
          .map((value) => String(value || '').trim())
          .filter(Boolean),
      ),
    );

    if (normalized.length > 0) {
      window.localStorage.setItem(BATCH_FILTER_STORAGE_KEY, JSON.stringify(normalized));
      return;
    }

    window.localStorage.removeItem(BATCH_FILTER_STORAGE_KEY);
  } catch {
    // localStorage unavailable in some private browsing modes.
  }
}

function persistBoolean(key, value) {
  if (typeof window === 'undefined') return;

  try {
    if (value) {
      window.localStorage.setItem(key, 'true');
      return;
    }

    window.localStorage.removeItem(key);
  } catch {
    // localStorage unavailable in some private browsing modes.
  }
}

function flattenBoxNodes(nodes, acc = []) {
  const list = Array.isArray(nodes) ? nodes : [];

  for (const node of list) {
    if (!node || typeof node !== 'object') continue;
    acc.push(node);

    if (Array.isArray(node.childBoxes) && node.childBoxes.length > 0) {
      flattenBoxNodes(node.childBoxes, acc);
    }
  }

  return acc;
}

function sortBoxes(boxes) {
  const toNumericShortId = (raw) => {
    const parsed = Number.parseInt(String(raw || '').trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return [...boxes].sort((a, b) => {
    const aNumeric = toNumericShortId(a?.box_id);
    const bNumeric = toNumericShortId(b?.box_id);

    if (aNumeric !== null && bNumeric !== null) return aNumeric - bNumeric;
    if (aNumeric !== null) return -1;
    if (bNumeric !== null) return 1;

    return String(a?.label || '').localeCompare(String(b?.label || ''));
  });
}

function getItemCreatedTimestamp(item) {
  const createdAt = Date.parse(item?.createdAt || item?.created_at || '');
  if (Number.isFinite(createdAt)) return createdAt;

  const id = String(item?._id || '');
  if (id.length >= 8) {
    const seconds = Number.parseInt(id.slice(0, 8), 16);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }

  return 0;
}

function itemBelongsToBox(item, box) {
  if (!box?._id && !box?.box_id) return true;

  const targetMongoId = String(box?._id || '');
  const targetBoxId = String(box?.box_id || '');
  const itemBoxMongoId = String(item?.box?._id || item?.boxId || '');
  const itemBoxId = String(item?.box?.box_id || '');

  if (targetMongoId && itemBoxMongoId && targetMongoId === itemBoxMongoId) {
    return true;
  }

  if (targetBoxId && itemBoxId && targetBoxId === itemBoxId) {
    return true;
  }

  const crumbs = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  return crumbs.some((crumb) => {
    const crumbMongoId = String(crumb?._id || '');
    const crumbBoxId = String(crumb?.box_id || '');
    if (targetMongoId && crumbMongoId && targetMongoId === crumbMongoId) return true;
    if (targetBoxId && crumbBoxId && targetBoxId === crumbBoxId) return true;
    return false;
  });
}

function normalizeActivityItem(item, fallbackBox = null) {
  if (!item || typeof item !== 'object') return null;

  const id = String(item?._id || '').trim();
  if (!id) return null;

  const createdAt =
    item?.createdAt ||
    item?.created_at ||
    new Date(getItemCreatedTimestamp(item) || Date.now()).toISOString();

  const hasExplicitBox = Object.prototype.hasOwnProperty.call(item, 'box');
  const box = hasExplicitBox ? item?.box : (fallbackBox || null);

  return {
    ...item,
    _id: id,
    createdAt,
    created_at: item?.created_at || createdAt,
    box: box
      ? {
          _id: box?._id || null,
          box_id: box?.box_id || null,
          label: box?.label || '',
        }
      : null,
    boxId: item?.boxId || box?._id || '',
  };
}

function getActivityBatchId(item) {
  return String(item?.sourceBatchId || item?.sourceBatch?.id || '').trim();
}

function getActivityBatchLabel(item) {
  const sourceBatch = item?.sourceBatch && typeof item.sourceBatch === 'object'
    ? item.sourceBatch
    : null;
  return (
    String(sourceBatch?.label || '').trim() ||
    String(sourceBatch?.batchName || '').trim() ||
    String(sourceBatch?.batchId || '').trim() ||
    getActivityBatchId(item)
  );
}

function isActivityItemOrphaned(item) {
  if (item?.orphanedAt || item?.isOrphaned || item?.orphaned) return true;
  return !item?.box && !String(item?.boxId || '').trim();
}

function toQuantityValue(item) {
  const numeric = Number(item?.quantity);
  return Number.isFinite(numeric) ? numeric : 1;
}

function createZeroStats() {
  return {
    directUnique: 0,
    directQuantity: 0,
    descendantUnique: 0,
    descendantQuantity: 0,
    totalUnique: 0,
    totalQuantity: 0,
    directChildBoxes: 0,
    descendantBoxes: 0,
  };
}

async function parseMutationError(response, fallbackMessage) {
  const text = await response.text().catch(() => '');
  if (!text) return fallbackMessage;

  try {
    const parsed = JSON.parse(text);
    return parsed?.error || parsed?.message || fallbackMessage;
  } catch {
    return text;
  }
}

export default function IntakePage({ boxes = [] }) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const setIntakeDraftName = toastCtx?.setIntakeDraftName;
  const setIntakeContext = toastCtx?.setIntakeContext;

  const [selectedBoxId, setSelectedBoxId] = useState(() => readStoredCurrentBoxId());
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [activeWorkspaceView, setActiveWorkspaceView] = useState('new');
  const [moveSeedItemId, setMoveSeedItemId] = useState('');
  const [routeConsoleSuppressed, setRouteConsoleSuppressed] = useState(false);
  const [boxImageOverrides, setBoxImageOverrides] = useState({});
  const [createdBoxes, setCreatedBoxes] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState(() => readStoredBatchIds());
  const [onlyOrphanedItems, setOnlyOrphanedItems] = useState(() =>
    readStoredBoolean(ORPHAN_FILTER_STORAGE_KEY, false),
  );

  const [items, setItems] = useState([]);
  const [intakeActivity, setIntakeActivity] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const flattenedBoxes = useMemo(() => {
    const mergedById = new Map();

    for (const box of flattenBoxNodes(boxes)) {
      const key = String(box?._id || '').trim();
      if (!key) continue;
      mergedById.set(key, box);
    }

    for (const box of createdBoxes) {
      const key = String(box?._id || '').trim();
      if (!key) continue;
      mergedById.set(key, box);
    }

    const flat = [...mergedById.values()].map((box) => {
      const key = String(box?._id || '');
      if (!key || !boxImageOverrides[key]) return box;

      const override = boxImageOverrides[key];
      return {
        ...box,
        image: override.image,
        imagePath: override.imagePath,
      };
    });

    return sortBoxes(flat);
  }, [boxes, boxImageOverrides, createdBoxes]);

  const currentBox = useMemo(
    () =>
      flattenedBoxes.find((box) => String(box?._id || '') === String(selectedBoxId || '')) ||
      null,
    [flattenedBoxes, selectedBoxId],
  );
  const currentBoxTheme = useMemo(
    () => getBoxTheme(currentBox?.box_id || currentBox?.shortId),
    [currentBox?.box_id, currentBox?.shortId],
  );
  const workspaceTheme = useMemo(
    () =>
      activeWorkspaceView === 'edit'
        ? getBoxTheme(null, { kind: 'system' })
        : currentBoxTheme,
    [activeWorkspaceView, currentBoxTheme],
  );

  useEffect(() => {
    if (!currentBox) {
      setIntakeContext?.({ mode: activeWorkspaceView });
      return;
    }

    setIntakeContext?.({
      shortId: String(currentBox.box_id || currentBox.shortId || '').trim(),
      label: String(currentBox.label || currentBox.name || '').trim(),
      mode: activeWorkspaceView,
    });
  }, [activeWorkspaceView, currentBox, setIntakeContext]);

  useEffect(
    () => () => setIntakeContext?.(null),
    [setIntakeContext],
  );

  const boxInsightsById = useMemo(() => {
    const insightMap = new Map();
    const roots = Array.isArray(boxes) ? boxes : [];

    const visitNode = (node, ancestors = []) => {
      if (!node || typeof node !== 'object') return createZeroStats();

      const nodeId = String(node?._id || '').trim();
      const nodeLabel = String(node?.label || '').trim() || 'Unnamed Box';
      const nodeBoxId = String(node?.box_id || '').trim();
      const breadcrumbEntry = {
        id: nodeId,
        boxId: nodeBoxId,
        label: nodeLabel,
      };
      const breadcrumb = [...ancestors, breadcrumbEntry];

      const directItems = Array.isArray(node?.items) ? node.items : [];
      const directUnique = directItems.length;
      const directQuantity = directItems.reduce(
        (sum, item) => sum + toQuantityValue(item),
        0,
      );

      const childBoxes = Array.isArray(node?.childBoxes) ? node.childBoxes : [];
      const directChildBoxes = childBoxes.length;

      let descendantUnique = 0;
      let descendantQuantity = 0;
      let descendantBoxes = 0;

      childBoxes.forEach((child) => {
        const childStats = visitNode(child, breadcrumb);
        descendantUnique += childStats.totalUnique;
        descendantQuantity += childStats.totalQuantity;
        descendantBoxes += 1 + childStats.descendantBoxes;
      });

      const stats = {
        directUnique,
        directQuantity,
        descendantUnique,
        descendantQuantity,
        totalUnique: directUnique + descendantUnique,
        totalQuantity: directQuantity + descendantQuantity,
        directChildBoxes,
        descendantBoxes,
      };

      if (nodeId) {
        insightMap.set(nodeId, {
          breadcrumb,
          stats,
        });
      }

      return stats;
    };

    roots.forEach((root) => {
      visitNode(root, []);
    });

    createdBoxes.forEach((box) => {
      const boxId = String(box?._id || '').trim();
      if (!boxId || insightMap.has(boxId)) return;

      const boxLabel = String(box?.label || '').trim() || 'Unnamed Box';
      const shortId = String(box?.box_id || '').trim();
      const directItems = Array.isArray(box?.items) ? box.items : [];
      const directUnique = directItems.length;
      const directQuantity = directItems.reduce(
        (sum, item) => sum + toQuantityValue(item),
        0,
      );

      insightMap.set(boxId, {
        breadcrumb: [{ id: boxId, boxId: shortId, label: boxLabel }],
        stats: {
          ...createZeroStats(),
          directUnique,
          directQuantity,
          totalUnique: directUnique,
          totalQuantity: directQuantity,
        },
      });
    });

    return insightMap;
  }, [boxes, createdBoxes]);

  const currentBoxInsight = useMemo(() => {
    const currentBoxId = String(currentBox?._id || '').trim();
    if (!currentBoxId) return null;
    if (boxInsightsById.has(currentBoxId)) return boxInsightsById.get(currentBoxId);

    const directItems = Array.isArray(currentBox?.items) ? currentBox.items : [];
    const directUnique = directItems.length;
    const directQuantity = directItems.reduce(
      (sum, item) => sum + toQuantityValue(item),
      0,
    );

    return {
      breadcrumb: [
        {
          id: currentBoxId,
          boxId: String(currentBox?.box_id || '').trim(),
          label: String(currentBox?.label || '').trim() || 'Unnamed Box',
        },
      ],
      stats: {
        ...createZeroStats(),
        directUnique,
        directQuantity,
        totalUnique: directUnique,
        totalQuantity: directQuantity,
      },
    };
  }, [boxInsightsById, currentBox]);

  const boxesById = useMemo(() => {
    const map = new Map();
    for (const box of flattenedBoxes) {
      const mongoId = String(box?._id || '');
      if (mongoId) map.set(mongoId, box);
    }
    return map;
  }, [flattenedBoxes]);

  useEffect(() => {
    if (!selectedBoxId) return;
    if (currentBox) return;

    setSelectedBoxId('');
    persistCurrentBoxId('');
  }, [currentBox, selectedBoxId]);

  useEffect(() => {
    persistCurrentBoxId(selectedBoxId);
  }, [selectedBoxId]);

  useEffect(() => {
    persistBatchIds(selectedBatchIds);
  }, [selectedBatchIds]);

  useEffect(() => {
    persistBoolean(ORPHAN_FILTER_STORAGE_KEY, onlyOrphanedItems);
  }, [onlyOrphanedItems]);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError('');

    try {
      const response = await fetch(`${API_BASE}/api/items`);
      const body = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          body?.error ||
            body?.message ||
            `Failed to load items (${response.status})`,
        );
      }

      setItems(Array.isArray(body) ? body : []);
    } catch (fetchError) {
      setItemsError(fetchError?.message || 'Failed to load recent activity.');
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const mergedIntakeItems = useMemo(() => {
    const apiItems = (Array.isArray(items) ? items : [])
      .map((item) => normalizeActivityItem(item))
      .filter(Boolean);
    const trackedActivity = (Array.isArray(intakeActivity) ? intakeActivity : [])
      .map((item) => normalizeActivityItem(item))
      .filter(Boolean);

    const mergedById = new Map();
    for (const item of [...trackedActivity, ...apiItems]) {
      const key = String(item?._id || '');
      if (!key) continue;

      const existing = mergedById.get(key);
      if (!existing) {
        mergedById.set(key, item);
        continue;
      }

      const existingScore = getItemCreatedTimestamp(existing);
      const nextScore = getItemCreatedTimestamp(item);
      if (nextScore >= existingScore) {
        mergedById.set(key, item);
      }
    }

    return [...mergedById.values()];
  }, [intakeActivity, items]);

  const scopedCurrentBoxItems = useMemo(() => {
    if (!currentBox?._id && !currentBox?.box_id) return [];
    return mergedIntakeItems.filter((item) => itemBelongsToBox(item, currentBox));
  }, [currentBox, mergedIntakeItems]);

  const currentBoxItems = useMemo(() => (
    [...scopedCurrentBoxItems].sort((a, b) => {
      const tsDelta = getItemCreatedTimestamp(b) - getItemCreatedTimestamp(a);
      if (tsDelta !== 0) return tsDelta;
      return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
        sensitivity: 'base',
      });
    })
  ), [scopedCurrentBoxItems]);

  const batchFilterOptions = useMemo(() => {
    const optionMap = new Map();

    for (const item of mergedIntakeItems) {
      const batchId = getActivityBatchId(item);
      if (!batchId) continue;

      const existing = optionMap.get(batchId);
      if (existing) {
        optionMap.set(batchId, {
          ...existing,
          count: existing.count + 1,
          orphanedCount: existing.orphanedCount + (isActivityItemOrphaned(item) ? 1 : 0),
        });
        continue;
      }

      optionMap.set(batchId, {
        id: batchId,
        label: getActivityBatchLabel(item),
        count: 1,
        orphanedCount: isActivityItemOrphaned(item) ? 1 : 0,
      });
    }

    return [...optionMap.values()].sort((a, b) =>
      String(a.label || '').localeCompare(String(b.label || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
  }, [mergedIntakeItems]);

  useEffect(() => {
    if (selectedBatchIds.length === 0) return;

    const availableIds = new Set(batchFilterOptions.map((option) => option.id));
    const nextIds = selectedBatchIds.filter((batchId) => availableIds.has(batchId));
    if (nextIds.length === selectedBatchIds.length) return;

    setSelectedBatchIds(nextIds);
  }, [batchFilterOptions, selectedBatchIds]);

  const filteredRecentActivityItems = useMemo(() => {
    const selectedBatches = new Set(selectedBatchIds);

    return [...mergedIntakeItems]
      .filter((item) => {
        if (onlyOrphanedItems && !isActivityItemOrphaned(item)) return false;
        if (selectedBatches.size === 0) return true;
        return selectedBatches.has(getActivityBatchId(item));
      })
      .sort((a, b) => getItemCreatedTimestamp(b) - getItemCreatedTimestamp(a))
      .slice(0, 10);
  }, [mergedIntakeItems, onlyOrphanedItems, selectedBatchIds]);

  const handleToggleBatchFilter = useCallback((batchId) => {
    const normalized = String(batchId || '').trim();
    if (!normalized) return;

    setSelectedBatchIds((prev) => {
      const current = new Set(Array.isArray(prev) ? prev : []);
      if (current.has(normalized)) {
        current.delete(normalized);
      } else {
        current.add(normalized);
      }
      return [...current];
    });
  }, []);

  const handleClearActivityFilters = useCallback(() => {
    setSelectedBatchIds([]);
    setOnlyOrphanedItems(false);
  }, []);

  const selectedRoutingItem = useMemo(
    () =>
      (Array.isArray(mergedIntakeItems) ? mergedIntakeItems : []).find(
        (item) => String(item?._id || '') === String(moveSeedItemId || ''),
      ) || null,
    [mergedIntakeItems, moveSeedItemId],
  );

  const handleSelectBox = (nextBoxId) => {
    const normalized = String(nextBoxId || '').trim();
    setSelectedBoxId(normalized);
    setSelectorOpen(false);

    if (!normalized) {
      setActiveAction('');
      setMoveSeedItemId('');
      setStatusMessage('Intake now targets Items Adrift.');
      return;
    }

    const selected = flattenedBoxes.find((box) => String(box?._id) === normalized);
    if (selected?.box_id) {
      setStatusMessage(`Intake now targeting box #${selected.box_id}.`);
    } else {
      setStatusMessage('Intake box updated.');
    }
  };

  const handleCreateBox = useCallback(() => {
    setSelectorOpen(false);
    setMoveSeedItemId('');
    setActiveAction('create-box');
  }, []);

  const handleBoxCreated = useCallback((createdBox) => {
    const createdId = String(createdBox?._id || '').trim();
    if (!createdId) {
      setStatusMessage('Box created, but no id was returned.');
      return;
    }

    const normalized = {
      ...createdBox,
      _id: createdId,
      tags: Array.isArray(createdBox?.tags) ? createdBox.tags : [],
    };

    setCreatedBoxes((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return [
        normalized,
        ...list.filter((entry) => String(entry?._id || '') !== createdId),
      ];
    });

    setSelectedBoxId(createdId);
    setSelectorOpen(false);
    setActiveAction('');

    if (normalized?.box_id) {
      setStatusMessage(`Created box #${normalized.box_id} and set it as current intake box.`);
    } else {
      setStatusMessage('Created new box and set it as current intake box.');
    }
  }, []);

  const handleItemMutation = useCallback(({ message, item, itemId, destBoxId, sourceBoxId, sourceBox } = {}) => {
    if (message) {
      setStatusMessage(message);
    }

    const normalized = normalizeActivityItem(item, currentBox);
    const movedItemId = String(itemId || '').trim();
    const movedDestBoxId = String(destBoxId || '').trim();
    const movedSourceBoxId = String(sourceBoxId || '').trim();
    const destination = movedDestBoxId ? boxesById.get(movedDestBoxId) : null;

    if (normalized) {
      setItems((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const key = String(normalized?._id || '');
        if (!key) return list;

        const index = list.findIndex((entry) => String(entry?._id || '') === key);
        if (index === -1) return [normalized, ...list];

        const next = [...list];
        next[index] = {
          ...next[index],
          ...normalized,
        };
        return next;
      });
    } else if (movedItemId && movedDestBoxId && destination) {
      setItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((entry) =>
          String(entry?._id || '') !== movedItemId
            ? entry
            : {
                ...entry,
                boxId: movedDestBoxId,
                box: {
                  _id: destination._id,
                  box_id: destination.box_id,
                  label: destination.label,
                },
              },
        ),
      );
    }

    setIntakeActivity((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (normalized) {
        const deduped = [
          normalized,
          ...list.filter(
            (entry) => String(entry?._id || '') !== String(normalized._id),
          ),
        ];
        return deduped.slice(0, 30);
      }

      if (!movedItemId || !movedDestBoxId) {
        return list;
      }

      if (!destination) return list;

      return list.map((entry) => {
        if (String(entry?._id || '') !== movedItemId) return entry;
        return {
          ...entry,
          boxId: movedDestBoxId,
          box: {
            _id: destination._id,
            box_id: destination.box_id,
            label: destination.label,
          },
        };
      });
    });

    if (movedItemId && movedDestBoxId && movedSourceBoxId && movedSourceBoxId !== movedDestBoxId) {
      const destinationLabel =
        destination?.label && destination?.box_id
          ? `${destination.label} (Box #${destination.box_id})`
          : destination?.label || (destination?.box_id ? `Box #${destination.box_id}` : 'destination box');
      const sourceFromMap = boxesById.get(movedSourceBoxId);
      const sourceLabel =
        sourceFromMap?.label && sourceFromMap?.box_id
          ? `${sourceFromMap.label} (Box #${sourceFromMap.box_id})`
          : sourceFromMap?.label ||
            (sourceFromMap?.box_id ? `Box #${sourceFromMap.box_id}` : sourceBox?.label || (sourceBox?.box_id ? `Box #${sourceBox.box_id}` : 'previous box'));

      showToast?.({
        variant: 'success',
        sticky: true,
        title: 'Item moved',
        message: `Moved ${normalized?.name || item?.name || 'item'} to ${destinationLabel}.`,
        actions: [
          {
            id: `intake-undo-move-${movedItemId}-${Date.now()}`,
            label: 'Undo',
            kind: 'primary',
            onClick: async () => {
              hideToast?.();
              try {
                const response = await fetch(`${API_BASE}/api/boxed-items/moveItem`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    itemId: movedItemId,
                    sourceBoxId: movedDestBoxId,
                    destBoxId: movedSourceBoxId,
                  }),
                });

                if (!response.ok) {
                  const undoMessage = await parseMutationError(
                    response,
                    `Undo failed (${response.status})`,
                  );
                  throw new Error(undoMessage);
                }

                const undoDestination = boxesById.get(movedSourceBoxId);
                const undoItem = {
                  ...(normalized || item || {}),
                  _id: movedItemId,
                  boxId: movedSourceBoxId,
                  box: undoDestination
                    ? {
                        _id: undoDestination._id,
                        box_id: undoDestination.box_id,
                        label: undoDestination.label,
                      }
                    : sourceBox
                      ? {
                          _id: sourceBox._id || movedSourceBoxId,
                          box_id: sourceBox.box_id,
                          label: sourceBox.label || '',
                        }
                      : null,
                };

                setStatusMessage(`Undo complete. Moved ${undoItem?.name || 'item'} back to ${sourceLabel}.`);
                setItems((prev) =>
                  (Array.isArray(prev) ? prev : []).map((entry) =>
                    String(entry?._id || '') !== movedItemId
                      ? entry
                      : {
                          ...entry,
                          ...undoItem,
                        },
                  ),
                );
                setIntakeActivity((prev) =>
                  (Array.isArray(prev) ? prev : []).map((entry) =>
                    String(entry?._id || '') !== movedItemId
                      ? entry
                      : {
                          ...entry,
                          ...undoItem,
                        },
                  ),
                );
                loadItems();

                showToast?.({
                  variant: 'success',
                  title: 'Undo complete',
                  message: `Moved ${undoItem?.name || 'item'} back to ${sourceLabel}.`,
                  timeoutMs: 3200,
                });
              } catch (undoError) {
                showToast?.({
                  variant: 'danger',
                  title: 'Undo failed',
                  message: undoError?.message || 'Could not move item back.',
                  timeoutMs: 4200,
                });
              }
            },
          },
        ],
      });
    }

    loadItems();
  }, [boxesById, currentBox, hideToast, loadItems, showToast]);

  const handleQuickOrphanCreated = useCallback((payload = {}) => {
    handleItemMutation(payload);
  }, [handleItemMutation]);

  useEffect(() => {
    if (activeWorkspaceView !== 'organize' || routeConsoleSuppressed) {
      hideToast?.(ORGANIZE_CONSOLE_TOAST_ID);
      return undefined;
    }

    const hasDestination = Boolean(String(currentBox?._id || '').trim());
    const hasSelectedItem = Boolean(String(selectedRoutingItem?._id || '').trim());
    const canRoute = hasDestination && hasSelectedItem;
    const destinationTheme = getBoxTheme(currentBox?.box_id);
    const routeHint = hasDestination
      ? 'Choose an activity item below.'
      : hasSelectedItem
        ? 'Choose a current box first.'
        : 'Choose a box and activity item.';

    showToast?.({
      id: ORGANIZE_CONSOLE_TOAST_ID,
      variant: 'command',
      sticky: true,
      dismissible: false,
      presentation: 'item-field',
      themeStyle: getBoxThemeCssVars(destinationTheme),
      title: 'Route',
      message: canRoute ? null : routeHint,
      content: canRoute ? (
        <IntakeRapidActions
          currentBox={currentBox}
          selectedItem={selectedRoutingItem}
          onItemMoved={handleItemMutation}
          onComplete={() => {
            setMoveSeedItemId('');
            setRouteConsoleSuppressed(true);
          }}
        />
      ) : null,
    });

    return () => hideToast?.(ORGANIZE_CONSOLE_TOAST_ID);
  }, [
    activeWorkspaceView,
    currentBox,
    handleItemMutation,
    hideToast,
    routeConsoleSuppressed,
    selectedRoutingItem,
    showToast,
  ]);

  const handleBoxPhotoMutation = ({ boxId, image, imagePath, message } = {}) => {
    if (boxId) {
      setBoxImageOverrides((prev) => ({
        ...prev,
        [String(boxId)]: {
          image: image || null,
          imagePath: imagePath || '',
        },
      }));
    }

    if (message) {
      setStatusMessage(message);
    }
  };

  const handleCurrentBoxUpdated = useCallback((updatedBox) => {
    const updatedId = String(updatedBox?._id || '').trim();
    if (!updatedId) return;

    const normalized = {
      ...updatedBox,
      _id: updatedId,
      tags: Array.isArray(updatedBox?.tags) ? updatedBox.tags : [],
    };

    setCreatedBoxes((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return [
        normalized,
        ...list.filter((entry) => String(entry?._id || '') !== updatedId),
      ];
    });

    if (normalized?.box_id) {
      setStatusMessage(`Updated box #${normalized.box_id}.`);
    } else {
      setStatusMessage('Current box updated.');
    }
  }, []);

  return (
    <Wrap>
      <Workspace style={getBoxThemeCssVars(workspaceTheme)}>
        <IntakeWorkspaceTabs
          activeView={activeWorkspaceView}
          onChange={(nextView) => {
            setActiveWorkspaceView(nextView);
            if (nextView === 'organize') {
              setRouteConsoleSuppressed(false);
            }
          }}
        />

        {activeWorkspaceView === 'new' ? (
          <WorkspacePanel id="intake-workspace-panel-new" aria-label="New item">
            <IntakeQuickItemMaker
              mode={currentBox ? 'inBox' : 'orphan'}
              targetBox={currentBox}
              showTitle={false}
              onItemCreated={handleQuickOrphanCreated}
              onDraftNameChange={setIntakeDraftName}
              onChangeTargetBox={() => {
                setActiveWorkspaceView('box');
                setSelectorOpen(true);
              }}
            />
          </WorkspacePanel>
        ) : null}

        {activeWorkspaceView === 'box' ? (
          <WorkspacePanel id="intake-workspace-panel-box" aria-label="Current box">
            <IntakeCurrentBoxPanel
              boxes={flattenedBoxes}
              selectedBox={currentBox}
              currentBoxInsight={currentBoxInsight}
              selectedBoxId={selectedBoxId}
              selectorOpen={selectorOpen}
              onSelectBox={handleSelectBox}
              onToggleSelector={() => setSelectorOpen((prev) => !prev)}
              onCreateBox={handleCreateBox}
              onAddItem={() => setActiveWorkspaceView('new')}
              onEditBox={() => setActiveWorkspaceView('edit')}
              onCurrentBoxPhotoUpdated={handleBoxPhotoMutation}
            />
            {activeAction === 'create-box' ? (
              <BoxCreate
                embedded
                autoNavigate={false}
                title="Create box"
                onCreated={handleBoxCreated}
                onCancel={() => setActiveAction('')}
              />
            ) : null}
            {currentBox ? (
              <IntakeCurrentBoxItemsPanel
                currentBox={currentBox}
                items={currentBoxItems}
                loading={loadingItems}
                error={itemsError}
              />
            ) : null}
          </WorkspacePanel>
        ) : null}

        {activeWorkspaceView === 'edit' ? (
          <WorkspacePanel id="intake-workspace-panel-edit" aria-label="Edit box">
            <IntakeBoxEditorPanel
              box={currentBox}
              onBoxUpdated={handleCurrentBoxUpdated}
              onBoxImageUpdated={handleBoxPhotoMutation}
              onExit={() => setActiveWorkspaceView('box')}
            />
          </WorkspacePanel>
        ) : null}

        {activeWorkspaceView === 'organize' ? (
          <WorkspacePanel id="intake-workspace-panel-organize" aria-label="Organize Intake">
            <IntakeRecentActivity
              items={filteredRecentActivityItems}
              boxLookup={boxesById}
              loading={loadingItems}
              error={itemsError}
              onMoveItem={(itemId) => {
                setRouteConsoleSuppressed(false);
                setMoveSeedItemId(String(itemId || ''));
              }}
              selectedItemId={moveSeedItemId}
              batchOptions={batchFilterOptions}
              selectedBatchIds={selectedBatchIds}
              onlyOrphanedItems={onlyOrphanedItems}
              onToggleBatch={handleToggleBatchFilter}
              onToggleOnlyOrphaned={() => setOnlyOrphanedItems((prev) => !prev)}
              onClearFilters={handleClearActivityFilters}
            />
          </WorkspacePanel>
        ) : null}

        {statusMessage || itemsError ? (
          <div>
            {statusMessage ? <StateText>{statusMessage}</StateText> : null}
            {itemsError ? <StateText $error>{itemsError}</StateText> : null}
          </div>
        ) : null}
      </Workspace>
    </Wrap>
  );
}
