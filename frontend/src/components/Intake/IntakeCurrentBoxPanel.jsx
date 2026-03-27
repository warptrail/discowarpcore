import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import IntakeBoxSelectorPanel from './IntakeBoxSelectorPanel';
import EditBoxDetailsForm from '../EditBoxDetailsForm';
import { ToastContext } from '../Toast';
import DestroyBoxSection from '../DestroyBoxSection';
import { destroyBoxById, releaseChildrenToFloor } from '../../api/boxes';

const Panel = styled.section`
  border: 1px solid rgba(75, 164, 132, 0.42);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(18, 27, 28, 0.94) 0%, rgba(12, 18, 20, 0.98) 100%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid rgba(70, 132, 112, 0.35);
  background: linear-gradient(90deg, rgba(63, 201, 152, 0.2) 0%, rgba(63, 201, 152, 0) 58%);
`;

const Heading = styled.h2`
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #d8ece6;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const ClearCurrentBoxButton = styled.button`
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 999px;
  border: 1px solid rgba(117, 178, 191, 0.62);
  background: rgba(12, 26, 32, 0.88);
  color: #d2e8ef;
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
    border-color: rgba(133, 201, 216, 0.86);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 24px;
    height: 24px;
    min-width: 24px;
    font-size: 15px;
  }
`;

const Body = styled.div`
  padding: 0.75rem;
  display: grid;
  gap: 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.62rem;
    gap: 0.58rem;
  }
`;

const CurrentBoxCard = styled.div`
  display: grid;
  gap: 0.56rem;
`;

const IdentityTopRow = styled.div`
  display: grid;
  grid-template-columns: ${({ $hasImage }) => ($hasImage ? '148px minmax(0, 1fr)' : '1fr')};
  gap: 0.72rem;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $hasImage }) => ($hasImage ? '104px minmax(0, 1fr)' : '1fr')};
    gap: 0.52rem;
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: 0.42rem;
  }
`;

const BoxImageWrap = styled.div`
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(117, 186, 170, 0.45);
  background: rgba(10, 16, 18, 0.86);
  width: 100%;
  max-width: 148px;
  aspect-ratio: 1 / 1;
  align-self: start;
  justify-self: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 104px;
  }

  @media (max-width: 420px) {
    max-width: 120px;
  }
`;

const BoxImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

const BoxIdentity = styled.div`
  border: 1px solid rgba(66, 112, 123, 0.4);
  border-radius: 10px;
  background: rgba(11, 19, 24, 0.8);
  padding: 0.62rem 0.68rem;
  min-width: 0;
  display: grid;
  gap: 0.42rem;
`;

const BoxName = styled.div`
  color: #e8f1f4;
  font-size: 1rem;
  line-height: 1.25;
  font-weight: 700;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.94rem;
  }
`;

const BoxMeta = styled.div`
  color: #a7bbc1;
  font-size: 0.76rem;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: baseline;
  gap: 0.36rem;
`;

const BoxCode = styled.span`
  font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 1.22rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.08em;
  color: #e7fbf4;
  text-shadow: 0 0 10px rgba(100, 224, 176, 0.35);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 1.12rem;
  }
`;

const MetaRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  min-width: 0;
  color: #9eb7c4;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
`;

const MetaLabel = styled.span`
  color: #86a3b0;
  text-transform: uppercase;
  font-size: 0.66rem;
  letter-spacing: 0.08em;
`;

const MetaValue = styled.span`
  color: #d4e7ee;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BreadcrumbWrap = styled.div`
  border: 1px solid rgba(84, 129, 144, 0.42);
  border-radius: 8px;
  background: rgba(12, 25, 31, 0.78);
  padding: 0.36rem 0.42rem;
  display: grid;
  gap: 0.28rem;
`;

const BreadcrumbLabel = styled.div`
  color: #8aa8b4;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
`;

const BreadcrumbRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.22rem;
  min-width: 0;
`;

const BreadcrumbSegment = styled.button`
  border: 1px solid
    ${({ $current }) =>
      $current ? 'rgba(113, 186, 163, 0.62)' : 'rgba(93, 137, 151, 0.48)'};
  background: ${({ $current }) =>
    $current ? 'rgba(19, 45, 39, 0.9)' : 'rgba(15, 30, 38, 0.85)'};
  color: ${({ $current }) => ($current ? '#e5fff5' : '#d0e7ef')};
  border-radius: 999px;
  padding: 0.1rem 0.44rem;
  max-width: 180px;
  font-size: 0.67rem;
  font-weight: ${({ $current }) => ($current ? 700 : 600)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  opacity: ${({ $clickable, $current }) => ($clickable || $current ? 1 : 0.88)};

  &:hover {
    ${({ $clickable }) => ($clickable ? 'filter: brightness(1.08);' : '')}
  }
`;

const BreadcrumbSep = styled.span`
  color: #6f8f9d;
  font-size: 0.75rem;
  line-height: 1;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.34rem 0.42rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.28rem;
  }
`;

const LowerMetaRegion = styled.div`
  display: grid;
  gap: 0.42rem;
  min-width: 0;
`;

const StatCard = styled.div`
  border: 1px solid rgba(83, 130, 145, 0.42);
  border-radius: 8px;
  background: rgba(11, 23, 29, 0.78);
  padding: 0.3rem 0.42rem;
  display: grid;
  gap: 0.16rem;
  min-width: 0;
`;

const StatTitle = styled.div`
  color: #8aa9b5;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const StatValue = styled.div`
  color: #e3f4fb;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`;

const TagChip = styled.span`
  border: 1px solid rgba(110, 167, 180, 0.5);
  border-radius: 999px;
  padding: 0.14rem 0.44rem;
  font-size: 0.67rem;
  color: #d1eaf3;
  background: rgba(20, 41, 49, 0.82);
`;

const NotesCard = styled.div`
  border: 1px solid rgba(122, 175, 191, 0.44);
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(13, 30, 37, 0.9), rgba(9, 21, 27, 0.9));
  padding: 0.38rem 0.45rem;
  display: grid;
  gap: 0.22rem;
`;

const NotesLabel = styled.div`
  color: #8fb0bc;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
`;

const NotesText = styled.div`
  color: #e2f1f6;
  font-size: 0.73rem;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: min(132px, 26vh);
  overflow-y: auto;
`;

const BoxHint = styled.p`
  margin: 0;
  color: #b8c7cf;
  font-size: 0.84rem;
  line-height: 1.45;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const ActionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.48rem;
  align-items: stretch;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(97, 175, 150, 0.58);
  background: rgba(15, 34, 30, 0.9);
  color: #e4f7f0;
  font-size: 0.83rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background: rgba(23, 53, 46, 0.98);
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const LinkButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(78, 133, 197, 0.58);
  background: rgba(19, 30, 48, 0.9);
  color: #d6e7ff;
  text-decoration: none;
  font-size: 0.83rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &:hover {
    background: rgba(24, 41, 67, 0.98);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const EditRegion = styled.div`
  border: 1px solid rgba(86, 146, 167, 0.45);
  border-radius: 10px;
  background: rgba(11, 20, 27, 0.86);
  padding: 0.46rem;
  display: grid;
  gap: 0.36rem;
`;

function getBoxImageUrl(box) {
  return (
    box?.image?.display?.url ||
    box?.image?.thumb?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    ''
  );
}

export default function IntakeCurrentBoxPanel({
  boxes = [],
  selectedBox,
  currentBoxInsight,
  selectedBoxId = '',
  selectorOpen = false,
  onSelectBox,
  onToggleSelector,
  onCreateBox,
  onCurrentBoxPhotoUpdated,
  onCurrentBoxUpdated,
  onCurrentBoxDestroyed,
}) {
  const toastCtx = React.useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const [editOpen, setEditOpen] = React.useState(false);
  const [destroyConfirmOpen, setDestroyConfirmOpen] = React.useState(false);
  const [destroyConfirmText, setDestroyConfirmText] = React.useState('');
  const [destroyBusy, setDestroyBusy] = React.useState(false);
  const boxImageUrl = getBoxImageUrl(selectedBox);
  const shouldShowSelector = selectorOpen;
  const locationName =
    selectedBox?.locationId?.name ||
    selectedBox?.location?.name ||
    selectedBox?.locationName ||
    selectedBox?.location ||
    '';
  const groupName = String(selectedBox?.group || '').trim();
  const notes = String(selectedBox?.notes || '').trim();
  const tags = Array.isArray(selectedBox?.tags) ? selectedBox.tags : [];
  const stats = currentBoxInsight?.stats || {
    directUnique: Array.isArray(selectedBox?.items) ? selectedBox.items.length : 0,
    directQuantity: Array.isArray(selectedBox?.items)
      ? selectedBox.items.reduce((sum, item) => {
        const numeric = Number(item?.quantity);
        return sum + (Number.isFinite(numeric) ? numeric : 1);
      }, 0)
      : 0,
    descendantUnique: 0,
    descendantQuantity: 0,
    totalUnique: Array.isArray(selectedBox?.items) ? selectedBox.items.length : 0,
    totalQuantity: Array.isArray(selectedBox?.items)
      ? selectedBox.items.reduce((sum, item) => {
        const numeric = Number(item?.quantity);
        return sum + (Number.isFinite(numeric) ? numeric : 1);
      }, 0)
      : 0,
    directChildBoxes: Array.isArray(selectedBox?.childBoxes) ? selectedBox.childBoxes.length : 0,
    descendantBoxes: Array.isArray(selectedBox?.childBoxes) ? selectedBox.childBoxes.length : 0,
  };
  const breadcrumb = currentBoxInsight?.breadcrumb?.length
    ? currentBoxInsight.breadcrumb
    : selectedBox?._id
      ? [{
        id: String(selectedBox._id),
        boxId: String(selectedBox?.box_id || ''),
        label: selectedBox?.label || 'Unnamed Box',
      }]
      : [];
  const destroyConfirmValid = destroyConfirmText === 'DESTROY';

  React.useEffect(() => {
    setEditOpen(false);
    setDestroyConfirmOpen(false);
    setDestroyConfirmText('');
    setDestroyBusy(false);
  }, [selectedBox?._id]);

  const handleEditSaved = (updatedBox) => {
    if (!updatedBox?._id) return;
    onCurrentBoxUpdated?.(updatedBox);
    setEditOpen(false);
  };

  const handleStartDestroy = () => {
    if (!selectedBox?._id || destroyBusy) return;
    setDestroyConfirmText('');
    setDestroyConfirmOpen(true);
  };

  const handleCancelDestroy = React.useCallback(() => {
    setDestroyConfirmOpen(false);
    setDestroyConfirmText('');
    setDestroyBusy(false);
    hideToast?.();
  }, [hideToast]);

  const handleConfirmDestroy = React.useCallback(async () => {
    if (!selectedBox?._id || destroyBusy || !destroyConfirmValid) return;
    setDestroyBusy(true);

    try {
      await releaseChildrenToFloor(selectedBox._id);
      await destroyBoxById(selectedBox._id);

      setDestroyConfirmOpen(false);
      setDestroyConfirmText('');
      hideToast?.();
      setEditOpen(false);
      onCurrentBoxDestroyed?.({
        boxId: selectedBox._id,
        boxShortId: selectedBox?.box_id || '',
      });

      showToast?.({
        variant: 'success',
        title: `Box #${selectedBox?.box_id || '---'} destroyed`,
        message: 'Direct items were orphaned and direct child boxes were released to floor level.',
        timeoutMs: 3600,
      });
    } catch (destroyError) {
      showToast?.({
        variant: 'danger',
        title: 'Destroy failed',
        message: destroyError?.message || 'Failed to destroy this box.',
        timeoutMs: 5200,
      });
    } finally {
      setDestroyBusy(false);
    }
  }, [
    destroyBusy,
    destroyConfirmValid,
    hideToast,
    onCurrentBoxDestroyed,
    selectedBox,
    showToast,
  ]);

  React.useEffect(() => {
    if (!destroyConfirmOpen || !selectedBox?._id) return;

    showToast?.({
      variant: 'danger',
      title: `Destroy Box #${selectedBox?.box_id || '---'}`,
      message: 'Permanent action. Confirm carefully.',
      sticky: true,
      content: (
        <DestroyBoxSection
          busy={destroyBusy}
          shortId={selectedBox?.box_id || '---'}
          confirmText={destroyConfirmText}
          onConfirmTextChange={setDestroyConfirmText}
          isConfirmValid={destroyConfirmValid}
          onCancel={handleCancelDestroy}
          onConfirm={handleConfirmDestroy}
        />
      ),
      onClose: handleCancelDestroy,
    });
  }, [
    destroyBusy,
    destroyConfirmOpen,
    destroyConfirmText,
    destroyConfirmValid,
    handleCancelDestroy,
    handleConfirmDestroy,
    selectedBox,
    showToast,
  ]);

  return (
    <Panel>
      <Header>
        <Heading>Current Box Panel</Heading>
        {selectedBox ? (
          <ClearCurrentBoxButton
            type="button"
            onClick={() => onSelectBox?.('')}
            aria-label="Clear current box selection"
            title="Clear current box"
          >
            ×
          </ClearCurrentBoxButton>
        ) : null}
      </Header>

      <Body>
        {selectedBox ? (
          <CurrentBoxCard>
            <IdentityTopRow $hasImage={!!boxImageUrl}>
              {boxImageUrl ? (
                <BoxImageWrap>
                  <BoxImage src={boxImageUrl} alt={`${selectedBox?.label || 'Box'} preview`} />
                </BoxImageWrap>
              ) : null}

              <BoxIdentity>
                <BoxName>{selectedBox?.label || 'Unnamed Box'}</BoxName>
                <BoxMeta>
                  <BoxCode>#{selectedBox?.box_id || '---'}</BoxCode>
                </BoxMeta>
                {groupName ? (
                  <MetaRow>
                    <MetaLabel>Group</MetaLabel>
                    <MetaValue>{groupName}</MetaValue>
                  </MetaRow>
                ) : null}
                {locationName ? (
                  <MetaRow>
                    <MetaLabel>Location</MetaLabel>
                    <MetaValue>{locationName}</MetaValue>
                  </MetaRow>
                ) : null}
              </BoxIdentity>
            </IdentityTopRow>

            <LowerMetaRegion>
              <BreadcrumbWrap>
                <BreadcrumbLabel>Path</BreadcrumbLabel>
                <BreadcrumbRow>
                  {breadcrumb.map((segment, index) => {
                    const segmentId = String(segment?.id || '');
                    const isCurrent = segmentId && segmentId === String(selectedBoxId || '');
                    const canJump = !!segmentId && !isCurrent;
                    const label = segment?.label || (segment?.boxId ? `#${segment.boxId}` : 'Box');
                    const idText = segment?.boxId ? `#${segment.boxId}` : '';
                    return (
                      <React.Fragment key={`${segmentId || label}-${index}`}>
                        <BreadcrumbSegment
                          type="button"
                          $current={isCurrent}
                          $clickable={canJump}
                          title={idText ? `${label} (${idText})` : label}
                          onClick={() => {
                            if (!canJump) return;
                            onSelectBox?.(segmentId);
                          }}
                        >
                          {idText ? `${label} ${idText}` : label}
                        </BreadcrumbSegment>
                        {index < breadcrumb.length - 1 ? <BreadcrumbSep>›</BreadcrumbSep> : null}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbRow>
              </BreadcrumbWrap>
              <StatsGrid>
                <StatCard>
                  <StatTitle>Direct</StatTitle>
                  <StatValue>{stats.directUnique} unique / qty {stats.directQuantity}</StatValue>
                </StatCard>
                <StatCard>
                  <StatTitle>Descendants</StatTitle>
                  <StatValue>{stats.descendantUnique} unique / qty {stats.descendantQuantity}</StatValue>
                </StatCard>
                <StatCard>
                  <StatTitle>Total</StatTitle>
                  <StatValue>{stats.totalUnique} unique / qty {stats.totalQuantity}</StatValue>
                </StatCard>
                <StatCard>
                  <StatTitle>Boxes</StatTitle>
                  <StatValue>{stats.directChildBoxes} child / {stats.descendantBoxes} descendants</StatValue>
                </StatCard>
              </StatsGrid>

              {notes ? (
                <NotesCard>
                  <NotesLabel>Notes</NotesLabel>
                  <NotesText>{notes}</NotesText>
                </NotesCard>
              ) : null}

              {tags.length ? (
                <TagRow>
                  {tags.slice(0, 4).map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </TagRow>
              ) : null}
            </LowerMetaRegion>
          </CurrentBoxCard>
        ) : (
          <>
            <BoxName>Select or Create Box</BoxName>
            <BoxHint>
              Choose the active box once, then Intake automatically attaches every
              new item to it.
            </BoxHint>
          </>
        )}

        <ActionRow>
          {selectedBox ? (
            <LinkButton to={`/boxes/${encodeURIComponent(selectedBox.box_id)}`}>
              Open Box
            </LinkButton>
          ) : null}

          <ActionButton type="button" onClick={onToggleSelector}>
            Change Box
          </ActionButton>

          <ActionButton type="button" onClick={onCreateBox}>
            Create Box
          </ActionButton>

          {selectedBox ? (
            <ActionButton type="button" onClick={() => setEditOpen((prev) => !prev)}>
              {editOpen ? 'Close Edit' : 'Edit Box'}
            </ActionButton>
          ) : null}
        </ActionRow>

        {shouldShowSelector ? (
          <IntakeBoxSelectorPanel
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            onSelectBox={onSelectBox}
            onClose={onToggleSelector}
          />
        ) : null}

        {selectedBox && editOpen ? (
          <EditRegion>
            <EditBoxDetailsForm
              compact
              boxMongoId={selectedBox._id}
              initial={selectedBox}
              onSaved={handleEditSaved}
              onDestroy={handleStartDestroy}
              onImageUpdated={({ image, imagePath }) =>
                onCurrentBoxPhotoUpdated?.({
                  boxId: selectedBox._id,
                  image: image || null,
                  imagePath: imagePath || '',
                })
              }
              onCancel={() => setEditOpen(false)}
            />
          </EditRegion>
        ) : null}
      </Body>
    </Panel>
  );
}
