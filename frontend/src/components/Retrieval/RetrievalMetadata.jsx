import { getItemFieldDescriptor } from '../ItemFieldEditor/itemFieldRegistry';
import RetrievalEditableField from './RetrievalEditableField';
import * as S from './RetrievalItemPanel.styles';
import TagLinks from '../TagLinks';

export default function RetrievalMetadata({ item, pages, detailResource }) {
  if (detailResource?.status !== 'ready' || !item) return <S.Status role={detailResource?.status === 'error' ? 'alert' : 'status'}>
    {detailResource?.status === 'error' ? <>{detailResource.error || 'The full item record could not be loaded.'}<br />
      <S.Button type="button" onClick={detailResource.retry}>Retry item details</S.Button></> : 'Loading the full item record…'}
  </S.Status>;

  return <>
    <S.Hint>Full metadata · Select a value to update it here.</S.Hint>
    {pages.map((page) => <S.Group key={page.key} aria-label={`${page.label} metadata`}>
      <h3>{page.label}</h3>
      <S.Fields>{page.rows.map(({ label, value, fieldKey }) => <div key={label}>
        <dt>{label}</dt><dd>{fieldKey === 'tags' ? <>
          <TagLinks tags={item.tags} />
          <RetrievalEditableField fieldKey="tags" variant="action">Edit tags</RetrievalEditableField>
        </> : <RetrievalEditableField fieldKey={fieldKey} label={label} variant="block">{value ?? '—'}</RetrievalEditableField>}</dd>
      </div>)}</S.Fields>
      {page.key === 'placement' && !getItemFieldDescriptor('location', item)
        ? <S.Hint>Location belongs to the box. Open the box to update its placement.</S.Hint> : null}
    </S.Group>)}
  </>;
}
