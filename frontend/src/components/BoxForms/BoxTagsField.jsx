import React, { useState } from 'react';
import * as S from './BoxEditForm.styles';

export default function BoxTagsField({ tags, setTags, TagInputComponent }) {
  const [tagDraft, setTagDraft] = useState('');

  const addTag = () => {
    const t = (tagDraft || '').trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft('');
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <S.Field style={{ marginTop: 10 }}>
      <S.Label>Tags</S.Label>
      {TagInputComponent ? (
        <TagInputComponent value={tags} onChange={setTags} />
      ) : (
        <S.TagWrap>
          <S.TagList>
            {tags.map((t) => (
              <S.TagChip key={t}>
                {t}
                <S.RemoveX
                  type="button"
                  onClick={() => removeTag(t)}
                  aria-label={`Remove ${t}`}
                >
                  ×
                </S.RemoveX>
              </S.TagChip>
            ))}
            <S.TagAdder
              placeholder="Add tag and press Enter"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
            />
          </S.TagList>
        </S.TagWrap>
      )}
    </S.Field>
  );
}
