import { Link } from 'react-router-dom';
import { formatDate } from './retrievalItemControlModel';
import * as S from './RetrievalItemPanel.styles';
import RetrievalEditableField from './RetrievalEditableField';
import { useRetrievalItemEditing } from './RetrievalItemEditingContext';

const EVENT_FIELDS = { used: 'usage-history', checked: 'check-history', maintained: 'maintenance-history', acquired: 'date-acquired' };
const HISTORIES = [['usage-history', 'Use history'], ['check-history', 'Check history'], ['maintenance-history', 'Care history']];

export default function RetrievalItemLog({ model, item, detailResource }) {
  const editing = useRetrievalItemEditing();
  return <>
    {item?.maintenanceNotes || editing?.canEdit('maintenance-notes') ? <S.Group><h3>Maintenance notes</h3>
      <RetrievalEditableField fieldKey="maintenance-notes" variant="block"><S.DescriptionText>{item?.maintenanceNotes || 'Add care notes'}</S.DescriptionText></RetrievalEditableField>
    </S.Group> : null}
    {model.logProvenance.length ? <S.Group><h3>Provenance</h3><S.Fields>{model.logProvenance.map((entry) =>
      <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.href ? <Link to={entry.href}>{entry.value}</Link> : entry.value}</dd></div>)}
    </S.Fields></S.Group> : null}
    <S.Group aria-label="Item activity history"><h3>Activity</h3>
      <S.InlineActions>{HISTORIES.filter(([key]) => editing?.canEdit(key)).map(([key, label]) =>
        <RetrievalEditableField key={key} fieldKey={key}>{label}</RetrievalEditableField>)}</S.InlineActions>
      {model.logEvents.length
      ? <S.Timeline>{model.logEvents.map((event) => <li key={event.key}><span>{event.label}</span>
        <RetrievalEditableField fieldKey={EVENT_FIELDS[event.tone]}><time dateTime={event.iso}>{formatDate(event.iso)}</time></RetrievalEditableField>
      </li>)}</S.Timeline>
      : <S.Hint role="status">{detailResource?.status === 'loading' ? 'Loading activity history…' : detailResource?.status === 'error' ? 'Activity history could not be loaded.' : 'No activity recorded yet.'}</S.Hint>}
    </S.Group>
    {model.externalLinks.length || editing?.canEdit('external-links') ? <S.Group>
      <S.SectionHeading><h3>References</h3><RetrievalEditableField fieldKey="external-links" variant="action" /></S.SectionHeading>
      {model.externalLinks.length ? <S.Fields>{model.externalLinks.map((link) =>
      <div key={`${link.label}-${link.url}`}><dt>{link.label}</dt><dd><a href={link.url} target="_blank" rel="noopener noreferrer">Open reference ↗</a></dd></div>)}
      </S.Fields> : <S.Hint>No references recorded.</S.Hint>}</S.Group> : null}
  </>;
}
