import { useContext, useState } from 'react';
import { ToastContext } from '../Toast';
import { LOCATION_MAP_TIERS, locationLabel } from './locationHierarchy';
import { branchControlId, branchLocations, branchRenamePlan, branchScope, childLocation, saveBranchRename } from './locationBranchEditing';

export default function useLocationBranchEditor(registry, onSaved, cancelDelete) {
  const { showToast } = useContext(ToastContext);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const restore = path => requestAnimationFrame(() => document.getElementById(branchControlId(path))?.focus({ preventScroll: true }));
  const begin = (node, mode, visibleLocations) => {
    if (busy || editing) return;
    cancelDelete();
    const tier = mode === 'add' ? LOCATION_MAP_TIERS[node.path.length] : LOCATION_MAP_TIERS.find(tier => tier.key === node.tier);
    setEditing({ node, mode, tier, value: mode === 'rename' ? node.label : '',
      ids: branchLocations(registry.locations, node).map(location => location._id), visibleLocations, error: '' });
  };
  const cancel = () => {
    if (busy) return;
    const path = editing.node.path;
    setEditing(null); restore(path);
  };
  const change = value => setEditing(current => ({ ...current, value, error: '' }));
  const submit = async event => {
    event.preventDefault();
    if (busy || !editing) return;
    setBusy(true); setEditing(current => ({ ...current, error: '' }));
    const { node, mode, value, ids } = editing;
    showToast({ id: 'location-saving', title: 'Saving location…', message: node.path.join(' · '), loading: true, dismissible: false, sticky: true });
    try {
      let scope;
      if (mode === 'add') scope = await registry.createLocationInline(childLocation(node, value));
      else {
        const plan = branchRenamePlan(registry.locations, node, value, ids);
        await saveBranchRename(registry, plan);
        scope = { ...branchScope(node), [node.tier]: String(value).trim().replace(/\s+/g, ' ') };
      }
      showToast({ id: 'location-saved', title: mode === 'add' ? 'Location ready' : 'Branch saved', message: `${locationLabel(scope)}${mode === 'rename' && ids.length > 1 ? ` · ${ids.length} paths` : ''}`,
        variant: 'success', sticky: true });
      onSaved(node, scope, mode); setEditing(null);
      restore(LOCATION_MAP_TIERS.map(tier => scope[tier.key]).filter(Boolean));
    } catch (failure) {
      const error = failure.message || 'Could not save location.';
      setEditing(current => ({ ...current, error }));
      showToast({ id: 'location-save-error', title: failure.savedCount ? 'Branch partly saved' : 'Location was not saved', message: error, variant: 'danger', sticky: true });
    } finally { setBusy(false); }
  };
  return { editing, busy, begin, cancel, change, submit };
}
