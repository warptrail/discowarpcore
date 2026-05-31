// Toast.jsx
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_NARROW_BREAKPOINT,
} from '../../styles/tokens';
import { keyframes } from 'styled-components';
import RetrievalConsoleControls from '../Retrieval/RetrievalConsoleControls';

const Wrap = styled.div`
  --toast-compact-progress: 0;
  --toast-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --toast-duration: 280ms;

  position: relative;
  display: flex;
  gap: calc(0.75rem - (0.3rem * var(--toast-compact-progress)));
  align-items: ${({ $hasContent }) => ($hasContent ? 'flex-start' : 'center')};
  width: 100%;
  margin-block: calc(10px - (6px * var(--toast-compact-progress)));
  margin-inline: 0;
  min-height: ${({ $idle }) =>
    $idle
      ? 'calc(56px - (26px * var(--toast-compact-progress)))'
      : 'calc(56px - (12px * var(--toast-compact-progress)))'};
  background: ${({ $variant, $idle }) =>
    $idle
      ? '#0f141a'
      : $variant === 'success'
        ? '#10361f'
        : $variant === 'warning'
          ? '#3a2f10'
          : $variant === 'danger'
            ? '#3a1010'
            : '#102633'};
  border: 1px solid
    ${({ $variant, $idle }) =>
      $idle
        ? 'rgba(255,255,255,0.12)'
        : $variant === 'success'
          ? '#2f9e44'
          : $variant === 'warning'
            ? '#e0a800'
            : $variant === 'danger'
              ? '#e03131'
              : '#228be6'};
  color: ${({ $idle }) => ($idle ? 'rgba(234,234,234,0.82)' : '#eaeaea')};
  padding-block: ${({ $idle }) =>
    $idle
      ? 'calc(0.75rem - (0.49rem * var(--toast-compact-progress)))'
      : 'calc(0.75rem - (0.29rem * var(--toast-compact-progress)))'};
  padding-left: calc(1rem - (0.28rem * var(--toast-compact-progress)));
  padding-right: ${({ $hasClose }) =>
    $hasClose
      ? 'calc(3rem - (0.55rem * var(--toast-compact-progress)))'
      : 'calc(1rem - (0.42rem * var(--toast-compact-progress)))'};
  border-radius: calc(10px - (2px * var(--toast-compact-progress)));
  box-shadow:
    0 calc(8px - (4px * var(--toast-compact-progress))) calc(20px - (8px * var(--toast-compact-progress))) rgba(0, 0, 0, calc(0.25 - (0.03 * var(--toast-compact-progress))));
  transition:
    gap var(--toast-duration) var(--toast-ease),
    margin var(--toast-duration) var(--toast-ease),
    min-height var(--toast-duration) var(--toast-ease),
    padding var(--toast-duration) var(--toast-ease),
    border-radius var(--toast-duration) var(--toast-ease),
    box-shadow var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    margin: 6px 0;
    min-height: 44px;
    padding: 0.5rem 0.6rem;
    padding-right: ${({ $hasClose }) => ($hasClose ? '2.7rem' : '0.6rem')};
    border-radius: 8px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.24);
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  gap: ${({ $hasContent }) =>
    $hasContent
      ? 'calc(0.55rem - (0.19rem * var(--toast-compact-progress)))'
      : 'calc(0.2rem - (0.12rem * var(--toast-compact-progress)))'};
  transition: gap var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.88rem;
    gap: ${({ $hasContent }) => ($hasContent ? '0.4rem' : '0.15rem')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const Title = styled.div`
  font-weight: 600;
  font-size: calc(1rem - (0.18rem * var(--toast-compact-progress)));
  transition: font-size var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.86rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const Msg = styled.div`
  opacity: 0.9;
  font-size: calc(1rem - (0.22rem * var(--toast-compact-progress)));
  line-height: calc(1.35 - (0.15 * var(--toast-compact-progress)));
  transition:
    font-size var(--toast-duration) var(--toast-ease),
    line-height var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.82rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const ContentWrap = styled.div`
  width: 100%;
`;
const Idle = styled.div`
  display: flex;
  align-items: center;
  gap: calc(0.6rem - (0.2rem * var(--toast-compact-progress)));
  opacity: 0.9;
  font-size: calc(1rem - (0.22rem * var(--toast-compact-progress)));
  line-height: 1.1;
  min-width: 0;
  transition:
    gap var(--toast-duration) var(--toast-ease),
    font-size var(--toast-duration) var(--toast-ease);

  span:last-child {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.4rem;
    font-size: 0.82rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const RetrievalStateWrap = styled.div`
  display: grid;
  gap: 0.42rem;
  min-width: 0;
`;

const RetrievalConsoleKicker = styled.span`
  color: rgba(165, 218, 198, 0.78);
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const RetrievalNameBase = `
  color: #eaf4ff;
  font-size: clamp(1.18rem, 2.8vw, 1.48rem);
  font-weight: 860;
  line-height: 1.12;
  letter-spacing: 0.01em;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const RetrievalName = styled.span`
  ${RetrievalNameBase}
`;

const RetrievalNameLink = styled(Link)`
  ${RetrievalNameBase}
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  justify-self: start;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.86);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.64);
    outline-offset: 1px;
    border-radius: 4px;
  }
`;

const RetrievalBoxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.38rem;
  min-width: 0;
  flex-wrap: wrap;
  margin-top: 0.06rem;
`;

const RetrievalBoxId = styled.span`
  display: inline-flex;
  align-items: center;
  color: rgba(189, 231, 255, 0.98);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-weight: 840;
  font-size: 0.93rem;
  line-height: 1.2;
  letter-spacing: 0.03em;
  flex: 0 0 auto;
`;

const RetrievalBoxIdLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: rgba(189, 231, 255, 0.98);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-weight: 840;
  font-size: 0.93rem;
  line-height: 1.2;
  letter-spacing: 0.03em;
  text-decoration: none;
  flex: 0 0 auto;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.72);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.64);
    outline-offset: 1px;
  }
`;

const RetrievalBoxNameBase = `
  color: rgba(226, 236, 247, 0.9);
  font-size: 0.93rem;
  font-weight: 690;
  line-height: 1.25;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const RetrievalBoxName = styled.span`
  ${RetrievalBoxNameBase}
`;

const RetrievalBoxNameLink = styled(Link)`
  ${RetrievalBoxNameBase}
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.72);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.64);
    outline-offset: 1px;
    border-radius: 3px;
  }
`;

const RetrievalBoxSeparator = styled.span`
  color: rgba(168, 206, 232, 0.84);
  font-size: 0.9rem;
  line-height: 1.1;
`;

const RetrievalMeta = styled.span`
  color: rgba(226, 236, 247, 0.72);
  font-size: 0.74rem;
  line-height: 1.25;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Controls = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  flex-wrap: wrap;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 100%;
    justify-content: flex-start;
  }
`;
const Btn = styled.button`
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 7px;
    padding: 0.28rem 0.5rem;
    min-height: 34px;
    font-size: 0.78rem;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const CloseBtn = styled(Btn)`
  position: absolute;
  top: calc(0.5rem - (0.14rem * var(--toast-compact-progress)));
  right: calc(0.55rem - (0.13rem * var(--toast-compact-progress)));
  min-height: calc(30px - (4px * var(--toast-compact-progress)));
  min-width: calc(30px - (4px * var(--toast-compact-progress)));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  font-size: 0.92rem;
  line-height: 1;
  transition:
    top var(--toast-duration) var(--toast-ease),
    right var(--toast-duration) var(--toast-ease),
    min-height var(--toast-duration) var(--toast-ease),
    min-width var(--toast-duration) var(--toast-ease),
    opacity 120ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    top: 0.38rem;
    right: 0.42rem;
    min-height: 28px;
    min-width: 28px;
    border-radius: 7px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 120ms ease;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const Spinner = styled.span`
  width: 0.88rem;
  height: 0.88rem;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: rgba(255, 255, 255, 0.96);
  animation: ${spin} 0.8s linear infinite;
  flex: 0 0 auto;
`;

export default function Toast({
  open,
  title,
  message,
  content,
  variant = 'info', // 'success' | 'warning' | 'danger' | 'info'
  loading = false,
  actions = [], // [{id?, label, onClick, kind}] kind 'primary'|'ghost'
  onClose,
  showIdle = true,
  idleIcon = '📦',
  idleText = 'Standing by…',
  activeRetrievalItem = null,
  compact = false,
  compactProgress,
}) {
  const resolvedCompactProgress = Number.isFinite(Number(compactProgress))
    ? Math.min(1, Math.max(0, Number(compactProgress)))
    : compact
      ? 1
      : 0;
  const hasActiveRetrieval =
    !open && activeRetrievalItem && typeof activeRetrievalItem === 'object';
  const retrievalMode = String(activeRetrievalItem?.mode || '').trim();
  const hasRetrievalControls = hasActiveRetrieval && retrievalMode === 'controls';
  const hasRetrievalActive = hasActiveRetrieval && retrievalMode === 'active';
  const isIdle = !open && !hasActiveRetrieval;
  const hasContent = !isIdle && !!content;
  const retrievalItemsMode = String(activeRetrievalItem?.retrievalMode || 'items').trim();
  const retrievalSearchValue = String(activeRetrievalItem?.searchValue || '');
  const retrievalSearchLabel = activeRetrievalItem?.searchLabel;
  const retrievalSearchPlaceholder = activeRetrievalItem?.searchPlaceholder;
  const retrievalSearchHint = activeRetrievalItem?.searchHint;
  const retrievalShowRefine = Boolean(activeRetrievalItem?.showRefine);
  const retrievalSortOptions = Array.isArray(activeRetrievalItem?.sortOptions)
    ? activeRetrievalItem.sortOptions
    : [];
  const retrievalSelectedSort = String(activeRetrievalItem?.selectedSort || '').trim();
  const retrievalCategoryOptions = Array.isArray(activeRetrievalItem?.categoryOptions)
    ? activeRetrievalItem.categoryOptions
    : [];
  const retrievalTagOptions = Array.isArray(activeRetrievalItem?.tagOptions)
    ? activeRetrievalItem.tagOptions
    : [];
  const retrievalLocationOptions = Array.isArray(activeRetrievalItem?.locationOptions)
    ? activeRetrievalItem.locationOptions
    : [];
  const retrievalOwnerOptions = Array.isArray(activeRetrievalItem?.ownerOptions)
    ? activeRetrievalItem.ownerOptions
    : [];
  const retrievalKeepPriorityOptions = Array.isArray(activeRetrievalItem?.keepPriorityOptions)
    ? activeRetrievalItem.keepPriorityOptions
    : [];
  const retrievalChips = Array.isArray(activeRetrievalItem?.chips)
    ? activeRetrievalItem.chips
    : [];
  const retrievalBoxGroupOptions = Array.isArray(activeRetrievalItem?.boxGroupOptions)
    ? activeRetrievalItem.boxGroupOptions
    : [];
  const retrievalSelectedBoxGroup = String(activeRetrievalItem?.selectedBoxGroup || '');
  const retrievalBoxLocationOptions = Array.isArray(activeRetrievalItem?.boxLocationOptions)
    ? activeRetrievalItem.boxLocationOptions
    : [];
  const retrievalSelectedBoxLocation = String(activeRetrievalItem?.selectedBoxLocation || '');
  const retrievalName = String(activeRetrievalItem?.name || '').trim();
  const retrievalBoxId = String(activeRetrievalItem?.boxNumber || '').trim();
  const retrievalBoxName = String(activeRetrievalItem?.boxName || '').trim();
  const retrievalBoxHref = String(activeRetrievalItem?.boxHref || '').trim();
  const retrievalLocation = String(activeRetrievalItem?.locationLabel || '').trim();
  const retrievalItemHref = String(activeRetrievalItem?.itemHref || '').trim();
  const retrievalBoxIdText = retrievalBoxId ? `#${retrievalBoxId}` : 'No Box ID';
  const retrievalBoxNameText = retrievalBoxName || 'Unknown box';

  return (
    <Wrap
      $variant={variant}
      $idle={isIdle}
      $compact={compact}
      $hasContent={hasContent}
      $hasClose={!isIdle && !!onClose}
      style={{ '--toast-compact-progress': resolvedCompactProgress.toFixed(3) }}
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      <Body $hasContent={hasContent} $compact={compact}>
        {isIdle ? (
          showIdle ? (
            <Idle $compact={compact}>
              <span aria-hidden="true">{idleIcon}</span>
              <span>{idleText}</span>
            </Idle>
          ) : null
        ) : hasRetrievalControls ? (
          <RetrievalConsoleControls
            mode={retrievalItemsMode}
            onModeChange={activeRetrievalItem?.onModeChange}
            searchValue={retrievalSearchValue}
            onSearchChange={activeRetrievalItem?.onSearchChange}
            searchLabel={retrievalSearchLabel}
            searchPlaceholder={retrievalSearchPlaceholder}
            searchHint={retrievalSearchHint}
            showRefine={retrievalShowRefine}
            onToggleRefine={activeRetrievalItem?.onToggleRefine}
            chips={retrievalChips}
            sortOptions={retrievalSortOptions}
            selectedSort={retrievalSelectedSort}
            categoryOptions={retrievalCategoryOptions}
            tagOptions={retrievalTagOptions}
            locationOptions={retrievalLocationOptions}
            ownerOptions={retrievalOwnerOptions}
            keepPriorityOptions={retrievalKeepPriorityOptions}
            onSortChange={activeRetrievalItem?.onSortChange}
            onCategoryChange={activeRetrievalItem?.onCategoryChange}
            onTagChange={activeRetrievalItem?.onTagChange}
            onLocationChange={activeRetrievalItem?.onLocationChange}
            onOwnerChange={activeRetrievalItem?.onOwnerChange}
            onKeepPriorityChange={activeRetrievalItem?.onKeepPriorityChange}
            onRemoveChip={activeRetrievalItem?.onRemoveChip}
            onClearAllChips={activeRetrievalItem?.onClearAllChips}
            boxGroupOptions={retrievalBoxGroupOptions}
            selectedBoxGroup={retrievalSelectedBoxGroup}
            boxLocationOptions={retrievalBoxLocationOptions}
            selectedBoxLocation={retrievalSelectedBoxLocation}
            onBoxGroupChange={activeRetrievalItem?.onBoxGroupChange}
            onBoxLocationChange={activeRetrievalItem?.onBoxLocationChange}
            onClearBoxGroup={activeRetrievalItem?.onClearBoxGroup}
            onClearBoxLocation={activeRetrievalItem?.onClearBoxLocation}
          />
        ) : hasRetrievalActive ? (
          <RetrievalStateWrap>
            <RetrievalConsoleKicker>Active Item</RetrievalConsoleKicker>
            {retrievalItemHref ? (
              <RetrievalNameLink to={retrievalItemHref}>
                {retrievalName || 'Expanded item'}
              </RetrievalNameLink>
            ) : (
              <RetrievalName>{retrievalName || 'Expanded item'}</RetrievalName>
            )}
            <RetrievalBoxRow>
              {retrievalBoxHref ? (
                <RetrievalBoxIdLink to={retrievalBoxHref}>
                  {retrievalBoxIdText}
                </RetrievalBoxIdLink>
              ) : (
                <RetrievalBoxId>{retrievalBoxIdText}</RetrievalBoxId>
              )}
              <RetrievalBoxSeparator aria-hidden="true">·</RetrievalBoxSeparator>

              {retrievalBoxHref ? (
                <RetrievalBoxNameLink to={retrievalBoxHref}>
                  {retrievalBoxNameText}
                </RetrievalBoxNameLink>
              ) : (
                <RetrievalBoxName>{retrievalBoxNameText}</RetrievalBoxName>
              )}
            </RetrievalBoxRow>
            {retrievalLocation ? (
              <RetrievalMeta>{`Location: ${retrievalLocation}`}</RetrievalMeta>
            ) : null}
          </RetrievalStateWrap>
        ) : (
          <>
            {title ? (
              <TitleRow>
                {loading ? <Spinner aria-hidden="true" /> : null}
                <Title $compact={compact}>{title}</Title>
              </TitleRow>
            ) : null}
            {message && <Msg $compact={compact}>{message}</Msg>}
            {hasContent && <ContentWrap>{content}</ContentWrap>}
          </>
        )}
      </Body>
      {!isIdle && actions.length ? (
        <Controls>
          {actions.map((a, i) => (
            <Btn
              key={
                a?.id ?? `${a?.label ?? 'action'}-${a?.kind ?? 'default'}-${i}`
              }
              onClick={a.onClick}
              style={
                a.kind === 'primary'
                  ? { background: '#fff', color: '#111', borderColor: '#fff' }
                  : a.kind === 'danger'
                    ? {
                        background: '#e03131',
                        color: '#fff',
                        borderColor: '#e03131',
                      }
                    : {}
              }
            >
              {a.label}
            </Btn>
          ))}
        </Controls>
      ) : null}
      {!isIdle && onClose ? <CloseBtn $compact={compact} onClick={onClose}>✕</CloseBtn> : null}
    </Wrap>
  );
}
