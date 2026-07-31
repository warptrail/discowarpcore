import React from 'react';
import ItemActivityDisclosure from './ItemDossier/ItemActivityDisclosure';
import ItemDecisionActions from './ItemDossier/ItemDecisionActions';
import ItemDossierHero from './ItemDossier/ItemDossierHero';
import ItemFinderFacts from './ItemDossier/ItemFinderFacts';
import ItemMoreDetails from './ItemDossier/ItemMoreDetails';
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
  description,
  notes,
  externalLinks = [],
  inDeclutterDeck = false,
  declutterPending = false,
  onDeclutter,
  onMove,
  onEdit,
  activityActions = [],
  activityTimestamps = {},
}) {
  return (
    <S.Dossier>
      <S.DossierTop $hasImage={Boolean(thumbnailUrl)}>
        <ItemDossierHero
          itemName={itemName}
          thumbnailUrl={thumbnailUrl}
          canOpenImageLightbox={canOpenImageLightbox}
          onOpenImageLightbox={onOpenImageLightbox}
        />

        <S.ContextColumn>
          <ItemFinderFacts
            location={location}
            boxId={boxId}
            boxLabel={boxLabel}
            description={description}
            categoryLabel={categoryLabel}
            tags={tags}
          />

          <ItemDecisionActions
            inDeclutterDeck={inDeclutterDeck}
            declutterPending={declutterPending}
            onDeclutter={onDeclutter}
            onMove={onMove}
            onEdit={onEdit}
          />
        </S.ContextColumn>
      </S.DossierTop>

      <ItemMoreDetails
        notes={notes}
        boxGroup={boxGroup}
        breadcrumb={breadcrumbTrail}
        keepPriority={keepPriorityLabel}
        primaryOwner={primaryOwnerName}
        condition={condition}
        consumableLabel={isConsumable ? 'Yes' : 'No'}
        valueLabel={valueLabel}
        purchasePriceLabel={purchasePriceLabel}
        externalLinks={externalLinks}
      />

      <ItemActivityDisclosure
        actions={activityActions}
        timestamps={activityTimestamps}
      />
    </S.Dossier>
  );
}
