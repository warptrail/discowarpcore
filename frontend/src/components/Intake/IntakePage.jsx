import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';
import { ToastContext } from '../Toast';
import IntakeCurrentBoxPanel from './IntakeCurrentBoxPanel';
import IntakeCurrentBoxItemsPanel from './IntakeCurrentBoxItemsPanel';
import IntakeRapidActions from './IntakeRapidActions';
import IntakeRecentActivity from './IntakeRecentActivity';
import IntakeQuickItemMaker from './IntakeQuickItemMaker';
import BoxCreate from '../BoxCreate';

const CURRENT_BOX_STORAGE_KEY = 'intake.currentBoxId';

const Wrap = styled.div`
  display: grid;
  gap: 0.72rem;
`;

const Intro = styled.section`
  border: 1px solid rgba(77, 138, 180, 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(13, 22, 31, 0.93) 0%, rgba(9, 16, 24, 0.96) 100%);
  padding: 0.72rem 0.8rem;
`;

const IntroTitle = styled.h1`
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2effc;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.98rem;
  }
`;

const IntroText = styled.p`
  margin: 0.34rem 0 0;
  color: #a8c0d8;
  font-size: 0.84rem;
  line-height: 1.45;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Section = styled.section`
  display: grid;
  gap: 0.46rem;
`;

const SectionHeading = styled.h2`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #b7d2e8;
  padding-left: 0.12rem;
`;

const StateText = styled.div`
  border-radius: 10px;
  border: 1px solid ${({ $error }) => ($error ? 'rgba(208, 128, 128, 0.52)' : 'rgba(109, 156, 201, 0.44)')};
  background: ${({ $error }) => ($error ? 'rgba(60, 24, 24, 0.84)' : 'rgba(13, 23, 34, 0.84)')};
  color: ${({ $error }) => ($error ? '#f2c6c6' : '#b5c8dc')};
  padding: 0.5rem 0.58rem;
  font-size: 0.78rem;
`;

function readStoredCurrentBoxId() {
  if (typeof window === 'undefined') return '';

  try {
    return String(window.localStorage.getItem(CURRENT_BOX_STORAGE_KEY) || '').trim();
  } catch {
    return '';
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

  const [selectedBoxId, setSelectedBoxId] = useState(() => readStoredCurrentBoxId());
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [moveSeedItemId, setMoveSeedItemId] = useState('');
  const [boxImageOverrides, setBoxImageOverrides] = useState({});
  const [createdBoxes, setCreatedBoxes] = useState([]);

  const [items, setItems] = useState([]);
  const [intakeActivity, setIntakeActivity] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [orphanedRefreshKey, setOrphanedRefreshKey] = useState(0);

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

  const recentItems = useMemo(() => (
    [...scopedCurrentBoxItems]
      .sort((a, b) => getItemCreatedTimestamp(b) - getItemCreatedTimestamp(a))
      .slice(0, 10)
  ), [scopedCurrentBoxItems]);

  const recentActivityItems = useMemo(() => (
    [...mergedIntakeItems]
      .sort((a, b) => getItemCreatedTimestamp(b) - getItemCreatedTimestamp(a))
      .slice(0, 10)
  ), [mergedIntakeItems]);

  const handleSelectBox = (nextBoxId) => {
    const normalized = String(nextBoxId || '').trim();
    setSelectedBoxId(normalized);
    setSelectorOpen(false);

    if (!normalized) {
      setActiveAction('');
      setMoveSeedItemId('');
      setStatusMessage('');
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
    setActiveAction('add-item');

    if (normalized?.box_id) {
      setStatusMessage(`Created box #${normalized.box_id} and set it as current intake box.`);
    } else {
      setStatusMessage('Created new box and set it as current intake box.');
    }
  }, []);

  const handleActionChange = (nextAction) => {
    const normalized = String(nextAction || '').trim();
    setActiveAction(normalized);
    if (normalized !== 'move-item') {
      setMoveSeedItemId('');
    }
  };

  const handleMoveFromRecent = (itemId) => {
    if (!itemId || !currentBox?._id) return;
    setMoveSeedItemId(String(itemId));
    setActiveAction('move-item');
  };

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
    if (payload?.refreshOrphaned) {
      setOrphanedRefreshKey((prev) => prev + 1);
    }
  }, [handleItemMutation]);

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

  const handleCurrentBoxDestroyed = useCallback(({ boxId, boxShortId } = {}) => {
    const destroyedId = String(boxId || '').trim();
    if (!destroyedId) return;

    setCreatedBoxes((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (entry) => String(entry?._id || '').trim() !== destroyedId,
      ),
    );

    setBoxImageOverrides((prev) => {
      if (!prev || !prev[destroyedId]) return prev;
      const next = { ...prev };
      delete next[destroyedId];
      return next;
    });

    setSelectedBoxId((prev) => (
      String(prev || '').trim() === destroyedId ? '' : prev
    ));
    setSelectorOpen(false);
    setActiveAction('');
    setMoveSeedItemId('');
    setStatusMessage(
      boxShortId
        ? `Destroyed box #${boxShortId}. Select another current box to continue intake.`
        : 'Destroyed current box. Select another box to continue intake.',
    );

    loadItems();
  }, [loadItems]);

  return (
    <Wrap>
      <Intro>
        <IntroTitle>Intake Workflow</IntroTitle>
        <IntroText>
          Mobile-first capture mode for quickly building inventory. Select a box once,
          then keep adding items, photos, and move corrections with minimal taps.
        </IntroText>
      </Intro>

      <Section>
        <IntakeQuickItemMaker
          onItemCreated={handleQuickOrphanCreated}
        />
      </Section>

      <Section>
        <IntakeCurrentBoxPanel
          boxes={flattenedBoxes}
          selectedBox={currentBox}
          currentBoxInsight={currentBoxInsight}
          selectedBoxId={selectedBoxId}
          selectorOpen={selectorOpen}
          onSelectBox={handleSelectBox}
          onToggleSelector={() => setSelectorOpen((prev) => !prev)}
          onCreateBox={handleCreateBox}
          onCurrentBoxPhotoUpdated={handleBoxPhotoMutation}
          onCurrentBoxUpdated={handleCurrentBoxUpdated}
          onCurrentBoxDestroyed={handleCurrentBoxDestroyed}
        />
      </Section>

      {activeAction === 'create-box' ? (
        <Section>
          <BoxCreate
            embedded
            autoNavigate={false}
            title="Create Box In Intake"
            onCreated={handleBoxCreated}
            onCancel={() => setActiveAction('')}
          />
        </Section>
      ) : null}

      <Section>
        <IntakeCurrentBoxItemsPanel
          currentBox={currentBox}
          items={currentBoxItems}
          loading={loadingItems}
          error={itemsError}
        />
      </Section>

      <Section>
        <SectionHeading>Item Actions</SectionHeading>
        <IntakeRapidActions
          currentBox={currentBox}
          boxes={flattenedBoxes}
          recentItems={recentItems}
          orphanedRefreshKey={orphanedRefreshKey}
          activeAction={activeAction}
          moveSeedItemId={moveSeedItemId}
          onChangeAction={handleActionChange}
          onItemCreated={handleItemMutation}
          onItemMoved={handleItemMutation}
        />
      </Section>

      <Section>
        <IntakeRecentActivity
          items={recentActivityItems}
          boxLookup={boxesById}
          loading={loadingItems}
          error={itemsError}
          onMoveItem={handleMoveFromRecent}
        />
      </Section>

      {statusMessage ? <StateText>{statusMessage}</StateText> : null}
      {itemsError ? <StateText $error>{itemsError}</StateText> : null}
    </Wrap>
  );
}
