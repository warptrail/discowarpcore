import useOperationsData from '../../hooks/useOperationsData';
import IntakePage from './IntakePage';

export default function IntakeRoutePage() {
  const { boxes } = useOperationsData({ includeSupportingData: false });
  return <IntakePage boxes={boxes} />;
}
