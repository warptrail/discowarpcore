import { useState } from 'react';
import useLocationRegistry from '../../hooks/useLocationRegistry';
import LocationConsolePortal from './LocationConsolePortal';
import LocationEditorSheet from './LocationEditorSheet';
import LocationSearchSheet from './LocationSearchSheet';
import LocationList from './LocationList';
import LocationHierarchyChart from './LocationHierarchyChart';
import useLocationMapScope from './useLocationMapScope';
import useLocationActions from './useLocationActions';
import useLocationBranchEditor from './useLocationBranchEditor';
import { scopeAfterBranchChange } from './locationBranchEditing';
import * as S from './Location.styles';

export default function LocationPage() {
  const registry = useLocationRegistry({ refreshOnMount: true });
  const map = useLocationMapScope(registry.locations);
  const editor = useLocationActions(registry, map.choose);
  const branchEditor = useLocationBranchEditor(registry, (node, scope, mode) => map.choose(scopeAfterBranchChange(map.scope, node, scope, mode), false), editor.cancelDelete);
  const busy = editor.busy || branchEditor.busy || Boolean(branchEditor.editing);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('search');
  const [query, setQuery] = useState('');
  const openSearch = mode => {
    editor.cancelDelete(); setSearchMode(mode); setSearchOpen(true);
  };
  const choose = location => { setSearchOpen(false); map.choose(location); };
  const editFromSearch = location => { setSearchOpen(false); editor.edit(location); };
  return <S.Page>
    <LocationConsolePortal scope={map.scope} shown={map.locations.length} total={registry.locations.length} loading={registry.loading}
      busy={busy} modalOpen={searchOpen || editor.editorOpen} searchOpen={searchOpen}
      toast={editor.toast} onToastClose={editor.dismissToast} onSearch={() => openSearch('search')} onBrowse={() => openSearch('scope')}
      onAdd={editor.add} onReset={() => map.reset()} onParent={(level, value) => map.change(level, value, true)} />
    <S.Hero><div><S.Eyebrow>LOCATION / REGISTRY</S.Eyebrow><h1>House atlas</h1></div></S.Hero>
    <S.DesktopLayout>
      <LocationHierarchyChart locations={map.locations} allLocations={registry.locations} loading={registry.loading} atlasRef={map.atlasRef}
        onFocusRoom={room => map.choose({ room })} branchEditor={branchEditor} onDeleteBranch={editor.requestDelete} onEditPath={editor.edit}
        disabled={editor.busy || editor.editorOpen || searchOpen} />
      <S.Layout><LocationList locations={map.locations} editingId={editor.editingId} busy={busy}
        onEdit={editor.edit} onDelete={editor.requestDelete} /></S.Layout>
    </S.DesktopLayout>
    {searchOpen ? <LocationSearchSheet locations={registry.locations} query={query} onQuery={setQuery} mode={searchMode}
      scope={map.scope} options={map.options} pathCount={map.locations.length} loading={registry.loading} error={registry.error} busy={editor.busy}
      onChangeScope={map.change} onReset={() => map.reset(false)} onRefresh={() => registry.refreshLocations().catch(() => {})}
      onChoose={choose} onEdit={editFromSearch} onDone={() => { setSearchOpen(false); map.focusMap(); }} onClose={() => setSearchOpen(false)} /> : null}
    {editor.editorOpen ? <LocationEditorSheet locations={registry.locations} draft={editor.draft} editingId={editor.editingId}
      busy={editor.busy} message={editor.message} onChange={editor.changeDraft} onSave={editor.save} onClear={editor.clear} onClose={editor.close} /> : null}
  </S.Page>;
}
