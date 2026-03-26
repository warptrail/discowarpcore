import React from 'react';
import * as S from './BoxEditForm.styles';
import BoxLocationField from './BoxLocationField';
import BoxTagsField from './BoxTagsField';
import BoxGroupField from './BoxGroupField';

export default function BoxIdentityFields({
  compact = false,
  showIdentity = true,
  showOrganization = true,
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
  group = '',
  setGroup = () => {},
  locationId,
  setLocationId,
  locationOptions = [],
  locationsLoading = false,
  onCreateLocation,
  locationCreateBusy = false,
  locationError = '',
  groupOptions = [],
  groupsLoading = false,
  groupError = '',
  tags = [],
  setTags,
  TagInputComponent,
}) {
  if (!showIdentity && !showOrganization) {
    return null;
  }

  if (compact) {
    return (
      <S.IdentityCompactGrid>
        <S.Field $compact style={{ paddingBottom: 2 }}>
          <S.Label htmlFor="box-short-id" $compact>3-digit code</S.Label>
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
            $compact
          />
          {shortIdChecking && <S.Hint $compact>Checking availability…</S.Hint>}
          {!shortIdValid && (
            <S.Hint $error $compact>Must be exactly 3 digits (000–999).</S.Hint>
          )}
          {shortIdValid &&
            !shortIdChecking &&
            !unchanged &&
            (shortIdAvail ? (
              <S.Hint $success $compact>Code is available.</S.Hint>
            ) : (
              <S.Hint $error $compact>That code is already in use.</S.Hint>
            ))}
        </S.Field>

        <S.Field $compact>
          <S.Label htmlFor="box-label" $compact>Label</S.Label>
          <S.Input
            id="box-label"
            placeholder="e.g. Kitchen Utensils"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            $compact
          />
        </S.Field>

        <S.Field $compact>
          <BoxGroupField
            compact
            groupValue={group}
            setGroupValue={setGroup}
            groupOptions={groupOptions}
            groupsLoading={groupsLoading}
            groupError={groupError}
          />
        </S.Field>

        <S.Field $compact>
          <BoxLocationField
            compact
            locationId={locationId}
            setLocationId={setLocationId}
            locationOptions={locationOptions}
            locationsLoading={locationsLoading}
            onCreateLocation={onCreateLocation}
            createBusy={locationCreateBusy}
            errorMessage={locationError}
          />
        </S.Field>

        <BoxTagsField
          compact
          inline
          tags={tags}
          setTags={setTags}
          TagInputComponent={TagInputComponent}
        />
      </S.IdentityCompactGrid>
    );
  }

  return (
    <>
      {showIdentity ? (
        <S.Row $cols2 $compact={compact} $identity={compact}>
          <S.Field $compact={compact}>
            <S.Label htmlFor="box-short-id" $compact={compact}>3-digit code</S.Label>
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
              $compact={compact}
            />
            {shortIdChecking && <S.Hint $compact={compact}>Checking availability…</S.Hint>}
            {!shortIdValid && (
              <S.Hint $error $compact={compact}>Must be exactly 3 digits (000–999).</S.Hint>
            )}
            {shortIdValid &&
              !shortIdChecking &&
              !unchanged &&
              (shortIdAvail ? (
                <S.Hint $success $compact={compact}>Code is available.</S.Hint>
              ) : (
                <S.Hint $error $compact={compact}>That code is already in use.</S.Hint>
              ))}
          </S.Field>

          <S.Field $compact={compact}>
            <S.Label htmlFor="box-label" $compact={compact}>Label</S.Label>
            <S.Input
              id="box-label"
              placeholder="e.g. Kitchen Utensils"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              $compact={compact}
            />
          </S.Field>
        </S.Row>
      ) : null}

      {showOrganization ? (
        <S.Row $cols2 $compact={compact}>
          <S.Field $compact={compact}>
            <BoxLocationField
              compact={compact}
              locationId={locationId}
              setLocationId={setLocationId}
              locationOptions={locationOptions}
              locationsLoading={locationsLoading}
              onCreateLocation={onCreateLocation}
              createBusy={locationCreateBusy}
              errorMessage={locationError}
            />
          </S.Field>

          <S.Field $compact={compact}>
            <BoxGroupField
              compact={compact}
              groupValue={group}
              setGroupValue={setGroup}
              groupOptions={groupOptions}
              groupsLoading={groupsLoading}
              groupError={groupError}
            />
          </S.Field>
        </S.Row>
      ) : null}
    </>
  );
}
