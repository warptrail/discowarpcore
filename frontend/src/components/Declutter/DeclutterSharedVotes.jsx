import * as D from './DeclutterDiscussion.styles';
import { getVotePresentationMeta } from './declutterUtils';

export default function DeclutterSharedVotes({ votes }) {
  return <D.Votes aria-label="Original individual votes">
    {[
      { key:'discofish', name:'Discofish', icon:'🐟' },
      { key:'laserfox', name:'Laserfox', icon:'🦊' },
    ].map(({ key, name, icon }) => {
      const meta = getVotePresentationMeta(votes?.[key]);
      return <D.Vote key={key} $tone={meta.tone}>
        <span aria-hidden="true">{icon}</span>
        <div><small>{name}</small><strong>{meta.label}</strong></div>
      </D.Vote>;
    })}
  </D.Votes>;
}
