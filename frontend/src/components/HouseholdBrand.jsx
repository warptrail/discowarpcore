import styled from 'styled-components';

const assets = '/brand/disco-space-cove';
const Lockup = styled.img`
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
`;
const Stack = styled.span`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;
const Emblem = styled.img`
  display: block;
  width: 68px;
  height: 68px;
  object-fit: contain;
`;

// Links supply the accessible household name and home action; artwork is decorative.
export default function HouseholdBrand({ stacked = false }) {
  if (stacked) {
    return (
      <Stack aria-hidden="true">
        <Emblem src={`${assets}/emblem-transparent-512.png`} width="512" height="512" alt="" />
        <Lockup src={`${assets}/wordmark-transparent.png`} width="1355" height="200" alt="" />
      </Stack>
    );
  }
  return <Lockup src={`${assets}/lockup-transparent-960.png`} width="960" height="231" alt="" aria-hidden="true" />;
}
