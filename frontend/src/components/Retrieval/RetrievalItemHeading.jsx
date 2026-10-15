import { buildRetrievalItemAnswer } from './retrievalItemControlModel';
import * as S from './RetrievalItemPanel.styles';

export default function RetrievalItemHeading({ item, detail, sectionKey = 'overview' }) {
  const answer = buildRetrievalItemAnswer(item, detail);
  const showBox = sectionKey !== 'overview' && !answer.unboxed && answer.boxId;

  return <S.HeadingLine>
    <S.HeadingName title={answer.name}>{answer.name}</S.HeadingName>
    {showBox ? <S.HeadingBox title={`Box ${answer.boxId}`} aria-label={`Box ${answer.boxId}`}>
      #{answer.boxId}
    </S.HeadingBox> : null}
  </S.HeadingLine>;
}
