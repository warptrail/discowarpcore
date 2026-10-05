import React, { useId, useState } from 'react';
import * as S from './BoxEditForm.styles';

export default function BoxTagsField({
  tags,
  setTags,
  TagInputComponent,
  compact = false,
  inline = false,
  full = false,
}) {
  const [tagDraft, setTagDraft] = useState('');
  const tagInputId = useId();

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
    <S.Field style={{ marginTop: inline ? 0 : (compact ? 6 : 10) }} $compact={compact} $full={full}>
      <S.Label htmlFor={tagInputId} $compact={compact}>Tags</S.Label>
      {TagInputComponent ? (
        <TagInputComponent id={tagInputId} aria-label="Box tags" value={tags} onChange={setTags} />
      ) : (
        <S.TagWrap $compact={compact}>
          <S.TagList $compact={compact}>
            {tags.map((t) => (
              <S.TagChip key={t} $compact={compact}>
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
              id={tagInputId}
              aria-label="Add a box tag"
              placeholder="Add tag and press Enter"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              $compact={compact}
            />
          </S.TagList>
        </S.TagWrap>
      )}
    </S.Field>
  );
}
