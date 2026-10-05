import { controlStyles, inputStyles } from '../../styles/primitives';
import styled from 'styled-components';
import { APP_VISUAL_THEME } from '../../styles/tokens';
import CustomSelect from '../CustomSelect';
import IntakeFilterValue from './IntakeFilterValue';

const Header = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0.65rem;
  border-bottom: 1px solid var(--dw-border);
  background: var(--dw-surface);

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    right: 15%;
    width: 38%;
    height: 5px;
    border-radius: 0 0 6px 6px;
    background: var(--dw-surface);
  }

  @media (max-width: 440px) { padding: 0.85rem 0.5rem; gap: 0.7rem; }
`;

const Title = styled.h3`
  margin: 0;
  color: var(--dw-text);
  font-size: clamp(1.25rem, 3.8vw, 1.8rem);
  font-weight: 750;
  line-height: 1.05;
  letter-spacing: 0.01em;
  text-transform: none;

  span {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--dw-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
`;

const Counter = styled.span`
  margin-left: auto;
  color: var(--dw-cyan);
  font-family: var(--dw-font-ui);
  font-size: 1.25rem;
`;

const Controls = styled.div`
  padding: 1rem 0.5rem 0.65rem;
  border-bottom: 1px solid var(--dw-border-soft);
  @media (max-width: 440px) { padding: 0.8rem 0.35rem; }
`;

const Fields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.9rem;
  @media (max-width: 440px) { grid-template-columns: minmax(0, 1fr); gap: 0.75rem; }
`;

const Field = styled.div`
  --field-tone: ${({ $tone }) => $tone || 'var(--dw-violet)'};
  min-width: 0;
  grid-column: ${({ $wide }) => $wide ? '1 / -1' : 'auto'};
`;

const Label = styled.div`
  display: flex;
  align-items: center;
  min-height: 22px;
  padding-left: 0.55rem;
  margin-bottom: 0.22rem;
  border-left: 2px solid var(--field-tone);
  border-radius: 5px 0 0 0;
  color: var(--field-tone);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
`;

const Well = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  min-height: 46px;
  border: 1px solid var(--dw-border);
  border-left: 2px solid var(--field-tone);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  box-shadow: none;

  > div { min-width: 0; }
  button[aria-haspopup='listbox'] {
    min-height: 44px;
    border: 0;
    background: transparent;
    box-shadow: none;
    border-radius: var(--dw-radius-sm);
    font-size: 0.86rem;
    padding: 0.5rem 0.7rem;
  }
  input {
    min-height: 44px;
    padding: 0.5rem 0.7rem;
    background: transparent;
    font-size: 0.84rem;
    border-radius: var(--dw-radius-sm);
  }
  button[aria-haspopup='listbox']:focus-visible { outline: 2px solid var(--field-tone); outline-offset: -2px; }
`;

const ScopeControls = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const ScopeButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
  min-height: 44px;
  padding: 0.5rem 0.7rem;
  border: 0;
  background: transparent;
  color: var(--dw-text);
  font: inherit;
  font-size: 0.88rem;
  text-align: left;
  cursor: pointer;
  span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }

  ${controlStyles}
`;

const IconButton = styled.button`
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--dw-border);
  background: transparent;
  color: var(--dw-cyan);
  font: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }

  ${controlStyles}
`;

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 0;
  color: var(--dw-text);
  font: inherit;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }

  ${inputStyles}
`;

const Operator = styled.div`
  min-width: 0;
  margin-top: -4px;
  > div > button[aria-haspopup='listbox'] {
    min-height: 26px;
    padding: 0 0.45rem 0 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    color: var(--field-tone);
    font-family: var(--dw-font-ui);
    font-size: 0.75rem;
    letter-spacing: 0.01em;
    text-transform: none;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.35rem;
  border-top: 1px solid var(--dw-border-soft);
`;

const Reset = styled.button`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 44px;
  padding: 0.2rem 0.7rem;
  border: 0;
  background: transparent;
  color: var(--dw-text-secondary);
  font: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;
  &:hover { color: var(--dw-text); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }

  ${controlStyles}
  flex: 0 0 auto;
  width: auto;
  justify-self: start;
`;

function RoutingIcon({ kind, size = 24 }) {
  const paths = {
    cubes: 'M12 2 6 5.5v7L12 16l6-3.5v-7L12 2Zm0 7v7M6 5.5l6 3.5 6-3.5M6 12.5l-5 3v5l5 3 6-3v-5M18 12.5l5 3v5l-5 3-6-3',
    scope: 'm3 8 9-5 9 5-9 5-9-5Zm0 8 9 5 9-5M3 12l9 5 9-5',
    attribute: 'M3 3h8l10 10-8 8L3 11V3Zm4 4h.01',
    search: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 6 6',
    sort: 'M3 5h18M3 12h12M3 19h7M17 9v12m-3-3 3 3 3-3',
    reset: 'M21 10a9 9 0 1 0-2 8M21 3v7h-7',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ justifySelf: 'center', color: 'var(--field-tone, var(--dw-violet))', flexShrink: 0 }}><path d={paths[kind]} /></svg>;
}

export default function IntakeRoutingControls({
  count, searchOpen, searchQuery, setSearchQuery, setSearchOpen, closeSearch,
  searchInputRef, filterTriggerRef, filtersOpen, openFilters, filterSummary,
  attribute, attributeOptions, onAttributeChange, operator, operatorOptions,
  setOperator, attributeValue, setAttributeValue, attributeSuggestions,
  sortMode, setSortMode, onReset,
}) {
  return <>
    <Header>
      <RoutingIcon kind="cubes" size={36} />
      <Title><span>Inventory</span>Routing</Title>
      <Counter aria-live="polite">{count}</Counter>
    </Header>
    <Controls>
      <Fields aria-label="Inventory attribute filters">
        <Field $wide>
          <Label>Scope</Label>
          <Well>
            <RoutingIcon kind="scope" />
            <ScopeControls>
              {searchOpen ? <>
                <SearchInput ref={searchInputRef} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') closeSearch(); }} placeholder="Search inventory" aria-label="Search inventory" />
                <IconButton type="button" onClick={closeSearch} aria-label="Close activity search">×</IconButton>
              </> : <>
                <ScopeButton ref={filterTriggerRef} type="button" aria-controls="intake-activity-filters" aria-expanded={filtersOpen} onClick={openFilters}><span>{filterSummary}</span><span aria-hidden="true">⌄</span></ScopeButton>
                <IconButton type="button" onClick={() => setSearchOpen(true)} aria-label="Search inventory"><RoutingIcon kind="search" size={18} /></IconButton>
              </>}
            </ScopeControls>
          </Well>
        </Field>
        <Field $tone={APP_VISUAL_THEME.cyan}>
          <Label>Attribute</Label>
          <Well><RoutingIcon kind="attribute" /><CustomSelect value={attribute} ariaLabel="Filter attribute" tone={APP_VISUAL_THEME.cyan} options={attributeOptions.map(([value, label]) => ({value, label}))} onChange={onAttributeChange} /></Well>
        </Field>
        <Field $tone={APP_VISUAL_THEME.teal}>
          <Label><Operator><CustomSelect value={operator} ariaLabel="Filter operator" tone={APP_VISUAL_THEME.teal} options={operatorOptions.map(([value, label]) => ({value, label}))} onChange={setOperator} /></Operator></Label>
          <Well><RoutingIcon kind="search" /><IntakeFilterValue type={attribute === 'quantity' ? 'number' : 'search'} suggestions={attributeSuggestions} value={attributeValue} aria-label="Filter value" placeholder={attribute === 'all' ? 'Search any item data…' : `Filter by ${attributeOptions.find(([value]) => value === attribute)?.[1].toLowerCase()}…`} onChange={(event) => setAttributeValue(event.target.value)} /></Well>
        </Field>
        <Field $wide>
          <Label>Sort</Label>
          <Well><RoutingIcon kind="sort" /><CustomSelect value={sortMode} ariaLabel="Sort inventory" tone={APP_VISUAL_THEME.violet} options={[
            {value: 'created_desc', label: 'Added · newest'}, {value: 'created_asc', label: 'Added · oldest'},
            {value: 'name_asc', label: 'Name · A–Z'}, {value: 'name_desc', label: 'Name · Z–A'},
            {value: 'quantity_desc', label: 'Quantity · high'},
          ]} onChange={setSortMode} /></Well>
        </Field>
      </Fields>
      <Footer><Reset type="button" aria-label="Reset inventory finder" onClick={onReset}><RoutingIcon kind="reset" size={22} />Clear</Reset></Footer>
    </Controls>
  </>;
}
