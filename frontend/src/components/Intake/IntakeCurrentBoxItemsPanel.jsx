import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getItemHomeHref } from '../../api/itemDetails';
import { MOBILE_BREAKPOINT, MOBILE_FONT_SM, MOBILE_FONT_XS } from '../../styles/tokens';
import { formatItemCategory } from '../../util/itemCategories';
import { getItemThumbnailUrl } from '../../util/itemImage';

const Panel = styled.section`
  min-width: 0;
  border-top: 1px solid rgba(var(--box-primary-rgb), 0.34);
  border-bottom: 1px solid rgba(var(--box-primary-rgb), 0.28);
  background: linear-gradient(90deg, rgba(var(--box-primary-rgb), 0.055), transparent 44%);
`;

const Header = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.34rem 0.15rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:hover { background: rgba(var(--box-primary-rgb), 0.08); }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: -2px; }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--box-neon-rgb), 0.84);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Count = styled.span`
  color: rgba(var(--box-primary-rgb), 0.78);
  font-family: 'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
`;

const Viewport = styled.div`
  max-height: min(38dvh, 320px);
  overflow: auto;
  padding: 0 0.15rem 0.3rem;
  display: grid;
  gap: 0;
  overscroll-behavior: contain;
`;

const Row = styled.div`
  min-height: 48px;
  border-top: 1px solid rgba(var(--box-primary-rgb), 0.24);
  padding: 0.36rem 0.08rem;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 0.5rem;
  align-items: center;
`;

const Thumb = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 4px;
  border: 1px solid rgba(var(--box-secondary-rgb), 0.44);
  overflow: hidden;
  background: rgba(12, 19, 30, 0.94);
  display: grid;
  place-items: center;
  color: rgba(var(--box-secondary-rgb), 0.76);
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
  color: rgba(var(--box-neon-rgb), 0.94);
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
  color: rgba(var(--box-neon-rgb), 0.94);
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  color: rgba(var(--box-secondary-rgb), 0.74);
  font-size: 0.69rem;
`;

const StateText = styled.div`
  color: ${({ $error }) =>
    $error ? '#f3c1c1' : 'rgba(var(--box-secondary-rgb), 0.76)'};
  font-size: 0.75rem;
  border-top: 1px dashed rgba(var(--box-primary-rgb), 0.42);
  padding: 0.58rem 0.08rem;
`;

export default function IntakeCurrentBoxItemsPanel({
  currentBox,
  items = [],
  loading = false,
  error = '',
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => setExpanded(false), [currentBox?._id]);

  return (
    <Panel>
      <Header
        type="button"
        aria-expanded={expanded}
        aria-controls="intake-current-box-items"
        onClick={() => setExpanded((value) => !value)}
      >
        <Title>Current Box Items</Title>
        <Count>{safeItems.length} {expanded ? '−' : '+'}</Count>
      </Header>

      {expanded ? <Viewport id="intake-current-box-items">
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
            const imageUrl = getItemThumbnailUrl(item);
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
      </Viewport> : null}
    </Panel>
  );
}
