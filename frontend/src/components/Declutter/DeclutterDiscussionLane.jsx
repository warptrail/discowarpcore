import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as A from './DeclutterActionsPanel.styles';
import * as D from './DeclutterDiscussion.styles';
import * as S from './Declutter.styles';
import DeclutterGlyph from './DeclutterGlyph';
import DeclutterSharedVotes from './DeclutterSharedVotes';
import { getDeclutterItemTheme } from './declutterItemTheme';
import {
  getItemCategoryLabel, getItemLocationLabel, getItemName,
  getItemPreviewImageUrl, getSessionItemItem,
} from './declutterUtils';

function DiscussionCard({ candidate, busy, onResolve }) {
  const item = getSessionItemItem(candidate);
  const imageUrl = getItemPreviewImageUrl(item);
  const [failedImage, setFailedImage] = useState('');
  const box = item?.box && typeof item.box === 'object' ? item.box : null;
  const boxId = String(box?.box_id || '').trim();
  return <A.Card style={getDeclutterItemTheme(item)}>
    <D.Identity>
      <D.Photo>
        {imageUrl && failedImage !== imageUrl
          ? <img src={imageUrl} alt="" loading="lazy" onError={()=>setFailedImage(imageUrl)} />
          : <DeclutterGlyph name="photo" />}
      </D.Photo>
      <div>
        {item?.id ? <Link to={`/items/${encodeURIComponent(item.id)}`}>{getItemName(item)}</Link>
          : <strong>{getItemName(item)}</strong>}
        <small>{getItemCategoryLabel(item) || 'Uncategorized'}</small>
        <D.Context>
          {boxId ? <Link to={`/boxes/${encodeURIComponent(boxId)}`}><span>#{boxId}</span>{box.label || 'Box'}</Link>
            : 'No box assigned'}
        </D.Context>
        <small>{getItemLocationLabel(item) || 'Location not set'}</small>
      </div>
    </D.Identity>
    <DeclutterSharedVotes votes={candidate.votes} />
    {candidate.notes || candidate.sharedNotes ? <D.NotesDisclosure>
      <summary>Decision notes</summary>
      {candidate.notes ? <p>Your private note: {candidate.notes}</p> : null}
      {candidate.sharedNotes ? <p>Shared note: {candidate.sharedNotes}</p> : null}
    </D.NotesDisclosure> : null}
    <D.Resolve type="button" disabled={busy} onClick={()=>onResolve?.(candidate)}>
      {busy ? 'Saving final call…' : 'Resolve together'}<DeclutterGlyph name="discussion" />
    </D.Resolve>
  </A.Card>;
}

export default function DeclutterDiscussionLane({ candidates = [], busyCandidateId = '', onResolve }) {
  return <A.Console aria-labelledby="discuss-heading">
    <A.Header>
      <div><D.Kicker>SHARED DECISIONS</D.Kicker><h2 id="discuss-heading">Talk it out</h2>
        <p>Compare your votes, then make the final call together.</p></div>
      <span>{candidates.length} item{candidates.length===1?'':'s'}</span>
    </A.Header>
    {candidates.length ? <A.Grid>{candidates.map(candidate=><DiscussionCard key={candidate.id}
      candidate={candidate} busy={busyCandidateId===candidate.id} onResolve={onResolve} />)}</A.Grid>
      : <S.StatusPanel>No split votes right now.</S.StatusPanel>}
  </A.Console>;
}
