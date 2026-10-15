import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import * as A from './DeclutterActionsPanel.styles';
import DeclutterGlyph from './DeclutterGlyph';
import { getDeclutterItemTheme } from './declutterItemTheme';
import { API_BASE } from '../../api/API_BASE';

const PURPOSE = { discard:'discard_staging', donate:'donation_staging', sell:'sale_staging', gift:'gift_staging' };
const PURPOSE_LABEL = { discard:'trash staging', donate:'donation staging', sell:'sale staging', gift:'gift staging' };
const Panel = styled.section`
  display:grid; gap:8px; min-width:0; padding:10px; border:1px solid var(--dw-border-soft);
  border-radius:8px; background:var(--dw-background);
  label { display:grid; gap:5px; color:var(--dw-text-secondary); font:400 .75rem/1.4 var(--dw-font-ui); }
  input { min-width:0; width:100%; box-sizing:border-box; min-height:44px; padding:8px 10px;
    border:1px solid var(--dw-border-soft); border-radius:7px; background:var(--dw-background);
    color:var(--dw-text); font:400 .85rem/1.4 var(--dw-font-data); }
  input:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:-2px; }
  p { margin:0; color:var(--dw-text-secondary); font:400 .75rem/1.4 var(--dw-font-ui); overflow-wrap:anywhere; }
`;
const Links = styled.div`
  display:flex; flex-wrap:wrap; gap:0 10px; min-width:0;
  a { display:inline-flex; align-items:center; gap:4px; min-height:44px; max-width:100%;
    color:var(--box-neon); font:400 .72rem/1.35 var(--dw-font-ui); text-decoration:none; overflow-wrap:anywhere; }
  a:hover { text-decoration:underline; }
  a:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:2px; }
`;
const Trigger = styled(A.Destination)`
  width:100%; border-color:var(--box-neon); justify-content:flex-start;
  > span { flex:1; min-width:0; }
  > svg:last-child { margin-left:auto; }
`;
const Choices = styled.div`display:flex; flex-wrap:wrap; gap:4px; min-width:0;`;

const BoxNumber = styled.span`
  color:var(--box-neon); font:500 .8rem/1.35 var(--dw-font-data); white-space:nowrap;
`;
const BoxName = styled.span`color:var(--dw-text-secondary); font-family:var(--dw-font-ui);`;
function BoxLabel({ box, prefix = '' }) {
  return <span>{prefix ? `${prefix} ` : ''}<BoxNumber>#{box?.box_id}</BoxNumber>
    <BoxName> · {box?.label || 'Box'}</BoxName></span>;
}

export default function DeclutterDestinationPicker({ item, route, boxId, onSelect, stagingBoxes, disabled }) {
  const [open,setOpen] = useState(false);
  const [query,setQuery] = useState('');
  const [boxes,setBoxes] = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const id = useId();
  useEffect(()=>{
    if (!open) return undefined;
    inputRef.current?.focus();
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`${API_BASE}/api/boxes`,{signal:controller.signal}).then(async response=>{
      if (!response.ok) throw new Error('Could not load box IDs. Try reopening the picker.');
      const data = await response.json();
      const rows = Array.isArray(data) ? data : data.boxes || data.data;
      setBoxes(Array.isArray(rows) ? rows : []);
    }).catch(err=>{if (!controller.signal.aborted) setError(err.message);})
      .finally(()=>{if (!controller.signal.aborted) setLoading(false);});
    return ()=>controller.abort();
  },[open]);
  const all = [...new Map([...boxes,...stagingBoxes].map(box=>[String(box.id || box._id),box])).values()];
  const compatible = all.filter(box=>box.declutterPurpose===PURPOSE[route]);
  const marked = all.filter(box=>box.isGiftBox || Object.values(PURPOSE).includes(box.declutterPurpose));
  const selected = all.find(box=>String(box.id || box._id)===boxId);
  const normalized = query.trim().replace(/^#/,'');
  const match = all.find(box=>String(box.box_id)===normalized || (/^\d+$/.test(normalized) && String(box.box_id)===normalized.padStart(3,'0')));
  const choose = value=>{onSelect(value);setOpen(false);setQuery('');triggerRef.current?.focus();};
  return <A.Destinations>
    <div><Trigger style={getDeclutterItemTheme({box:boxId==='__leave__' ? item?.box : selected})} ref={triggerRef} type="button" aria-expanded={open} aria-controls={id} disabled={disabled}
      title={item?.box?.locationName || item?.location || undefined}
      onClick={()=>setOpen(value=>!value)}>
      <DeclutterGlyph name="box" />{boxId==='__leave__'
        ? item?.box?.box_id ? <BoxLabel box={item.box} prefix="Currently" /> : <span>Currently · No box assigned</span>
        : <BoxLabel box={selected} prefix="Move to" />}
      <DeclutterGlyph name="skip" />
    </Trigger></div>
    {open ? <Panel id={id} onKeyDown={event=>{if(event.key==='Escape') {event.stopPropagation();setOpen(false);triggerRef.current?.focus();}}}>
      <label>Box ID<input ref={inputRef} value={query} onChange={event=>setQuery(event.target.value)}
        placeholder="e.g. 007" autoComplete="off" disabled={disabled} /></label>
      {loading ? <p role="status">Loading box IDs…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {normalized && !loading ? match ? match.declutterPurpose===PURPOSE[route]
        ? <A.Destination style={getDeclutterItemTheme({box:match})} type="button" disabled={disabled} onClick={()=>choose(String(match.id || match._id))}><BoxLabel box={match} prefix="Use" /></A.Destination>
        : <p>#{match.box_id} is not marked for {PURPOSE_LABEL[route]}.</p>
        : <p>No box matches that ID.</p> : null}
      <Choices>
        <A.Destination type="button" disabled={disabled} aria-pressed={boxId==='__leave__'} onClick={()=>choose('__leave__')}>Keep current location</A.Destination>
        {compatible.map(box=><A.Destination key={String(box.id || box._id)} style={getDeclutterItemTheme({box})} type="button" disabled={disabled}
          aria-pressed={boxId===String(box.id || box._id)} onClick={()=>choose(String(box.id || box._id))}>
          <BoxLabel box={box} />
        </A.Destination>)}
      </Choices>
      <p>Staging &amp; gift boxes</p>
      <Links aria-label="Open staging and gift boxes">
        {marked.map(box=><Link key={String(box.id || box._id)} style={getDeclutterItemTheme({box})} to={`/boxes/${encodeURIComponent(box.box_id)}`}>
          <BoxLabel box={box} /> ↗
        </Link>)}
      </Links>
      {!loading && !marked.length ? <p>No marked boxes found.</p> : null}
    </Panel> : null}
  </A.Destinations>;
}
