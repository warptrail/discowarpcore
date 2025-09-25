// src/components/ItemRow.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';

export default function ItemRow({
  item,
  isOpen,
  onOpen, // onOpen(id) — pass null to close
  // Appearance controls (match ItemRow.styles.js)
  accent, // string color, e.g. '#ffd166' (optional)
  pulsingItems = false, // boolean to flash attention (optional)
  // Animation timing
  onTogglePulse,
  collapseDurMs,
}) {
  const {
    _id,
    name,
    quantity,
    tags = [],
    notes,
    parentBoxLabel,
    parentBoxId,
  } = item || {};

  // State flags for styling/transitions (DO NOT CHANGE LOGIC)
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Presence + collapse measurements (DO NOT CHANGE LOGIC)
  const [present, setPresent] = useState(!!isOpen);
  const [targetHeight, setTargetHeight] = useState(0);
  const contentRef = useRef(null);

  // Kick the opening sweep; ensure the details are mounted (DO NOT CHANGE)
  useEffect(() => {
    if (isOpen) {
      setPresent(true);
      setIsClosing(false);
      setIsOpening(true);
      const t = setTimeout(() => setIsOpening(false), 700); // keep in sync with your open sweep
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Measure details panel for smooth collapse (DO NOT CHANGE)
  useLayoutEffect(() => {
    if (!contentRef.current) {
      setTargetHeight(0);
      return;
    }
    setTargetHeight(isOpen ? contentRef.current.scrollHeight : 0);
  }, [isOpen, present]);

  // Re-measure if contents change while open (DO NOT CHANGE)
  useEffect(() => {
    if (!contentRef.current || !isOpen) return;
    const ro = new ResizeObserver(() => {
      if (isOpen && contentRef.current) {
        setTargetHeight(contentRef.current.scrollHeight);
      }
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  // Whole row toggles (DO NOT CHANGE)
  const handleRowClick = () => {
    if (isOpen) {
      setIsClosing(true);
      onOpen?.(null); // tell parent to close (only one open at a time)
    } else {
      onOpen?.(_id); // tell parent to open this one
    }
  };

  // Tiny delay on open to feel more natural (same as before)
  const collapseDelay = useMemo(() => (isOpen ? 120 : 0), [isOpen]);

  // When the height transition finishes, unmount details if closed
  const handleCollapseTransitionEnd = (e) => {
    if (e.propertyName !== 'height') return;
    if (!isOpen) {
      setPresent(false);
      setIsClosing(false);
    }
  };

  return (
    <S.Wrapper
      $accent={accent}
      $pulsingItems={pulsingItems}
      $hDuration="6s"
      $hStart={200}
      $hSat={90}
      $hLight={58}
      data-open={isOpen ? 'true' : 'false'}
      data-opening={isOpening ? 'true' : 'false'}
      data-closing={isClosing ? 'true' : 'false'}
    >
      <S.Clip>
        <S.Row onClick={handleRowClick} data-open={isOpen ? 'true' : 'false'}>
          <S.Left>
            <S.Title>{name}</S.Title>

            {(parentBoxLabel || parentBoxId) && (
              <S.Breadcrumb>
                {parentBoxLabel} {!!parentBoxId && `(${parentBoxId})`}
              </S.Breadcrumb>
            )}

            {!!tags.length && (
              <S.TagRow>
                {tags.map((t) => (
                  <S.Tag key={t}>{t}</S.Tag>
                ))}
              </S.TagRow>
            )}

            {notes && <S.Notes>{notes}</S.Notes>}
          </S.Left>

          <S.Right>{quantity != null && <S.Qty>x{quantity}</S.Qty>}</S.Right>
        </S.Row>

        <S.Collapse
          style={{
            height: `${targetHeight}px`,
            transitionDelay: `${collapseDelay}ms`,
            ['--collapse-dur']: `${collapseDurMs}ms`,
          }}
          data-open={isOpen ? 'true' : 'false'}
          onTransitionEnd={handleCollapseTransitionEnd}
        >
          {present && (
            <div ref={contentRef}>
              <S.DetailsCard>
                <ItemDetails item={item} onTogglePulse={onTogglePulse} />
              </S.DetailsCard>
            </div>
          )}
        </S.Collapse>
      </S.Clip>
    </S.Wrapper>
  );
}
