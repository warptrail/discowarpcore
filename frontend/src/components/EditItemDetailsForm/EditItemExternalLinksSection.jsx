import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';

const asText = (value) => (value == null ? '' : String(value));

export default function EditItemExternalLinksSection({
  links,
  onLinkChange,
  onAddLink,
  onRemoveLink,
}) {
  const rows = Array.isArray(links) ? links : [];

  return (
    <S.Field>
      <S.Label>External Links</S.Label>
      <S.FieldHint>
        Add manuals, product pages, manufacturer sites, and docs.
      </S.FieldHint>

      {rows.length ? (
        <S.LinkRows>
          {rows.map((row, index) => (
            <S.LinkRow key={`item-link-${index}`}>
              <S.Input
                type="text"
                value={asText(row?.label)}
                onChange={(event) =>
                  onLinkChange(index, 'label', event.target.value)
                }
                placeholder="Label"
                maxLength={80}
                aria-label={`Link ${index + 1} label`}
              />
              <S.Input
                type="url"
                value={asText(row?.url)}
                onChange={(event) =>
                  onLinkChange(index, 'url', event.target.value)
                }
                placeholder="https://example.com"
                inputMode="url"
                aria-label={`Link ${index + 1} URL`}
              />
              <S.LinkRemoveButton
                type="button"
                onClick={() => onRemoveLink(index)}
              >
                Remove
              </S.LinkRemoveButton>
            </S.LinkRow>
          ))}
        </S.LinkRows>
      ) : null}

      <S.AddInlineButton type="button" onClick={onAddLink}>
        + Add Link
      </S.AddInlineButton>
    </S.Field>
  );
}
