import { lazy, Suspense, useId, useMemo, useState } from 'react';
import LocationMapLegend from './LocationMapLegend';
import LocationBranchExplorer from './LocationBranchExplorer';
import { buildLocationMermaid } from './locationHierarchy';
import * as A from './LocationAtlas.styles';
import * as S from './Location.styles';

const LocationMermaidDiagram = lazy(() => import('./LocationMermaidDiagram'));
export default function LocationHierarchyChart({ locations = [], allLocations = locations, loading, onFocusRoom, atlasRef, branchEditor, onDeleteBranch, onEditPath, disabled }) {
  const [view, setView] = useState('branches');
  const source = useMemo(() => buildLocationMermaid(locations), [locations]);
  const id = useId();
  const handleViewKeys = (event) => {
    if (branchEditor?.editing) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'branches' : event.key === 'End' ? 'diagram' : view === 'branches' ? 'diagram' : 'branches';
    setView(next);
    event.currentTarget.querySelectorAll('[role="tab"]')[next === 'branches' ? 0 : 1]?.focus();
  };
  return <A.Atlas ref={atlasRef} aria-label="House atlas">
    <A.CommandRow>
      <A.Views role="tablist" aria-label="Location map view" onKeyDown={handleViewKeys}>
        <A.ViewButton type="button" role="tab" disabled={Boolean(branchEditor?.editing)} id={`${id}-branches-tab`} aria-controls={`${id}-map`} aria-selected={view === 'branches'} tabIndex={view === 'branches' ? 0 : -1} onClick={() => setView('branches')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3v18M4 7h6m-6 10h6M10 4h10v6H10zM10 14h10v6H10z" /></svg>Branches
        </A.ViewButton>
        <A.ViewButton type="button" role="tab" disabled={Boolean(branchEditor?.editing)} id={`${id}-diagram-tab`} aria-controls={`${id}-map`} aria-selected={view === 'diagram'} tabIndex={view === 'diagram' ? 0 : -1} onClick={() => setView('diagram')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v5H9zM2 17h6v5H2zM16 17h6v5h-6zM12 7v5M5 17v-5h14v5" /></svg>Diagram
        </A.ViewButton>
      </A.Views>
      <A.Tools>
        <A.ToolButton as="a" href={`data:text/plain;charset=utf-8,${encodeURIComponent(source)}`} download="house-locations.mmd" aria-label="Download Mermaid" title="Download Mermaid">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg>
        </A.ToolButton>
      </A.Tools>
    </A.CommandRow>
    <A.LegendRow><LocationMapLegend locations={locations} /></A.LegendRow>
    <div id={`${id}-map`} role="tabpanel" aria-labelledby={`${id}-${view}-tab`}>
      {!locations.length ? <S.Empty role={loading ? 'status' : undefined}>{loading ? 'Loading your house atlas…' : 'Your map will appear when you add a location.'}</S.Empty>
        : view === 'branches' ? <LocationBranchExplorer locations={locations} allLocations={allLocations} onFocusRoom={onFocusRoom} editor={branchEditor}
          onDelete={onDeleteBranch} onEditPath={onEditPath} disabled={disabled} />
          : <Suspense fallback={<S.Empty role="status">Loading the diagram…</S.Empty>}><LocationMermaidDiagram locations={locations} source={source} /></Suspense>}
    </div>
    <A.Footnote>Room → Vicinity → Specifics → Exact Spot. Connections show containment, not distance.</A.Footnote>
  </A.Atlas>;
}
