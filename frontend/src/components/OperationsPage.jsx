import BoxList from './BoxList';
import useOperationsData from '../hooks/useOperationsData';

export default function OperationsPage() {
  const data = useOperationsData();
  return (
    <BoxList
      boxes={data.boxes}
      dataLoading={data.loading}
      dataError={data.error}
      orphanedCount={data.orphanedCount}
      orphanedItems={data.orphanedItems}
      locations={data.locations}
      pagination={{
        page: data.page,
        limit: data.pageLimit,
        total: data.total,
        totalPages: data.totalPages,
      }}
      onPageChange={data.setPage}
      onOperationsDataRefreshRequest={data.requestRefresh}
      onOrphanedItemCreated={data.recordOrphanedItem}
    />
  );
}
