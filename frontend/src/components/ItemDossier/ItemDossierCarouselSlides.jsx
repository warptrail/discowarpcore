import React from 'react';

import ItemDecisionActions from './ItemDecisionActions';
import * as S from './ItemDossier.styles';

function DisplayValue({ children, fallback = 'Not set' }) {
  if (React.isValidElement(children)) return children;
  const text = String(children ?? '').trim();
  return text && text !== '—' ? children : <S.EmptyDetail>{fallback}</S.EmptyDetail>;
}

function DetailField({ label, value, wide = false }) {
  return (
    <S.CarouselDetailField $wide={wide}>
      <S.CarouselDetailLabel>{label}</S.CarouselDetailLabel>
      <S.CarouselDetailValue><DisplayValue>{value}</DisplayValue></S.CarouselDetailValue>
    </S.CarouselDetailField>
  );
}

function BreadcrumbTrail({ breadcrumb = [] }) {
  if (!Array.isArray(breadcrumb) || !breadcrumb.length) return null;

  return (
    <S.Breadcrumbs aria-label="Box breadcrumb">
      {breadcrumb.map((node, index) => (
        <React.Fragment key={node?._id || `${node?.box_id || 'box'}-${index}`}>
          <S.BreadcrumbNode>
            <strong>{node?.box_id || '—'}</strong>
            {node?.label || 'Box'}
          </S.BreadcrumbNode>
          {index < breadcrumb.length - 1 ? <span aria-hidden="true">›</span> : null}
        </React.Fragment>
      ))}
    </S.Breadcrumbs>
  );
}

function ExternalLinks({ links = [] }) {
  if (!Array.isArray(links) || !links.length) {
    return <S.EmptyDetail>No references saved</S.EmptyDetail>;
  }

  return (
    <S.ExternalLinks>
      {links.map((link, index) => (
        <S.ExternalLink
          key={`${link.url}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </S.ExternalLink>
      ))}
    </S.ExternalLinks>
  );
}

export function OverviewSlide({
  itemName,
  thumbnailUrl,
  canOpenImageLightbox,
  onOpenImageLightbox,
  categoryLabel,
  tags,
  boxId,
  boxLabel,
  location,
  description,
  inDeclutterDeck,
  declutterPending,
  onDeclutter,
  onMove,
  onEdit,
  isConsumable,
  consumablePending,
  onConsumableToggle,
  activityActions = [],
  activityTimestamps = {},
}) {
  const tagList = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const boxText = [boxId ? `#${boxId}` : '', boxLabel].filter(Boolean).join(' ');

  return (
    <S.CarouselOverview>
      <S.OverviewPhotoMax>
        {thumbnailUrl ? (
          <S.OverviewPhotoStage aria-hidden="true">
            <S.OverviewPhotoBackdrop src={thumbnailUrl} alt="" />
            <S.OverviewPhoto src={thumbnailUrl} alt="" />
          </S.OverviewPhotoStage>
        ) : (
          <S.OverviewPhotoPlaceholder aria-hidden="true">NO VISUAL RECORD</S.OverviewPhotoPlaceholder>
        )}
        <S.OverviewPhotoScrim aria-hidden="true" />

        {canOpenImageLightbox ? (
          <S.OverviewPhotoOpen
            type="button"
            onClick={onOpenImageLightbox}
            aria-label={`Open full-size image for ${itemName || 'item'}`}
          >
            Photo max <span aria-hidden="true">↗</span>
          </S.OverviewPhotoOpen>
        ) : null}

        <S.OverviewOverlay>
          <S.OverviewIdentity>
            <S.OverviewKicker>At a glance</S.OverviewKicker>
            <S.OverviewTitle>{itemName || 'Untitled item'}</S.OverviewTitle>
            <S.OverviewFactRail>
              <S.OverviewFact>
                <span>Location</span>
                <strong>{location || 'Not set'}</strong>
              </S.OverviewFact>
              <S.OverviewFact>
                <span>Box</span>
                <strong>{boxText || 'Not assigned'}</strong>
              </S.OverviewFact>
              {categoryLabel && categoryLabel !== '—' ? (
                <S.OverviewCategory>{categoryLabel}</S.OverviewCategory>
              ) : null}
            </S.OverviewFactRail>
            {description ? <S.OverviewDescription>{description}</S.OverviewDescription> : null}
            {tagList.length ? (
              <S.OverviewTags aria-label="Item tags">
                {tagList.map((tag) => <span key={tag}>#{tag}</span>)}
              </S.OverviewTags>
            ) : null}
          </S.OverviewIdentity>

          <S.OverviewCommandDeck>
            <S.OverviewCommandHeader>
              <S.OverviewCommandLabel>All actions</S.OverviewCommandLabel>
              <S.OverviewConsumable>
                <span>Consumable</span>
                <S.ConsumableSwitch
                  type="button"
                  role="switch"
                  aria-checked={Boolean(isConsumable)}
                  aria-label="Track as consumable inventory"
                  $active={Boolean(isConsumable)}
                  disabled={consumablePending}
                  onClick={onConsumableToggle}
                >
                  <S.ConsumableSwitchThumb $active={Boolean(isConsumable)} />
                  <S.ConsumableSwitchLabel>
                    {consumablePending ? 'Saving' : isConsumable ? 'On' : 'Off'}
                  </S.ConsumableSwitchLabel>
                </S.ConsumableSwitch>
              </S.OverviewConsumable>
            </S.OverviewCommandHeader>

          <ItemDecisionActions
            inDeclutterDeck={inDeclutterDeck}
            declutterPending={declutterPending}
            onDeclutter={onDeclutter}
            onMove={onMove}
            onEdit={onEdit}
          />

            <S.OverviewActivityGrid aria-label="Log item activity">
              {activityActions.map((action) => (
                <S.OverviewActivityButton
                  key={action.id}
                  type="button"
                  $tone={action.tone}
                  disabled={action.disabled}
                  onClick={action.onClick}
                >
                  <strong>{action.label}</strong>
                  <span>{activityTimestamps?.[action.id] || 'Not logged'}</span>
                </S.OverviewActivityButton>
              ))}
            </S.OverviewActivityGrid>
          </S.OverviewCommandDeck>
        </S.OverviewOverlay>
      </S.OverviewPhotoMax>
    </S.CarouselOverview>
  );
}

export function NotesSlide({ description, notes, externalLinks = [], onEdit }) {
  return (
    <S.CarouselSection>
      <S.CarouselSectionIntro>
        <S.CarouselSectionKicker>Words & references</S.CarouselSectionKicker>
        <S.CarouselSectionTitle>Notes</S.CarouselSectionTitle>
        <S.CarouselSectionCopy>
          The memory, context, and links that make this item recognizable later.
        </S.CarouselSectionCopy>
      </S.CarouselSectionIntro>

      <S.CarouselNoteCard>
        <S.CarouselDetailLabel>Item notes</S.CarouselDetailLabel>
        <S.CarouselNoteText>
          <DisplayValue fallback="No notes yet">{notes}</DisplayValue>
        </S.CarouselNoteText>
      </S.CarouselNoteCard>

      <S.CarouselDetailGrid>
        <DetailField label="Description" value={description} wide />
        <DetailField label="References" value={<ExternalLinks links={externalLinks} />} wide />
      </S.CarouselDetailGrid>

      <S.CarouselSlideAction type="button" onClick={onEdit}>
        Edit notes and description
      </S.CarouselSlideAction>
    </S.CarouselSection>
  );
}

export function DetailsSlide({
  boxId,
  boxLabel,
  location,
  boxGroup,
  breadcrumbTrail = [],
  keepPriorityLabel,
  primaryOwnerName,
  condition,
  acquisitionType,
  dateAcquiredLabel,
  sourceBatchLabel,
  topBoxLabel,
}) {
  const boxValue = [boxId ? `#${boxId}` : '', boxLabel].filter(Boolean).join(' ');

  return (
    <S.CarouselSection>
      <S.CarouselSectionIntro>
        <S.CarouselSectionKicker>Placement & retention</S.CarouselSectionKicker>
        <S.CarouselSectionTitle>Other info</S.CarouselSectionTitle>
        <S.CarouselSectionCopy>
          Where it belongs, who it belongs to, and the context behind keeping it.
        </S.CarouselSectionCopy>
      </S.CarouselSectionIntro>

      <S.CarouselDetailGrid>
        <DetailField label="Box" value={boxValue} />
        <DetailField label="Location" value={location} />
        <DetailField label="Box group" value={boxGroup} />
        <DetailField label="Top box" value={topBoxLabel} />
        <DetailField label="Keep priority" value={keepPriorityLabel} />
        <DetailField label="Primary owner" value={primaryOwnerName} />
        <DetailField label="Condition" value={condition} />
        <DetailField label="Acquisition type" value={acquisitionType} />
        <DetailField label="Date acquired" value={dateAcquiredLabel} />
        <DetailField label="Source batch" value={sourceBatchLabel} />
        <DetailField
          label="Breadcrumb"
          value={<BreadcrumbTrail breadcrumb={breadcrumbTrail} />}
          wide
        />
      </S.CarouselDetailGrid>
    </S.CarouselSection>
  );
}

export function CostsSlide({
  quantity,
  statusLabel,
  valueLabel,
  purchasePriceLabel,
  isConsumable,
  consumablePending,
  onConsumableToggle,
}) {
  return (
    <S.CarouselSection>
      <S.CarouselSectionIntro>
        <S.CarouselSectionKicker>Inventory & value</S.CarouselSectionKicker>
        <S.CarouselSectionTitle>Costs</S.CarouselSectionTitle>
        <S.CarouselSectionCopy>
          Quantity, money, and whether this item is expected to be used up.
        </S.CarouselSectionCopy>
      </S.CarouselSectionIntro>

      <S.CostHeroGrid>
        <S.CostHeroCard>
          <S.CarouselDetailLabel>Estimated value</S.CarouselDetailLabel>
          <S.CostHeroValue><DisplayValue>{valueLabel}</DisplayValue></S.CostHeroValue>
        </S.CostHeroCard>
        <S.CostHeroCard>
          <S.CarouselDetailLabel>Purchase price</S.CarouselDetailLabel>
          <S.CostHeroValue><DisplayValue>{purchasePriceLabel}</DisplayValue></S.CostHeroValue>
        </S.CostHeroCard>
      </S.CostHeroGrid>

      <S.CarouselDetailGrid>
        <DetailField label="Quantity" value={quantity} />
        <DetailField label="Inventory status" value={statusLabel} />
      </S.CarouselDetailGrid>

      <S.ConsumableControl>
        <S.ConsumableCopy>
          <S.ConsumableTitle>Consumable inventory</S.ConsumableTitle>
          <S.ConsumableHint>
            Use consumable tracking for supplies that eventually run out instead of needing maintenance.
          </S.ConsumableHint>
        </S.ConsumableCopy>
        <S.ConsumableSwitch
          type="button"
          role="switch"
          aria-checked={Boolean(isConsumable)}
          aria-label="Track as consumable inventory"
          $active={Boolean(isConsumable)}
          disabled={consumablePending}
          onClick={onConsumableToggle}
        >
          <S.ConsumableSwitchThumb $active={Boolean(isConsumable)} />
          <S.ConsumableSwitchLabel>
            {consumablePending ? 'Saving' : isConsumable ? 'On' : 'Off'}
          </S.ConsumableSwitchLabel>
        </S.ConsumableSwitch>
      </S.ConsumableControl>
    </S.CarouselSection>
  );
}

export function ActivitySlide({
  activityActions = [],
  activityTimestamps = {},
  maintenanceNotes,
}) {
  return (
    <S.CarouselSection>
      <S.CarouselSectionIntro>
        <S.CarouselSectionKicker>One-tap history</S.CarouselSectionKicker>
        <S.CarouselSectionTitle>Actions & activity</S.CarouselSectionTitle>
        <S.CarouselSectionCopy>
          Log what happened now; the latest saved moment stays visible on each action.
        </S.CarouselSectionCopy>
      </S.CarouselSectionIntro>

      <S.CarouselActivityGrid>
        {activityActions.map((action) => (
          <S.CarouselActivityButton
            key={action.id}
            type="button"
            $tone={action.tone}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <S.CarouselActivityCommand>{action.label}</S.CarouselActivityCommand>
            <S.CarouselActivityTime>
              {activityTimestamps?.[action.id] || 'Not logged yet'}
            </S.CarouselActivityTime>
            <S.CarouselActivityArrow aria-hidden="true">↗</S.CarouselActivityArrow>
          </S.CarouselActivityButton>
        ))}
      </S.CarouselActivityGrid>

      <S.CarouselDetailGrid>
        <DetailField label="Maintenance notes" value={maintenanceNotes} wide />
      </S.CarouselDetailGrid>
    </S.CarouselSection>
  );
}
