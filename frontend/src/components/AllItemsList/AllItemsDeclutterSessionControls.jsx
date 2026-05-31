import * as S from './AllItemsList.styles';

export default function AllItemsDeclutterSessionControls({
  selectedCount = 0,
  sessions = [],
  selectedSessionId = '',
  newSessionName = '',
  loadingSessions = false,
  adding = false,
  error = '',
  onSelectedSessionChange,
  onNewSessionNameChange,
  onRefreshSessions,
  onAddToSelectedSession,
  onCreateSessionAndAdd,
}) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const canAddToExisting = selectedCount > 0 && selectedSessionId && !adding;
  const canCreateAndAdd = selectedCount > 0 && newSessionName.trim() && !adding;

  return (
    <S.SelectionDeclutterPanel>
      <S.SelectionDeclutterHeader>
        <S.SelectionDeclutterTitle>Declutter Session</S.SelectionDeclutterTitle>
        <S.SelectionDeclutterText>
          Add {selectedCount} selected candidate item{selectedCount === 1 ? '' : 's'} to a review queue.
        </S.SelectionDeclutterText>
      </S.SelectionDeclutterHeader>

      <S.SelectionBatchCluster>
        <S.SelectionSelectLabel>
          <span>Existing Session</span>
          <S.Select
            value={selectedSessionId}
            disabled={loadingSessions || adding || !safeSessions.length}
            onChange={(event) => onSelectedSessionChange?.(event.target.value)}
          >
            {safeSessions.length ? null : (
              <option value="">No active sessions</option>
            )}
            {safeSessions.map((session) => {
              const sessionId = String(session?.id || session?._id || '').trim();
              return (
                <option key={sessionId} value={sessionId}>
                  {session?.name || 'Declutter Session'} - {session?.counts?.total || 0} items
                </option>
              );
            })}
          </S.Select>
        </S.SelectionSelectLabel>
        <S.SelectionControlCluster>
          <S.ToolbarButton
            type="button"
            $tone="ghost"
            disabled={loadingSessions || adding}
            onClick={() => onRefreshSessions?.()}
          >
            Refresh
          </S.ToolbarButton>
          <S.ToolbarButton
            type="button"
            $tone="primary"
            disabled={!canAddToExisting}
            onClick={() => onAddToSelectedSession?.()}
          >
            {adding ? 'Adding...' : 'Add to Queue'}
          </S.ToolbarButton>
        </S.SelectionControlCluster>
      </S.SelectionBatchCluster>

      <S.SelectionBatchCluster>
        <S.SelectionSelectLabel>
          <span>New Session</span>
          <S.SearchInput
            value={newSessionName}
            disabled={adding}
            onChange={(event) => onNewSessionNameChange?.(event.target.value)}
            placeholder="New declutter session name"
          />
        </S.SelectionSelectLabel>
        <S.ToolbarButton
          type="button"
          $tone="primary"
          disabled={!canCreateAndAdd}
          onClick={() => onCreateSessionAndAdd?.()}
        >
          Create + Add
        </S.ToolbarButton>
      </S.SelectionBatchCluster>

      {error ? <S.SelectionDeclutterError role="alert">{error}</S.SelectionDeclutterError> : null}
    </S.SelectionDeclutterPanel>
  );
}
