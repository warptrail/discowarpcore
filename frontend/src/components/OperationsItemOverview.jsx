import React from 'react';
import ItemDossierCarousel from './ItemDossier/ItemDossierCarousel';
import * as S from './ItemDossier/ItemDossier.styles';

export default function OperationsItemOverview({
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
  primaryOwnerName,
  condition,
  isConsumable,
  valueLabel,
  purchasePriceLabel,
  quantity,
  statusLabel,
  acquisitionType,
  dateAcquiredLabel,
  sourceBatchLabel,
  topBoxLabel,
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
  activityActions = [],
  activityTimestamps = {},
}) {
  return (
    <S.Dossier>
      <ItemDossierCarousel
        itemName={itemName}
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
        primaryOwnerName={primaryOwnerName}
        condition={condition}
        isConsumable={isConsumable}
        valueLabel={valueLabel}
        purchasePriceLabel={purchasePriceLabel}
        quantity={quantity}
        statusLabel={statusLabel}
        acquisitionType={acquisitionType}
        dateAcquiredLabel={dateAcquiredLabel}
        sourceBatchLabel={sourceBatchLabel}
        topBoxLabel={topBoxLabel}
        maintenanceNotes={maintenanceNotes}
        description={description}
        notes={notes}
        externalLinks={externalLinks}
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
