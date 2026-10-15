import { useLocation, useNavigationType } from 'react-router-dom';
import { getTagReturnSnapshot } from '../util/tagReturnNavigation';

export default function useTagReturnSnapshot() {
  return getTagReturnSnapshot(useLocation(), useNavigationType());
}
