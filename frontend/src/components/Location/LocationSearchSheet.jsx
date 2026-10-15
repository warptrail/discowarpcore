import { useMemo } from 'react';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';
import SearchHighlight from '../SearchHighlight';
import { getSearchTerms } from '../../util/searchHighlight';
import LocationMapScope from './LocationMapScope';
import { locationLabel } from './locationHierarchy';
import { findLocationPaths } from './locationSearch';
import * as S from './Location.styles';
import * as C from './LocationConsole.styles';

export default function LocationSearchSheet({ locations, query, onQuery, mode, scope, options, pathCount,
  loading, error, busy, onChangeScope, onReset, onRefresh, onChoose, onEdit, onDone, onClose }) {
  const matches = useMemo(() => findLocationPaths(locations, query), [locations, query]);
  const terms = useMemo(() => getSearchTerms(query), [query]);
  return <ObsidianPrismSheet compact keepHeaderVisible layer={1} title="Find a location"
    context={scope.room ? `House › ${locationLabel(scope)}` : 'Search all saved paths or browse the four levels'}
    closeLabel="Close location search" initialFocusSelector={mode === 'scope' ? '#location-room-filter' : '#location-path-search'}
    returnFocusSelector="#location-console-mount button[aria-label='Search locations']" onClose={onClose}
    footer={<S.SheetActions><S.Button type="button" onClick={onDone}>Show map</S.Button></S.SheetActions>}>
    <S.SheetContent>
      <C.SearchField>
        <S.Search id="location-path-search" type="search" aria-label="Search saved locations" placeholder="Search room, vicinity, specifics or exact spot…"
          value={query} onChange={event => onQuery(event.target.value)} />
        <C.Button type="button" aria-label="Clear location search" title="Clear search" disabled={!query} onClick={() => onQuery('')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
        </C.Button>
      </C.SearchField>
      <C.ScopeDisclosure open={mode === 'scope' || undefined}>
        <summary>Browse map levels</summary>
        <LocationMapScope scope={scope} options={options} pathCount={pathCount} loading={loading} busy={busy}
          onChange={onChangeScope} onReset={onReset} onRefresh={onRefresh} />
      </C.ScopeDisclosure>
      {error ? <S.Message $error role="alert">{error} Use Refresh under Browse map levels to try again.</S.Message> : null}
      <C.ResultsHeading><h3>Saved paths</h3><span role="status">{loading ? 'Refreshing…' : `${matches.length} / ${locations.length}`}</span></C.ResultsHeading>
      <S.Text>Select a path to focus the map. Use its pencil to edit.</S.Text>
      {!matches.length ? <S.Empty role="status">{loading ? 'Loading saved locations…' : query ? 'No saved paths match this search.' : 'Add a location to begin your map.'}</S.Empty>
        : <S.List>{matches.map(location => {
          const label = locationLabel(location);
          return <S.Row key={location._id}>
            <S.EditPath type="button" disabled={busy} aria-label={`Show ${label} on map`} onClick={() => onChoose(location)}>
              <strong><SearchHighlight text={label} terms={terms} /></strong><small>Show in map ↗</small>
            </S.EditPath>
            <C.Button type="button" disabled={busy} aria-label={`Edit ${label}`} title={`Edit ${label}`} aria-haspopup="dialog" onClick={() => onEdit(location)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z" /></svg>
            </C.Button>
          </S.Row>;
        })}</S.List>}
    </S.SheetContent>
  </ObsidianPrismSheet>;
}
