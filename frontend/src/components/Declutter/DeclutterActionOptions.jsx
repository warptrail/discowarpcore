import { useEffect, useId, useMemo, useRef, useState } from 'react';

import CustomSelect from '../CustomSelect';
import * as S from './Declutter.styles';

const ROUTE_OPTIONS = [
  { value: 'discard', label: 'Trash' },
  { value: 'donate', label: 'Donate' },
  { value: 'sell', label: 'Sell' },
  { value: 'gift', label: 'Gift' },
];

export default function DeclutterActionOptions({
  candidate,
  itemName,
  currentRoute,
  player,
  stagingBoxes = [],
  busy,
  onAction,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [route, setRoute] = useState(
    currentRoute === 'needs_routing' ? 'discard' : currentRoute,
  );
  const [boxId, setBoxId] = useState('');
  const panelId = useId();
  const toggleRef = useRef(null);
  const routingLocked = currentRoute === 'needs_routing' && player !== 'laserfox';

  useEffect(() => {
    setRoute(currentRoute === 'needs_routing' ? 'discard' : currentRoute);
    setBoxId('');
  }, [currentRoute]);

  const compatibleBoxes = useMemo(
    () => stagingBoxes.filter((box) => (
      box.declutterPurpose === (route === 'sell' ? 'sale_staging' : 'donation_staging')
    )),
    [route, stagingBoxes],
  );

  const stagingOptions = useMemo(
    () => [
      { value: '', label: 'Default staging box' },
      ...compatibleBoxes.map((box) => ({
        value: box.id,
        label: [box.box_id, box.label].filter(Boolean).join(' '),
      })),
    ],
    [compatibleBoxes],
  );

  const runAction = async (action, payload) => {
    await onAction(candidate, action, payload);
    setIsOpen(false);
  };

  const handlePanelKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <>
      <S.ActionOptionsToggle
        ref={toggleRef}
        type="button"
        aria-label={`More options for ${itemName}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={busy}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">•••</span>
      </S.ActionOptionsToggle>

      {isOpen ? (
        <S.ActionOptionsPanel
          id={panelId}
          role="region"
          aria-label={`Workflow options for ${itemName}`}
          onKeyDown={handlePanelKeyDown}
        >
          <S.ActionOptionsHeader>
            <span>Options</span>
            <small>Reroute or reopen this decision</small>
          </S.ActionOptionsHeader>

          <S.ActionOptionsFields>
            <S.ActionOptionsField>
              <span>Exit route</span>
              <CustomSelect
                value={route}
                options={ROUTE_OPTIONS}
                onChange={setRoute}
                ariaLabel={`Exit route for ${itemName}`}
                disabled={busy || routingLocked}
                tone="#f08a7b"
                variant="prism"
              />
            </S.ActionOptionsField>

            {['donate', 'sell'].includes(route) ? (
              <S.ActionOptionsField>
                <span>Staging destination</span>
                <CustomSelect
                  value={boxId}
                  options={stagingOptions}
                  onChange={setBoxId}
                  ariaLabel={`Staging destination for ${itemName}`}
                  disabled={busy || routingLocked}
                  tone="#a7b6ff"
                  variant="prism"
                />
              </S.ActionOptionsField>
            ) : null}
          </S.ActionOptionsFields>

          <S.ActionOptionsApply
            type="button"
            disabled={busy || routingLocked || route === currentRoute}
            onClick={() => runAction('reroute', { route, boxId })}
          >
            Update plan
          </S.ActionOptionsApply>

          <S.ActionOptionsSecondary>
            <S.ActionSecondaryButton
              type="button"
              disabled={busy}
              onClick={() => runAction('restore')}
            >
              Restore Keep
            </S.ActionSecondaryButton>
            <S.ActionSecondaryButton
              type="button"
              disabled={busy}
              onClick={() => runAction('reopen')}
            >
              Fresh vote
            </S.ActionSecondaryButton>
          </S.ActionOptionsSecondary>
        </S.ActionOptionsPanel>
      ) : null}
    </>
  );
}
