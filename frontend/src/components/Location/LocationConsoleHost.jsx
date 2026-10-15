import * as S from './LocationConsole.styles';

// Header owns the sticky placement; Location owns the controls and feedback.
export default function LocationConsoleHost() {
  return <S.Host id="location-console-mount" role="region" aria-label="Location console" />;
}
