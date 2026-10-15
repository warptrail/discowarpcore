import { useEffect, useMemo, useRef, useState } from 'react';

import * as D from './DeclutterDiscussion.styles';
import DeclutterGlyph from './DeclutterGlyph';
import DeclutterSharedVotes from './DeclutterSharedVotes';
import useDialogFocus from '../../hooks/useDialogFocus';
import { getDeclutterItemTheme } from './declutterItemTheme';
import {
  getItemBoxLabel,
  getItemLocationLabel,
  getItemName,
  getSessionItemItem,
  getVotePresentationChoice,
} from './declutterUtils';

const FINAL_CHOICES = [
  { value: 'keep', label: 'Keep', detail: 'Keep it in the household.' },
  { value: 'toss', label: 'Toss', detail: 'Approve a trash exit; confirm departure in Actions.' },
  { value: 'donate', label: 'Donate', detail: 'Approve it; choose placement in Actions.' },
  { value: 'sell', label: 'Sell', detail: 'Approve it; choose placement in Actions.' },
  { value: 'gift', label: 'Gift', detail: 'Keep it active until it is given.' },
];

function inferRecommendation(candidate) {
  if (candidate?.recommendedDiscussionChoice) return candidate.recommendedDiscussionChoice;
  const first = getVotePresentationChoice(candidate?.votes?.discofish);
  const second = getVotePresentationChoice(candidate?.votes?.laserfox);
  if (first === 'unsure' && second === 'unsure') return 'keep';
  if (first === 'unsure') return second;
  if (second === 'unsure') return first;
  if (first === second) return first;
  const pair = new Set([first, second]);
  if (pair.has('toss') && pair.size === 2) {
    return [first, second].find((choice) => !['toss', 'unsure'].includes(choice)) || 'toss';
  }
  return '';
}

export default function DeclutterDiscussionSheet({
  candidate,
  saving = false,
  error = '',
  onClose,
  onResolve,
  onReopen,
}) {
  const recommendation = useMemo(() => inferRecommendation(candidate), [candidate]);
  const [choice, setChoice] = useState(recommendation);
  const [notes, setNotes] = useState('');
  const sheetRef = useRef(null);
  const item = getSessionItemItem(candidate);

  useEffect(() => {
    setChoice(recommendation);
    setNotes('');
  }, [candidate?.id, recommendation]);

  useDialogFocus(sheetRef, () => { if (!saving) onClose?.(); }, Boolean(candidate),
    'nav[aria-label="Declutter workspaces"] button[aria-pressed="true"]');

  if (!candidate) return null;
  const selected = FINAL_CHOICES.find((entry) => entry.value === choice);
  const recommendationMeta = FINAL_CHOICES.find((entry) => entry.value === recommendation);

  return (
    <D.Scrim style={getDeclutterItemTheme(item)} onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose?.();
    }}>
      <D.Sheet ref={sheetRef} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby="discussion-sheet-title">
        <D.SheetHeader>
          <div>
            <D.Kicker>SHARED DECISION · BOTH PRESENT</D.Kicker>
            <h2 id="discussion-sheet-title">{getItemName(item)}</h2>
            <p>{getItemBoxLabel(item)} · {getItemLocationLabel(item) || 'Location not set'}</p>
          </div>
          <D.Close type="button" onClick={onClose} aria-label="Close shared decision" disabled={saving}>×</D.Close>
        </D.SheetHeader>
        <D.Body>
          <D.Section><span>Original votes</span><DeclutterSharedVotes votes={candidate.votes} /></D.Section>
          <D.Recommendation>
            <small>Suggested outcome</small>
            <strong>{recommendationMeta ? recommendationMeta.label : 'No automatic winner'}</strong>
            <span>{recommendationMeta
              ? 'Based on your original votes. Choose a different outcome together if needed.'
              : 'Choose the final household outcome together.'}</span>
          </D.Recommendation>
          <D.Section>
            <span id="final-call-label">Final call</span>
            <D.Choices role="group" aria-labelledby="final-call-label">
              {FINAL_CHOICES.map((entry) => (
                <D.Choice key={entry.value} type="button" $tone={entry.value}
                  aria-pressed={choice === entry.value} onClick={() => setChoice(entry.value)} disabled={saving}>
                  <DeclutterGlyph name={entry.value} /><span>{entry.label}</span>
                </D.Choice>
              ))}
            </D.Choices>
            <p>{selected?.detail || 'Select an outcome, then confirm it below.'}</p>
          </D.Section>
          <D.Notes>
            <span>Joint note <small>optional</small></span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000}
              placeholder="What changed your minds?" disabled={saving} />
          </D.Notes>
          {error ? <D.Error role="alert"><strong>Final call was not saved</strong><span>{error}</span></D.Error> : null}
        </D.Body>
        <D.Footer>
          <D.Confirm type="button" $tone={choice || 'pending'} disabled={!choice || saving}
            onClick={() => onResolve?.({ choice, notes })}>
            {saving ? 'Saving final call…' : selected ? `Confirm ${selected.label}` : 'Choose a final call'}
          </D.Confirm>
          <D.Reopen type="button" disabled={saving} onClick={onReopen}>Vote separately again</D.Reopen>
        </D.Footer>
      </D.Sheet>
    </D.Scrim>
  );
}
