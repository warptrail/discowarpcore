import styled from 'styled-components';
import { BASE_BORDER, ACTIVE_BORDER, CARD_BG } from './tokens';

export const DetailsCard = styled.div`
  position: relative;
  margin-top: -1px; /* fuse with ItemRow bottom edge */
  border: 1px solid ${BASE_BORDER};
  border-top: 0; /* critical: seam remains invisible */
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  background: ${CARD_BG};
  padding: 12px 12px 16px 12px;

  /* Echo the active tone when the row above is open */
  &[data-open='true'] {
    border-color: ${ACTIVE_BORDER};
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.08) inset;
  }
`;

export const Wrapper = styled.div`
  position: relative;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

export const Thumb = styled.img`
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid ${BASE_BORDER};
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #eaeaea;
`;

export const Micro = styled.span`
  display: inline-block;
  font-size: 0.75rem;
  color: #a8a8a8;
`;

export const Notes = styled.p`
  margin: 6px 0 10px 0;
  font-size: 0.9rem;
  line-height: 1.35;
  color: #c7c7c7;
  white-space: pre-wrap;
`;

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0 6px 0;
`;

export const Tag = styled.span`
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid ${BASE_BORDER};
  background: #2b2b2b;
  color: #cfcfcf;
`;

export const MetaRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
  color: #9e9e9e;
  font-size: 0.78rem;
`;
