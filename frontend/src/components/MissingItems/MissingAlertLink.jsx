import { Link, useLocation } from 'react-router-dom';
import { useMissingItems } from './MissingItemsContext';
import { AlertLink } from './MissingItems.styles';
export default function MissingAlertLink() {
  const { summary } = useMissingItems();
  const location = useLocation();
  if (!summary.records) return null;
  const params = new URLSearchParams(location.pathname === '/operations' ? location.search : '');
  params.set('missing', '1'); params.delete('peek'); params.delete('item');
  return <AlertLink as={Link} to={`/operations?${params}`} title="Open Missing Items"
    aria-label={`${summary.records} ${summary.records === 1 ? 'item record' : 'item records'}, ${summary.objects} ${summary.objects === 1 ? 'object' : 'objects'} missing. Open Missing Items.`}>
    <span aria-hidden="true">◇</span> Missing · {summary.records}
  </AlertLink>;
}
