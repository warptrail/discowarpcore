import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getItemHomeHref } from '../../api/itemDetails';
import { MOBILE_BREAKPOINT, MOBILE_FONT_SM, MOBILE_FONT_XS } from '../../styles/tokens';
import { formatItemCategory } from '../../util/itemCategories';
import { pickImageUrl } from './intakeImageHelpers';

const Panel = styled.section`
  border: 1px solid rgba(83, 131, 177, 0.44);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(12, 20, 31, 0.93) 0%, rgba(9, 15, 24, 0.96) 100%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.56rem 0.7rem;
  border-bottom: 1px solid rgba(73, 110, 148, 0.42);
  background: linear-gradient(90deg, rgba(86, 142, 202, 0.18) 0%, rgba(86, 142, 202, 0) 56%);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d7e8fb;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Count = styled.span`
  color: #a8c1da;
  font-size: 0.72rem;
`;

const Viewport = styled.div`
  max-height: min(40vh, 320px);
  overflow: auto;
  padding: 0.48rem;
  display: grid;
  gap: 0.34rem;
`;

const Row = styled.div`
  border: 1px solid rgba(72, 109, 151, 0.44);
  border-radius: 9px;
  background: rgba(10, 17, 27, 0.88);
  padding: 0.34rem 0.42rem;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 0.46rem;
  align-items: center;
`;

const Thumb = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 7px;
  border: 1px solid rgba(88, 129, 173, 0.5);
  overflow: hidden;
  background: rgba(12, 19, 30, 0.94);
  display: grid;
  place-items: center;
  color: #99b6d4;
  font-size: 0.6rem;
  text-transform: uppercase;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Body = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.14rem;
`;

const NameLink = styled(Link)`
  color: #eaf4ff;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Name = styled.div`
  color: #eaf4ff;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  color: #a8c1da;
  font-size: 0.69rem;
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#f3c1c1' : '#9fb8d2')};
  font-size: 0.75rem;
  border: 1px dashed rgba(83, 121, 167, 0.45);
  border-radius: 8px;
  padding: 0.46rem 0.52rem;
`;

export default function IntakeCurrentBoxItemsPanel({
  currentBox,
  items = [],
  loading = false,
  error = '',
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <Panel>
      <Header>
        <Title>Current Box Items</Title>
        <Count>{safeItems.length}</Count>
      </Header>

      <Viewport>
        {!currentBox?._id ? (
          <StateText>Select or create a box to view its contents.</StateText>
        ) : null}

        {currentBox?._id && loading ? <StateText>Loading items…</StateText> : null}
        {currentBox?._id && !loading && error ? <StateText $error>{error}</StateText> : null}

        {currentBox?._id && !loading && !error && safeItems.length === 0 ? (
          <StateText>No items in this box yet.</StateText>
        ) : null}

        {currentBox?._id &&
          !loading &&
          !error &&
          safeItems.map((item) => {
            const imageUrl = pickImageUrl(item);
            const name = item?.name || 'Unnamed item';
            const quantity = item?.quantity ?? 1;
            const category = formatItemCategory(item?.category);

            return (
              <Row key={item?._id || `${name}-${item?.createdAt || ''}`}>
                <Thumb>
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
                </Thumb>

                <Body>
                  {item?._id ? (
                    <NameLink to={getItemHomeHref(item._id)}>{name}</NameLink>
                  ) : (
                    <Name>{name}</Name>
                  )}
                  <Meta>qty {quantity} • {category}</Meta>
                </Body>
              </Row>
            );
          })}
      </Viewport>
    </Panel>
  );
}
