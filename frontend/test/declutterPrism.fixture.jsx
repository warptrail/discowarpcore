import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from '../src/styles/globalStyles';
import DeclutterDeckPage from '../src/components/Declutter/DeclutterDeckPage';
import DeclutterConsoleLog from '../src/components/Declutter/DeclutterConsoleLog';
import HouseholdProfileProvider from '../src/components/HouseholdProfile/HouseholdProfileProvider';
import HouseholdProfileSwitcher from '../src/components/HouseholdProfile/HouseholdProfileSwitcher';
import { ToastContext } from '../src/components/Toast';

// No fixture request reaches the actual API, including the reconciling deck GET.
const storage = new Map([['disco-warp-core:declutter-player','discofish']]);
Object.defineProperty(window, 'localStorage', { configurable:true, value:{
  getItem:key=>storage.get(key) ?? null, setItem:(key,value)=>storage.set(key,String(value)), removeItem:key=>storage.delete(key),
} });
const item = (id, boxId = '001') => ({ id, name:'Synthetic navigation instrument', category:'electronics',
  description:'Synthetic inventory used only to verify this interface.', tags:['fixture'], primaryOwnerName:'Discofish',
  box:boxId ? { box_id:boxId,label:'Equipment drawer',locationName:'Office · Storage · Top drawer' } : null,
});
const candidate = (id, entry, extra = {}) => ({ id,item:entry,deckState:'active',needsMyVote:true,
  decision:'pending',nominatedBy:'laserfox',votes:{discofish:{decision:'pending'},laserfox:{decision:'hidden'}},...extra });
let deck = {
  activeCandidates:[
    candidate('review-a',item('item-a'),{partnerHasVoted:true}),
    candidate('review-b',{...item('item-b','107'),name:'Synthetic instrument with a very long name and stored context that must remain readable at narrow widths',
      previewImageUrl:'data:image/png;base64,invalid',description:'A long description. '.repeat(28),tags:['fixture','a-long-tag-that-should-wrap-within-the-readable-card']}),
    candidate('waiting',item('item-waiting',null),{needsMyVote:false,votes:{discofish:{decision:'keep'},laserfox:{decision:'pending'}}}),
  ],
  discussionCandidates:[candidate('discuss',item('item-discuss','201'),{deckState:'discussion',needsMyVote:false,
    votes:{discofish:{decision:'keep'},laserfox:{decision:'donate'}}}),
    candidate('discuss-long',{...item('item-discuss-long','120'),name:'Synthetic instrument with a long name that must remain readable on a compact discussion card',previewImageUrl:'data:image/png;base64,invalid'},
      {deckState:'discussion',needsMyVote:false,notes:'A private fixture note.',sharedNotes:'A shared fixture note.',
        votes:{discofish:{decision:'release',exitPreference:'sell'},laserfox:{decision:'unsure'}}})],
  actionCandidates:[
    candidate('action',item('item-action','301'),{deckState:'action',stagingRoute:'donate',needsMyVote:false}),
    candidate('trash', {...item('item-trash','120'),name:'Synthetic duffel bag'}, {deckState:'action',stagingRoute:'gift',needsMyVote:false}),
    candidate('routing', {...item('item-routing',null),name:'Synthetic split decision'}, {deckState:'action',stagingRoute:'needs_routing',needsMyVote:false}),
  ],
  resolvedCandidates:[],counts:{active:3,discussion:2,action:3,resolved:0},
  metrics:{total:5,resolved:0,discofishReviewed:1,laserfoxReviewed:1},
};
let failNext = false;
let record = () => {};
window.fetch = async (input, options = {}) => {
  const url = new URL(String(input),location.origin);
  const json = (body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
  if (!options.method || options.method === 'GET') {
    if (url.pathname === '/api/boxes') return json([
      {id:'sale-box',box_id:'008',label:'Sale shelf',declutterPurpose:'sale_staging'},
      {id:'gift-box',box_id:'009',label:'Gift shelf',isGiftBox:true,declutterPurpose:'gift_staging'},
      {id:'ordinary',box_id:'120',label:'Regular storage',declutterPurpose:'standard'},
    ]);
    if (url.pathname === '/api/declutter-deck') return json(deck);
    if (url.pathname.endsWith('/actions/resources')) return json({stagingBoxes:[
      {id:'donation-box',box_id:'007',label:'Donation shelf',declutterPurpose:'donation_staging',declutterIsDefault:true},
      {id:'sale-box',box_id:'008',label:'Sale shelf',declutterPurpose:'sale_staging'},
    ]});
    return json({});
  }
  const body = JSON.parse(options.body || '{}');
  record({path:url.pathname,method:options.method,...body});
  if (failNext) { failNext = false; return json({error:'Synthetic save failed. Your note is still here.'},500); }
  const id = url.pathname.split('/').at(-2);
  if (url.pathname.includes('/actions/')) {
    const action = url.pathname.split('/').at(-1);
    const previous = deck.actionCandidates.find(entry=>entry.id===id);
    const updated = {...previous,stagingRoute:body.route || previous?.stagingRoute};
    deck = {...deck,actionCandidates:deck.actionCandidates.flatMap(entry=>entry.id!==id ? [entry]
      : action==='reroute' ? [updated] : [])};
    deck.counts={...deck.counts,action:deck.actionCandidates.length};
    return json({candidate:updated});
  }
  if (url.pathname.endsWith('/votes')) {
    deck = {...deck,activeCandidates:deck.activeCandidates.map(entry => entry.id === id
      ? {...entry,notes:body.notes,needsMyVote:false,votes:{...entry.votes,[body.player]:{decision:body.vote}}} : entry)};
    return json({candidate:deck.activeCandidates.find(entry=>entry.id===id)});
  }
  const previous = deck.discussionCandidates.find(entry=>entry.id===id);
  if (url.pathname.endsWith('/resolve-discussion') || url.pathname.endsWith('/reopen')) {
    const reopening = url.pathname.endsWith('/reopen');
    const updated = {...previous,sharedNotes:body.notes || '',
      deckState:reopening ? 'active' : body.choice==='keep' ? 'resolved' : 'action',
      resolution:body.choice==='keep' ? 'kept' : 'release_approved',finalDecision:body.choice};
    deck = {...deck,discussionCandidates:deck.discussionCandidates.filter(entry=>entry.id!==id)};
    const lane = reopening ? 'activeCandidates' : body.choice==='keep' ? 'resolvedCandidates' : 'actionCandidates';
    deck[lane]=[...deck[lane],updated];
    deck.counts={...deck.counts,discussion:deck.discussionCandidates.length,active:deck.activeCandidates.length,
      action:deck.actionCandidates.length,resolved:deck.resolvedCandidates.length};
    return json({candidate:updated});
  }
  return json({candidate:previous});
};

const Shell = styled.div`padding:16px; max-width:1500px; margin:auto; min-width:0;`;
const Header = styled.header`display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;
  font:400 .8rem/1.4 var(--dw-font-ui); color:var(--dw-text-muted);
  button { min-height:44px; padding:8px 12px; border:1px solid var(--dw-border); border-radius:6px; background:var(--dw-surface); color:var(--dw-cyan); }`;
const Log = styled.pre`white-space:pre-wrap; overflow-wrap:anywhere; color:var(--dw-text-secondary); font-size:12px;`;
function RouteReadout() { const route = useLocation(); return <output aria-label="Fixture route">{route.pathname}{route.search}</output>; }
export default function Fixture() {
  const [requests,setRequests] = useState([]);
  const [toast,setToast] = useState(null);
  record = request=>setRequests(current=>[...current,request]);
  const context = useMemo(()=>({showToast:setToast}),[]);
  return <MemoryRouter initialEntries={['/declutter']}><HouseholdProfileProvider><ToastContext.Provider value={context}><GlobalStyles /><Shell>
    <Header><HouseholdProfileSwitcher compact /><span>Synthetic inventory only · all requests mocked</span><button type="button" onClick={()=>{failNext=true;}}>Fail next save</button><RouteReadout /></Header>
    <DeclutterConsoleLog toast={toast} onClose={()=>setToast(null)} />
    <DeclutterDeckPage />
    <Log aria-label="Fixture requests">{JSON.stringify(requests)}</Log>
  </Shell></ToastContext.Provider></HouseholdProfileProvider></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
