import { useEffect, useMemo, useState } from 'react';

import DeclutterDepartureSheet from './DeclutterDepartureSheet';
import DeclutterGlyph from './DeclutterGlyph';
import DeclutterDestinationPicker from './DeclutterDestinationPicker';
import * as A from './DeclutterActionsPanel.styles';

const ROUTE_OPTIONS = [
  { value: 'discard', label: 'Trash', icon: 'toss' },
  { value: 'donate', label: 'Donate', icon: 'donate' },
  { value: 'sell', label: 'Sell', icon: 'sell' },
  { value: 'gift', label: 'Gift', icon: 'gift' },
];

const COMPLETION_LABELS = { discard:'Mark trashed',donate:'Mark donated',sell:'Mark sold',gift:'Mark gifted' };
const COMPLETION_DISPOSITIONS = { discard:'trashed',donate:'donated',sell:'sold',gift:'gifted' };

export default function DeclutterExitControls({
  candidate,
  itemName,
  item,
  currentRoute,
  player,
  stagingBoxes = [],
  busy,
  onAction,
}) {
  const [route, setRoute] = useState(
    currentRoute === 'needs_routing' ? 'discard' : currentRoute,
  );
  const [departureOpen,setDepartureOpen] = useState(false);
  const [boxId, setBoxId] = useState('__leave__');
  const routingLocked = currentRoute === 'needs_routing' && player !== 'laserfox';

  useEffect(() => {
    setRoute(currentRoute === 'needs_routing' ? 'discard' : currentRoute);
    setBoxId('__leave__');
  }, [currentRoute]);

  const compatibleBoxes = useMemo(
    () => stagingBoxes.filter((box) => (
      box.declutterPurpose === ({discard:'discard_staging',donate:'donation_staging',sell:'sale_staging',gift:'gift_staging'}[route])
    )),
    [route, stagingBoxes],
  );

  const needsStaging = ['discard','donate','sell','gift'].includes(route);
  const hasChanges = route !== currentRoute || (needsStaging && boxId !== '__leave__');
  const discardDraft = () => {
    setRoute(currentRoute === 'needs_routing' ? 'discard' : currentRoute);
    setBoxId('__leave__');
  };

  return <A.Controls aria-label={`Exit controls for ${itemName}`}>
    {needsStaging ? <DeclutterDestinationPicker item={item} route={route} boxId={boxId} onSelect={setBoxId}
      stagingBoxes={stagingBoxes} disabled={busy || routingLocked} /> : null}

    <A.RouteRail role="group" aria-label={`Exit route for ${itemName}`}>
      {ROUTE_OPTIONS.map(option=><A.RouteChoice key={option.value} type="button" $route={option.value}
        aria-label={`Plan ${option.label} for ${itemName}`} aria-pressed={route===option.value}
        disabled={busy || routingLocked} onClick={()=>{setRoute(option.value);setBoxId('__leave__');}}>
        <DeclutterGlyph name={option.icon} /><span>{option.label}</span>
      </A.RouteChoice>)}
    </A.RouteRail>

    {hasChanges && !routingLocked ? <A.Draft role="group" aria-label="Unsaved exit plan">
      <div role="status">
        <small>Unsaved plan</small>
        <strong>{ROUTE_OPTIONS.find(option=>option.value===route)?.label}{needsStaging
          ? ` · ${boxId==='__leave__' ? 'Current location' : compatibleBoxes.find(box=>box.id===boxId)?.label || 'Staging box'}`
          : ''}</strong>
      </div>
      <div>
        <A.CancelPlan type="button" disabled={busy} onClick={discardDraft}>
          <DeclutterGlyph name="close" />Cancel
        </A.CancelPlan>
        <A.Apply type="button" disabled={busy} onClick={()=>onAction(candidate,'reroute',{
          route,boxId:boxId==='__leave__' ? '' : boxId,leaveInPlace:boxId==='__leave__',
        })}><DeclutterGlyph name="check" />{busy ? 'Applying…' : 'Apply plan'}</A.Apply>
      </div>
    </A.Draft> : null}
    {routingLocked ? <A.ScopeNote>Laserfox chooses the exit route for this split decision.</A.ScopeNote> : null}

    <A.Commands>
      <A.Complete type="button" $route={currentRoute} disabled={busy || hasChanges || !COMPLETION_DISPOSITIONS[currentRoute]}
        onClick={()=>['sell','gift'].includes(currentRoute) ? setDepartureOpen(true)
          : onAction(candidate,'complete',{disposition:COMPLETION_DISPOSITIONS[currentRoute]})}>
        <DeclutterGlyph name={currentRoute==='discard' ? 'toss' : currentRoute} />
        {busy ? 'Working…' : COMPLETION_LABELS[currentRoute] || 'Choose a route'}
      </A.Complete>
      <A.Command type="button" disabled={busy} onClick={()=>onAction(candidate,'restore')}>
        <DeclutterGlyph name="keep" />Restore Keep
      </A.Command>
      <A.Command type="button" disabled={busy} onClick={()=>onAction(candidate,'reopen')}>
        <DeclutterGlyph name="review" />Fresh vote
      </A.Command>
    </A.Commands>
    {departureOpen ? <DeclutterDepartureSheet candidate={candidate} onClose={()=>setDepartureOpen(false)}
      onConfirm={payload=>onAction(candidate,'complete',payload)} /> : null}
  </A.Controls>;
}
