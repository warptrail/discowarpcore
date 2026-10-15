import styled from 'styled-components';
import * as P from '../styles/ItemPage.styles';
import * as L from '../styles/EditItemDetailsForm.styles';
import * as M from './MissingItems/MissingItems.styles';

// Scoped to the full item's Commands tab; shared editor styles stay unchanged.
export const Commands = styled.div`
  display: grid; gap: 20px; min-width: 0; max-width: 860px;
  padding: clamp(12px, 2vw, 20px);
  border: 1px solid rgba(var(--box-primary-rgb), .4);
  border-radius: 18px 18px 14px 14px; background: #101b27;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), inset 0 -1px 0 rgba(0,0,0,.4),
    0 8px 24px rgba(0,0,0,.2), 0 0 18px rgba(var(--box-primary-rgb), .08);
  && ${P.ItemButtonBar} { border: 0; background: transparent; overflow: visible; }
  && ${P.ItemControlsPanel} { border: 0; background: transparent; gap: 16px; }
  && ${P.ControlGroup} { padding: 0; gap: 8px; border: 0; }
  && [aria-label='Inventory actions'] { grid-column: 1 / -1; }
  && ${P.ControlGroupLabel} { font: 500 .75rem/1.4 var(--dw-font-ui); color: var(--dw-text-secondary); }
  && ${P.DeclutterControlGroup} { padding: 0; border: 0; }
  && ${P.DeclutterControlButton} {
    min-height: 44px; padding: 8px 12px; border-color: var(--dw-border);
    background: #152232; border-radius: 8px;
    &[aria-pressed='true'] { border-color: var(--dw-coral); background: rgba(255,141,142,.1); }
  }
  && ${P.DeclutterControlContext} { font: 400 .75rem/1.4 var(--dw-font-ui); color: var(--dw-text-secondary); }
  && ${P.DeclutterControlTitle} { font: 500 .85rem/1.4 var(--dw-font-ui); }
  && ${P.DeclutterControlState} { font-weight: 500; }
  && ${P.ContainerActions}, && ${P.ContainerTimestampActions},
  && ${P.ViewModeNav}, && ${P.ItemModeActions}, && ${M.Actions} {
    padding: 2px; gap: 2px; border: 1px solid var(--dw-border); border-radius: 6px;
    background: #152232; min-width: 0;
  }
  && ${M.Actions}, && ${M.Status}, && ${M.Lane} { grid-column: 1 / -1; }
  && ${P.ItemModeActions} { grid-template-columns: 1fr; }
  && ${P.ContainerActions} { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
  && ${P.ContainerButton}, && ${P.ViewModeButton}, && ${P.ItemModeButton} { display: flex; align-items: center; justify-content: center; gap: 8px; }
  && ${P.ContainerButton}, && ${P.ContainerTimestampButton},
  && ${P.ViewModeButton}, && ${P.ItemModeButton}, && ${M.Button} {
    min-width: 0; min-height: 44px; padding: 8px; border: 0; border-radius: 3px;
    box-shadow: none; background: transparent; color: var(--dw-text-secondary);
    font: 400 .85rem/1.4 var(--dw-font-ui); text-transform: none; letter-spacing: normal;
    &:hover:enabled { background: rgba(var(--box-primary-rgb), .1); color: var(--dw-text); filter: none; }
    &[aria-current='page'], &[aria-pressed='true'] {
      color: var(--box-primary); background: rgba(var(--box-primary-rgb), .1);
      box-shadow: inset 0 -2px 0 var(--box-primary);
    }
  }
  && ${M.Button} { color: var(--dw-amber); }
  && ${P.ContainerTimestampButton} { gap: 6px; }
  && ${P.ContainerTimestampStat} { font: 400 .75rem/1.4 var(--dw-font-ui); white-space: normal; }
  && ${P.TimestampLabelFull} { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  && ${P.TimestampLabelCompact} { display: none; }
  && ${P.ContainerPickerWrap} { padding: 12px 0 0; background: transparent; }
  && ${L.LifecycleSection} {
    margin: 0; padding: 18px 0 0; border: 0; border-top: 1px solid var(--dw-border);
    border-radius: 0; background: transparent; box-shadow: none;
  }
  && ${L.LifecycleHeader} { font: 600 1rem/1.4 var(--dw-font-ui); }
  && ${L.LifecycleEyebrow} { display: none; }
  && ${L.LifecycleMetaGrid} { gap: 12px; margin: 12px 0; }
  && ${L.LifecycleMetaRow} { border: 0; background: transparent; padding: 0; min-width: 0; }
  && ${L.LifecycleMetaLabel} { font: 400 .75rem/1.5 var(--dw-font-ui); }
  && ${L.LifecycleMetaValue} { font: 400 .85rem/1.5 var(--dw-font-ui); overflow-wrap: anywhere; }
  && ${L.FieldHint} { font: 400 .75rem/1.5 var(--dw-font-ui); color: var(--dw-text-secondary); }
  && ${L.SmallActionButton} {
    min-height: 44px; padding: 8px 12px; border: 1px solid var(--dw-coral); border-radius: 6px;
    color: var(--dw-coral); background: rgba(255,141,142,.06); font: 500 .8rem/1.4 var(--dw-font-ui);
  }
  && button:focus-visible, && a:focus-visible, && summary:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media(max-width: 430px) {
    && ${P.ItemControlsPanel} { grid-template-columns: 1fr; }
    && ${P.ControlGroup} { grid-column: 1 / -1; }
    && ${P.DeclutterControlButton} { grid-template-columns: minmax(0, 1fr) auto; }
    && ${P.DeclutterControlContext} { grid-column: 1 / -1; }
    && ${L.LifecycleMetaGrid} { grid-template-columns: 1fr; }
  }
  @media(prefers-reduced-motion: reduce) { button { transition: none; } }
`;
