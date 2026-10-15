import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Toast from '../Toast/Toast';
import ConsoleMessageSlot from '../Toast/ConsoleMessageSlot';
import { useHouseholdProfile } from '../HouseholdProfile/HouseholdProfileContext';
import DeclutterGlyph from './DeclutterGlyph';
import { DECLUTTER_OVERVIEW_EVENT, getDeclutterOverview } from './declutterOverview';

const Console = styled.section`
  min-width:0; background:var(--dw-background); border-radius:8px;
`;
const Overview = styled.div`
  display:flex; align-items:center; flex-wrap:wrap; gap:6px 16px; min-height:44px; padding:8px 10px;
  color:var(--dw-text-secondary); font:400 .8rem/1.45 var(--dw-font-ui);
  > strong { display:flex; align-items:center; gap:7px; color:var(--dw-text); font-weight:600; }
  svg { color:var(--dw-cyan); width:18px; height:18px; }
  > small { margin-left:auto; color:var(--dw-text-secondary); font-size:.75rem; }
  @media(max-width:540px) { gap:4px 12px; > small { margin-left:0; } }
`;
const Counts = styled.div`
  display:flex; flex-wrap:wrap; gap:5px 14px;
  span { white-space:nowrap; }
  b { color:var(--dw-cyan); font:500 .8rem/1.4 var(--dw-font-data); margin-right:4px; }
`;

export default function DeclutterConsoleLog({ toast, consoleMessage, onClose }) {
  const [snapshot,setSnapshot]=useState(getDeclutterOverview);
  const { profileId,profile }=useHouseholdProfile();
  useEffect(()=>{
    const update=event=>setSnapshot(event.detail);
    window.addEventListener(DECLUTTER_OVERVIEW_EVENT,update);
    return ()=>window.removeEventListener(DECLUTTER_OVERVIEW_EVENT,update);
  },[]);
  const current=snapshot?.player===profileId ? snapshot : null;
  const dismissible=toast && toast.dismissible!==false && toast.id!=='item-page-actions'
    && !String(toast.id || '').startsWith('edit-item-actions:') && !String(toast.id || '').startsWith('edit-item-field:');
  return <Console aria-label="Declutter console log">
    {toast ? <Toast {...toast} headerMounted open onClose={dismissible ? onClose : undefined}
      presentation={!toast.presentation || toast.presentation==='default' ? 'console-log' : toast.presentation} />
      : consoleMessage?.active ? <ConsoleMessageSlot message={consoleMessage} />
      : <Overview role="status" aria-live="polite">
        <strong><DeclutterGlyph name="review" />Declutter overview</strong>
        {profileId && current && !current.loading ? <Counts>
          <span><b>{current.review}</b>to review</span><span><b>{current.discussion}</b>to discuss</span>
          <span><b>{current.actions}</b>to leave</span>
          {current.waiting ? <span><b>{current.waiting}</b>waiting on partner</span> : null}
        </Counts> : null}
        <small>{!profileId ? 'Choose a profile to begin' : current?.error ? 'Deck needs attention'
          : current?.loading ? 'Loading shared deck…' : current ? `Using ${profile?.label || profileId} · Deck is current` : 'Shared decisions and departure updates'}</small>
      </Overview>}
  </Console>;
}
