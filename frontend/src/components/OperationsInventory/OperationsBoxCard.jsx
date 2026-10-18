import SectionBadge from '../BoxForms/SectionBadge';
import CompactTagRow from '../Tags/CompactTagRow';
import MissingBoxStatus from '../MissingItems/MissingBoxStatus';
import { styledComponents as S } from '../../styles/BoxList.styles';
import SearchHighlight from '../SearchHighlight';
import { getSearchTerms } from '../../util/searchHighlight';
import OperationsCardMedia from './OperationsCardMedia';
import OperationsCardFields from './OperationsCardFields';
import OperationsCardSearchMatches from './OperationsCardSearchMatches';
import { DesktopItemCount } from './OperationsCardLayout.styles';
import OperationsBranchIndicator, { CardIdentity } from './OperationsBranchIndicator';

export default function OperationsBoxCard({ model }) {
  const {
    node, depth, density, isRoot, isSystemContainer, isOrphanedContainer,
    isSelected, boxImageUrl, go, handleCardKeyDown, openPhoto, itemQtyTotal,
    visibleTags, description, matchingNotes, childBoxes, nestedToggle, matchingItems, searchQuery, onEditBoxField,
  } = model;
  const hasMatches = Boolean(matchingItems?.length);
  const physicalChildCount = node.directChildBoxCount ?? childBoxes.filter(child => child.kind !== "cabinet").length;
  const title = isOrphanedContainer ? 'Items Adrift' : node.label || node.name || 'Untitled';
  const searchTerms = getSearchTerms(searchQuery);
  return (
    <S.BoxCard
      data-box-address={node.scopedAddress || node.address || node.box_id}
      data-result-kind={node.kind || "box"}
      data-has-field-actions={Boolean(onEditBoxField && !isSystemContainer) || undefined}
      data-has-search-matches={hasMatches || undefined}
      as="div"
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={handleCardKeyDown}
      aria-label={
        isOrphanedContainer
          ? 'Open Items Adrift'
          : `Preview box ${node.address || node.box_id}, ${
              node.label || node.name || 'Untitled'
            }`
      }
      aria-expanded={isSystemContainer ? undefined : isSelected}
      aria-controls={
        isSystemContainer ? undefined : 'operations-box-quick-peek'
      }
      data-operations-box-preview-trigger={
        isSystemContainer ? undefined : 'true'
      }
      $isRoot={isRoot}
      $depth={depth}
      $isSystem={isSystemContainer}
      $density={density}
      $selected={isSelected}
    >
      <S.BoxBodyRow $density={density}>
        <OperationsCardMedia node={node} boxImageUrl={boxImageUrl} density={density}
          openPhoto={openPhoto} compact={hasMatches} />

        <S.BoxContent>
          <S.BoxHeader>
            <CardIdentity>
            <S.ShortId $isRoot={isRoot} $depth={depth} $isSystem={isSystemContainer}>
              {isSystemContainer ? (
                'SYS'
              ) : (
                <>
                  <S.ShortIdMarker>#</S.ShortIdMarker>
                  <S.ShortIdDigits>{node.address || node.box_id}</S.ShortIdDigits>
                </>
              )}
            </S.ShortId>
            {nestedToggle?.presentation === 'inspector' ? <OperationsBranchIndicator box={node} count={childBoxes.length} controls={nestedToggle} /> : null}
            </CardIdentity>
            <DesktopItemCount>{itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}</DesktopItemCount>
            <S.BoxTitle
              $isRoot={isRoot}
              $depth={depth}
              $isSystem={isSystemContainer}
              $density={density}
              title={title}
            >
              <SearchHighlight text={title} terms={searchTerms} />
            </S.BoxTitle>
          </S.BoxHeader><MissingBoxStatus box={node} />

          {node.kind === "cabinet" ? <S.SecondaryMeta style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}><SectionBadge compartmentKey={node.compartmentKey} /> · in #{node.box_id} {node.ownerBoxLabel} · {node.shelfCount ? `${node.shelfCount} shelves` : "Single storage space"}</S.SecondaryMeta> : null}
          {node.isComplexBox ? <S.SecondaryMeta>Complex box</S.SecondaryMeta> : null}
          <S.BoxMetaRow>
            <S.LocationMeta>
              <S.LocationMetaLabel>Location</S.LocationMetaLabel>
              <S.LocationMetaValue title={String(node.location ?? '').trim() || 'unknown'} $missing={!String(node.location ?? '').trim()}>
                {String(node.location ?? '').trim() || 'unknown'}
              </S.LocationMetaValue>
            </S.LocationMeta>
          </S.BoxMetaRow>

          {!hasMatches && description && density === 'roomy' ? (
            <S.BoxSummary $density={density}>{description}</S.BoxSummary>
          ) : null}

          {isSystemContainer ? (
            <S.BoxSummary $density={density}>Virtual system container</S.BoxSummary>
          ) : null}

          {!hasMatches && visibleTags.length > 0 && (
            <S.TagRow style={{ width: '100%', maxWidth: '100%' }}>
              <CompactTagRow searchQuery={searchQuery} tags={node.tags || visibleTags} name={title} boxId={node.box_id || ''} />
            </S.TagRow>
          )}

          {!matchingItems?.length && matchingNotes.length > 0 ? (
            <S.MatchSummary>
              Matched in notes · {matchingNotes.join(', ')}
            </S.MatchSummary>
          ) : null}

          <S.BoxFooter>
            {isOrphanedContainer || physicalChildCount > 0 ? (
              <S.StatPill $variant="boxes" $isRoot={isRoot} $depth={depth}>
                {isOrphanedContainer
                  ? 'virtual'
                  : `${physicalChildCount} ${physicalChildCount === 1 ? 'box' : 'boxes'}`}
              </S.StatPill>
            ) : null}
            <S.StatPill $variant="items" $isRoot={isRoot} $depth={depth}>
              {itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}
            </S.StatPill>
            {isOrphanedContainer ? (
              <S.StatPill $isRoot={isRoot} $depth={depth}>
                unassigned
              </S.StatPill>
            ) : null}
          </S.BoxFooter>

        </S.BoxContent>
      </S.BoxBodyRow>
      {hasMatches ? <OperationsCardSearchMatches items={matchingItems} query={searchQuery} boxId={node.box_id} /> : null}
      {onEditBoxField && !isSystemContainer ? <OperationsCardFields box={node} onEdit={onEditBoxField} /> : null}
      <S.CardManifest aria-hidden="true" $isRoot={isRoot} $depth={depth}>
        {onEditBoxField && node.isComplexBox ? <span>Complex ·</span> : null}
        {isOrphanedContainer || physicalChildCount > 0 ? <>
          <span>{isOrphanedContainer ? 'virtual' : `${physicalChildCount} ${physicalChildCount === 1 ? 'box' : 'boxes'}`}</span>
          <S.CardManifestMuted>//</S.CardManifestMuted>
        </> : null}
        <span>{itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}</span>
      </S.CardManifest>
    </S.BoxCard>
  );
}
