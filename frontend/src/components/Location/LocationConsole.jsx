import { Fragment, useEffect, useRef } from 'react';
import Toast from '../Toast/Toast';
import { LOCATION_MAP_TIERS } from './locationHierarchy';
import * as S from './LocationConsole.styles';

export default function LocationConsole({ scope = {}, shown = 0, total = 0, loading, busy, modalOpen, searchOpen,
  toast, onToastClose, onSearch, onBrowse, onAdd, onReset, onParent }) {
  const trailRef = useRef(null);
  const selected = LOCATION_MAP_TIERS.filter(tier => scope[tier.key]);
  const count = loading ? (total ? 'Refreshing locations…' : 'Loading locations…')
    : scope.room ? `${shown} / ${total} paths` : `${total} saved ${total === 1 ? 'path' : 'paths'}`;
  const disabled = busy || modalOpen;
  const path = selected.map(tier => scope[tier.key]).join(' › ');
  const reset = () => {
    onReset();
    requestAnimationFrame(() => trailRef.current?.querySelector('[aria-haspopup="dialog"]')?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    const trail = trailRef.current;
    if (trail) trail.scrollLeft = trail.scrollWidth;
  }, [path]);

  return <S.Console>
    <S.Row>
      {selected.length ? <S.Button type="button" disabled={disabled} onClick={reset} aria-label="Show whole house" title="Show whole house">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></svg>
      </S.Button> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></svg>}
      <S.Breadcrumbs ref={trailRef} aria-label="Location scope">
        {selected.length ? <>
          {selected.map((tier, index) => <Fragment key={tier.key}>
            {index > 0 ? <S.Separator aria-hidden="true">›</S.Separator> : null}
            <S.Crumb type="button" $current={index === selected.length - 1} disabled={disabled}
              onClick={index < selected.length - 1 ? () => onParent(tier.key, scope[tier.key]) : onBrowse}
              aria-haspopup={index === selected.length - 1 ? 'dialog' : undefined}
              aria-label={index < selected.length - 1 ? `Show ${scope[tier.key]} ${tier.label.toLowerCase()} branch` : `Browse location scope: House › ${path}`}
              title={index < selected.length - 1 ? scope[tier.key] : `House › ${path}`}>
              <span>{scope[tier.key]}</span>{index === selected.length - 1 ? <small role="status" aria-live="polite">{count}</small> : null}
            </S.Crumb>
          </Fragment>)}
        </> : <S.Current type="button" disabled={disabled} onClick={onBrowse} aria-haspopup="dialog" aria-label="Browse location scope">
          <span>House</span><small role="status" aria-live="polite">{count}</small>
        </S.Current>}
      </S.Breadcrumbs>
      <S.Actions $embedded aria-label="Location actions">
        <S.Button type="button" aria-label="Search locations" title="Search locations" aria-haspopup="dialog" aria-expanded={Boolean(searchOpen)} disabled={disabled} onClick={onSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg>
        </S.Button>
        <S.Add type="button" aria-label="Add location" title="Add location" aria-haspopup="dialog" disabled={disabled} onClick={onAdd}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16" /></svg>
        </S.Add>
      </S.Actions>
    </S.Row>
    {toast ? <S.Feedback><Toast {...toast} headerMounted open showIdle={false}
      presentation={!toast.presentation || toast.presentation === 'default' ? 'console-log' : toast.presentation}
      actions={(toast.actions || []).map(action => ({ ...action, disabled: action.disabled || modalOpen }))}
      onClose={!modalOpen && toast.dismissible !== false ? onToastClose : undefined} />
    </S.Feedback> : null}
  </S.Console>;
}
