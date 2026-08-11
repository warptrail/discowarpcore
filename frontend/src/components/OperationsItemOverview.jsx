import React from 'react';
import ItemDossierCarousel from './ItemDossier/ItemDossierCarousel';
import * as S from './ItemDossier/ItemDossier.styles';

export default function OperationsItemOverview({
  itemId,
  itemName,
  thumbnailUrl,
  canOpenImageLightbox = false,
  onOpenImageLightbox,
  categoryLabel,
  tags = [],
  boxId,
  boxLabel,
  location,
  boxGroup,
  breadcrumbTrail = [],
  keepPriorityLabel,
  keepPriority,
  primaryOwnerName,
  condition,
  isConsumable,
  valueLabel,
  valueCents,
  purchasePriceLabel,
  purchasePriceCents,
  quantity,
  statusLabel,
  acquisitionType,
  dateAcquiredLabel,
  dateAcquired,
  sourceBatchLabel,
  topBoxLabel,
  isIntendedGift,
  maintenanceIntervalDays,
  maintenanceNotes,
  description,
  notes,
  externalLinks = [],
  inDeclutterDeck = false,
  declutterPending = false,
  onDeclutter,
  onMove,
  onEdit,
  consumablePending = false,
  onConsumableToggle,
  onSaveNotes,
  onSaveDescription,
  onSaveReferences,
  onSaveField,
  activityActions = [],
  activityTimestamps = {},
}) {
  return (
    <S.Dossier>
      <ItemDossierCarousel
        itemName={itemName}
        itemId={itemId}
        thumbnailUrl={thumbnailUrl}
        canOpenImageLightbox={canOpenImageLightbox}
        onOpenImageLightbox={onOpenImageLightbox}
        categoryLabel={categoryLabel}
        tags={tags}
        boxId={boxId}
        boxLabel={boxLabel}
        location={location}
        boxGroup={boxGroup}
        breadcrumbTrail={breadcrumbTrail}
        keepPriorityLabel={keepPriorityLabel}
        keepPriority={keepPriority}
        primaryOwnerName={primaryOwnerName}
        condition={condition}
        isConsumable={isConsumable}
        valueLabel={valueLabel}
        valueCents={valueCents}
        purchasePriceLabel={purchasePriceLabel}
        purchasePriceCents={purchasePriceCents}
        quantity={quantity}
        statusLabel={statusLabel}
        acquisitionType={acquisitionType}
        dateAcquiredLabel={dateAcquiredLabel}
        dateAcquired={dateAcquired}
        sourceBatchLabel={sourceBatchLabel}
        topBoxLabel={topBoxLabel}
        isIntendedGift={isIntendedGift}
        maintenanceIntervalDays={maintenanceIntervalDays}
        maintenanceNotes={maintenanceNotes}
        description={description}
        notes={notes}
        externalLinks={externalLinks}
        onSaveNotes={onSaveNotes}
        onSaveDescription={onSaveDescription}
        onSaveReferences={onSaveReferences}
        onSaveField={onSaveField}
        inDeclutterDeck={inDeclutterDeck}
        declutterPending={declutterPending}
        onDeclutter={onDeclutter}
        onMove={onMove}
        onEdit={onEdit}
        consumablePending={consumablePending}
        onConsumableToggle={onConsumableToggle}
        activityActions={activityActions}
        activityTimestamps={activityTimestamps}
      />
    </S.Dossier>
  );
}
