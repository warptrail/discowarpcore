import MarkdownContent from '../RichText/MarkdownContent';
import * as S from './FinderItemFocus.styles';

export default function FinderItemNotes({ notes, query, titleAction }) {
  const text = String(notes ?? '').trim();
  return <S.NotesPane>
    {titleAction ? <S.NotesHeading><S.NotesTitle>Notes</S.NotesTitle>{titleAction}</S.NotesHeading>
      : <S.NotesTitle>Notes</S.NotesTitle>}
    {text ? <S.NoteWindow role="region" aria-label="Item notes" tabIndex={0}>
      <MarkdownContent text={text} query={query} />
    </S.NoteWindow> : <S.RecordedNote>No notes recorded for this item.</S.RecordedNote>}
  </S.NotesPane>;
}
