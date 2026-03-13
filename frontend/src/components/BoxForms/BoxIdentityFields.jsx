import React from 'react';
import * as S from './BoxEditForm.styles';

export default function BoxIdentityFields({
  shortId,
  setShortId,
  shortIdChecking,
  inProgress,
  isValid,
  isInvalid,
  shortIdValid,
  unchanged,
  shortIdAvail,
  label,
  setLabel,
  locationId,
  setLocationId,
  locationOptions = [],
  locationsLoading = false,
}) {
  return (
    <>
      <S.Row $cols2>
        <S.Field>
          <S.Label htmlFor="box-short-id">3-digit code</S.Label>
          <S.ShortIdInput
            id="box-short-id"
            inputMode="numeric"
            pattern="\d{3}"
            maxLength={3}
            placeholder="123"
            value={shortId}
            onChange={(e) =>
              setShortId(e.target.value.replace(/\D+/g, '').slice(0, 3))
            }
            $status={
              shortIdChecking
                ? 'inProgress'
                : inProgress
                  ? 'inProgress'
                  : isValid
                    ? 'valid'
                    : isInvalid
                      ? 'invalid'
                      : 'default'
            }
          />
          {shortIdChecking && <S.Hint>Checking availability…</S.Hint>}
          {!shortIdValid && (
            <S.Hint $error>Must be exactly 3 digits (000–999).</S.Hint>
          )}
          {shortIdValid &&
            !shortIdChecking &&
            !unchanged &&
            (shortIdAvail ? (
              <S.Hint $success>Code is available.</S.Hint>
            ) : (
              <S.Hint $error>That code is already in use.</S.Hint>
            ))}
        </S.Field>

        <S.Field>
          <S.Label htmlFor="box-label">Label</S.Label>
          <S.Input
            id="box-label"
            placeholder="e.g. Kitchen Utensils"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </S.Field>
      </S.Row>

      <S.Row>
        <S.Field>
          <S.Label htmlFor="box-location-id">Location</S.Label>
          <S.Select
            id="box-location-id"
            value={locationId || ''}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={locationsLoading}
          >
            <option value="">None / Unassigned</option>
            {(locationOptions || []).map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </S.Select>
          {locationsLoading && <S.Hint>Loading locations…</S.Hint>}
        </S.Field>
      </S.Row>
    </>
  );
}
