import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid rgba(70, 126, 139, 0.45);
  border-radius: 10px;
  background: rgba(11, 20, 25, 0.78);
  padding: 0.58rem;
  display: grid;
  gap: 0.54rem;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a6c4cf;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const CloseButton = styled.button`
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(123, 162, 177, 0.55);
  background: rgba(15, 30, 37, 0.92);
  color: #d3e8f1;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.6rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.42rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 0.26rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9fc1cd;
`;

const Input = styled.input`
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(90, 138, 152, 0.5);
  background: rgba(9, 17, 22, 0.95);
  color: #e8f1f6;
  font-size: 0.9rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(131, 208, 185, 0.92);
    box-shadow: 0 0 0 2px rgba(82, 196, 159, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(90, 138, 152, 0.5);
  background: rgba(9, 17, 22, 0.95);
  color: #e8f1f6;
  font-size: 0.9rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(131, 208, 185, 0.92);
    box-shadow: 0 0 0 2px rgba(82, 196, 159, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Results = styled.div`
  display: grid;
  gap: 0.42rem;
`;

const ResultButton = styled.button`
  width: 100%;
  min-height: 74px;
  border-radius: 10px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(124, 222, 194, 0.82)' : 'rgba(84, 133, 150, 0.52)')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(21, 47, 44, 0.96) 0%, rgba(14, 35, 31, 0.96) 100%)'
      : 'rgba(9, 17, 23, 0.9)'};
  color: #e5f2f6;
  padding: 0.48rem 0.54rem;
  text-align: left;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 0.54rem;
  align-items: center;
  cursor: pointer;

  &:hover {
    filter: brightness(1.06);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: calc(${MOBILE_CONTROL_MIN_HEIGHT} + 18px);
  }
`;

const Thumb = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 8px;
  border: 1px solid rgba(111, 162, 177, 0.48);
  overflow: hidden;
  background: rgba(9, 17, 23, 0.95);
  display: grid;
  place-items: center;
  color: #8fb2be;
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Identity = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.2rem;
`;

const Name = styled.div`
  font-size: 0.9rem;
  color: #edf8ff;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  color: #9fc2cf;
  font-size: 0.73rem;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.24rem;
`;

const Tag = styled.span`
  border-radius: 999px;
  border: 1px solid rgba(88, 145, 161, 0.5);
  background: rgba(10, 24, 31, 0.86);
  color: #b8d4df;
  font-size: 0.66rem;
  line-height: 1;
  padding: 0.2rem 0.38rem;
`;

const EmptyState = styled.div`
  border: 1px dashed rgba(93, 138, 153, 0.5);
  border-radius: 9px;
  padding: 0.52rem;
  color: #9fc2ce;
  font-size: 0.75rem;
`;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getBoxImageUrl(box) {
  return (
    box?.image?.thumb?.url ||
    box?.image?.display?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    ''
  );
}

function getUniqueValues(list, mapValue) {
  const values = new Set();
  for (const entry of list) {
    const next = mapValue(entry);
    if (!next) continue;
    values.add(String(next).trim());
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export default function IntakeBoxSelectorPanel({
  boxes = [],
  selectedBoxId = '',
  onSelectBox,
  onClose,
  title = 'Select Intake Box',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const locationOptions = useMemo(
    () => getUniqueValues(boxes, (box) => box?.location),
    [boxes],
  );

  const tagOptions = useMemo(() => {
    const values = new Set();
    for (const box of boxes) {
      const tags = Array.isArray(box?.tags) ? box.tags : [];
      for (const tag of tags) {
        const normalized = String(tag || '').trim();
        if (normalized) values.add(normalized);
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [boxes]);

  const filteredBoxes = useMemo(() => {
    const search = normalize(searchTerm);
    const location = normalize(locationFilter);
    const tag = normalize(tagFilter);

    return boxes.filter((box) => {
      const name = normalize(box?.label);
      const boxId = normalize(box?.box_id);
      const boxGroup = normalize(box?.group);
      const boxLocation = normalize(box?.location);
      const tags = Array.isArray(box?.tags) ? box.tags.map(normalize) : [];

      if (search) {
        const haystack = [name, boxId, boxGroup, boxLocation, ...tags].join(' ');
        if (!haystack.includes(search)) return false;
      }

      if (location && boxLocation !== location) return false;
      if (tag && !tags.includes(tag)) return false;

      return true;
    });
  }, [boxes, locationFilter, searchTerm, tagFilter]);

  return (
    <Panel>
      <Header>
        <Title>{title}</Title>
        <CloseButton type="button" onClick={onClose}>
          Close
        </CloseButton>
      </Header>

      <FilterGrid>
        <Field>
          <Label htmlFor="intake-box-search">Search</Label>
          <Input
            id="intake-box-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Name, box #, group, location, tag"
          />
        </Field>

        <Field>
          <Label htmlFor="intake-box-location-filter">Location</Label>
          <Select
            id="intake-box-location-filter"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
          >
            <option value="">All locations</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label htmlFor="intake-box-tag-filter">Tag</Label>
          <Select
            id="intake-box-tag-filter"
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
          >
            <option value="">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        </Field>
      </FilterGrid>

      <Results>
        {filteredBoxes.length === 0 ? (
          <EmptyState>No boxes match your filters.</EmptyState>
        ) : (
          filteredBoxes.map((box) => {
            const key = String(box?._id || '');
            const imageUrl = getBoxImageUrl(box);
            const tags = Array.isArray(box?.tags) ? box.tags : [];

            return (
              <ResultButton
                key={key || `${box?.box_id || 'box'}-${box?.label || 'unnamed'}`}
                type="button"
                $active={key === String(selectedBoxId || '')}
                onClick={() => onSelectBox?.(key)}
              >
                <Thumb>
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
                </Thumb>

                <Identity>
                  <Name>{box?.label || 'Unnamed Box'}</Name>
                  <Meta>Box #{box?.box_id || '---'}</Meta>
                  {box?.group ? <Meta>Group: {box.group}</Meta> : null}
                  {box?.location ? <Meta>Location: {box.location}</Meta> : null}
                  {tags.length ? (
                    <TagRow>
                      {tags.slice(0, 4).map((tag) => (
                        <Tag key={`${key}-${tag}`}>{tag}</Tag>
                      ))}
                    </TagRow>
                  ) : null}
                </Identity>
              </ResultButton>
            );
          })
        )}
      </Results>
    </Panel>
  );
}
