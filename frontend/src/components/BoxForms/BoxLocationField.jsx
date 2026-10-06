import React, { useEffect, useMemo, useState, useId } from 'react';
import { EMPTY_LOCATION, locationSuggestions, updateLocationDraft } from '../../util/locationStructure';
import * as S from './BoxEditForm.styles';

const emptyLocation = EMPTY_LOCATION;

const toLocationStructure = (location) => ({
  room: String(location?.room || '').trim(),
  vicinity: String(location?.vicinity || '').trim(),
  specifics: String(location?.specifics || '').trim(),
  exactSpot: String(location?.exactSpot || '').trim(),
});

export default function BoxLocationField({
  compact = false,
  locationId,
  setLocationId,
  locationOptions = [],
  locationsLoading = false,
  onCreateLocation,
  createBusy = false,
  errorMessage = '',
  autoAssign = false,
  hideAssignAction = false,
  onLocationDraftChange,
  showHierarchyHint = true,
}) {
  const suggestionsId = useId();
  const [draft, setDraft] = useState(emptyLocation);
  const selectedLocation = useMemo(
    () => (Array.isArray(locationOptions) ? locationOptions : []).find(
      (location) => String(location?._id || '') === String(locationId || ''),
    ) || null,
    [locationId, locationOptions],
  );

  useEffect(() => {
    if (selectedLocation) setDraft(toLocationStructure(selectedLocation));
  }, [selectedLocation]);

  useEffect(() => {
    onLocationDraftChange?.(draft);
  }, [draft, onLocationDraftChange]);

  const updateDraft = (key, value) => {
    setDraft((current) => updateLocationDraft(current, key, value));
  };

  const handleAssignStructure = async () => {
    if (typeof onCreateLocation !== 'function') return;
    const created = await onCreateLocation(draft);
    if (created?._id) {
      setLocationId(String(created._id));
      setDraft(toLocationStructure(created));
    }
  };

  const handleStructureBlur = (event) => {
    if (!autoAssign || event.currentTarget.contains(event.relatedTarget)) return;
    const room = String(draft.room || '').trim();
    const vicinity = String(draft.vicinity || '').trim();
    const specifics = String(draft.specifics || '').trim();
    const exactSpot = String(draft.exactSpot || '').trim();
    const matchesAssignedLocation = selectedLocation &&
      room === String(selectedLocation.room || '').trim() &&
      vicinity === String(selectedLocation.vicinity || '').trim() &&
      specifics === String(selectedLocation.specifics || '').trim() &&
      exactSpot === String(selectedLocation.exactSpot || '').trim();

    if (!room || (specifics && !vicinity) || (exactSpot && !specifics) || matchesAssignedLocation || createBusy) return;
    void handleAssignStructure().catch(() => {});
  };

  return (
    <>
      <S.LocationSubform>
        <S.LocationSubformHeader>
          <S.LocationSubformTitle>Location</S.LocationSubformTitle>
          {locationId ? (
            <S.LocationClear
              type="button"
              onClick={() => {
                setLocationId('');
                setDraft(emptyLocation);
              }}
              disabled={createBusy}
              aria-label="Clear assigned location"
              title="Clear assigned location"
            >
              ×
            </S.LocationClear>
          ) : null}
        </S.LocationSubformHeader>
        <S.LocationStructureGrid onBlur={handleStructureBlur}>
          <S.LocationLevelField>
            Room
            <S.LocationInput
              value={draft.room}
              onChange={(event) => updateDraft('room', event.target.value)}
              placeholder="Garage"
              disabled={createBusy || locationsLoading}
              $compact={compact}
            />
          </S.LocationLevelField>
          <S.LocationLevelField>
            Vicinity
            <S.LocationInput
              value={draft.vicinity}
              onChange={(event) => updateDraft('vicinity', event.target.value)}
              placeholder="North Shelf"
              disabled={createBusy || !String(draft.room || '').trim()}
              $compact={compact}
            />
          </S.LocationLevelField>
          <S.LocationLevelField>
            Specifics
            <S.LocationInput
              value={draft.specifics}
              onChange={(event) => updateDraft('specifics', event.target.value)}
              placeholder="Rack B3"
              disabled={createBusy || !String(draft.vicinity || '').trim()}
              $compact={compact}
            />
          </S.LocationLevelField>
          <S.LocationLevelField>
            Exact Spot
            <S.LocationInput
              value={draft.exactSpot}
              onChange={(event) => updateDraft('exactSpot', event.target.value)}
              placeholder="Behind the blue bin"
              list={suggestionsId}
              disabled={createBusy || !String(draft.specifics || '').trim()}
              $compact={compact}
            />
            <datalist id={suggestionsId}>
              {locationSuggestions(locationOptions, draft, 'exactSpot').map((value) => <option key={value} value={value} />)}
            </datalist>
          </S.LocationLevelField>
        </S.LocationStructureGrid>
        {showHierarchyHint ? <S.Hint $compact={compact}>Room → vicinity → specifics → exact spot.</S.Hint> : null}
      </S.LocationSubform>
      {!autoAssign && !hideAssignAction ? (
        <S.LocationActionRow>
          <S.LocationAction
            type="button"
            onClick={handleAssignStructure}
            disabled={createBusy || !String(draft.room || '').trim() || Boolean(draft.specifics && !draft.vicinity) || Boolean(draft.exactSpot && !draft.specifics)}
          >
            {createBusy ? 'Saving location…' : 'Assign location'}
          </S.LocationAction>
        </S.LocationActionRow>
      ) : null}
      {errorMessage ? <S.Hint $error $compact={compact}>{errorMessage}</S.Hint> : null}
    </>
  );
}
