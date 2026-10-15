import DeclutterGlyph from './DeclutterGlyph';
import * as C from './DeclutterConsole.styles';

const MODES = [
  { id: 'deck', label: 'Review', icon: 'review' },
  { id: 'discussion', label: 'Discuss', icon: 'discussion' },
  { id: 'actions', label: 'Actions', icon: 'actions' },
  { id: 'progress', label: 'Progress', icon: 'progress' },
];

export default function DeclutterDeckNavigation({ mode, counts, onSelect }) {
  return <C.Navigation>
    <C.Modes aria-label="Declutter workspaces">
      {MODES.map(({ id, label, icon }) => <C.Mode key={id} type="button"
        aria-pressed={mode === id} onClick={() => onSelect(id)}>
        <DeclutterGlyph name={icon} />
        <C.ModeLabel>{label}{counts[id] != null ? <C.Count>{counts[id]}</C.Count> : null}</C.ModeLabel>
      </C.Mode>)}
    </C.Modes>
  </C.Navigation>;
}
