import * as S from './Declutter.styles';
import DeclutterCounts from './DeclutterCounts';

export default function DeclutterSessionCards({
  sessions = [],
  busySessionId = '',
  onToggleArchive,
  onDelete,
}) {
  return (
    <S.SessionGrid>
      {sessions.map((session) => {
        const sessionId = String(session?.id || session?._id || '').trim();
        const isArchived = String(session?.status || '').toLowerCase() === 'archived';
        const isBusy = busySessionId === sessionId;

        return (
          <S.SessionCard key={sessionId} $status={session.status}>
            <S.SessionCardTop>
              <div>
                <S.SessionName>{session.name || 'Declutter Session'}</S.SessionName>
                {session.description ? (
                  <S.SessionDescription>{session.description}</S.SessionDescription>
                ) : null}
              </div>
              <DeclutterDecisionPillLike status={session.status} />
            </S.SessionCardTop>

            <DeclutterCounts session={session} />

            <S.CardActions>
              <S.LinkButton to={`/declutter/${encodeURIComponent(sessionId)}`}>
                Open Queue
              </S.LinkButton>
              <S.Button
                type="button"
                $tone={isArchived ? 'primary' : 'warning'}
                disabled={isBusy}
                onClick={() => onToggleArchive?.(session)}
              >
                {isArchived ? 'Restore' : 'Archive'}
              </S.Button>
              <S.Button
                type="button"
                $tone="danger"
                disabled={isBusy}
                onClick={() => onDelete?.(session)}
              >
                Delete
              </S.Button>
            </S.CardActions>
          </S.SessionCard>
        );
      })}
    </S.SessionGrid>
  );
}

function DeclutterDecisionPillLike({ status }) {
  const isArchived = String(status || '').toLowerCase() === 'archived';
  return (
    <S.DecisionPill $tone={isArchived ? 'pending' : 'keep'}>
      {isArchived ? 'Archived' : 'Active'}
    </S.DecisionPill>
  );
}
