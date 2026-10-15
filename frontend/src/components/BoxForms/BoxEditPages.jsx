import { useId, useRef, useState } from 'react';
import BoxIdentityFields from './BoxIdentityFields';
import BoxLocationField from './BoxLocationField';
import BoxTagsField from './BoxTagsField';
import BoxComplexField from './BoxComplexField';
import BoxDeclutterFields from './BoxDeclutterFields';
import BoxImageField from '../ImageFields/BoxImageField';
import * as Form from './BoxEditForm.styles';
import * as S from './BoxEditPages.styles';

const pages = [
  { id: 'identity', label: 'Identity', icon: <><path d="M9 3 7 21m10-18-2 18M4 8h17M3 16h17" /></> },
  { id: 'location', label: 'Location', icon: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></> },
  { id: 'details', label: 'Details', icon: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6m-6 4h6m-6 4h4" /></> },
  { id: 'purpose', label: 'Purpose', icon: <><path d="M5 21V4m0 0h14l-3 5 3 5H5" /></> },
  { id: 'photo', label: 'Photo', icon: <><path d="M3 7h4l2-3h6l2 3h4v13H3Z" /><circle cx="12" cy="13" r="4" /></> },
  { id: 'render', label: 'Render', icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> },
];

export default function BoxEditPages({ identity, description, setDescription, notes, setNotes, isComplexBox, setIsComplexBox, declutter, image }) {
  const [index, setIndex] = useState(0);
  const prefix = useId();
  const tabsRef = useRef(null);
  const activePage = pages[index];
  const panelId = (id) => `${prefix}-page-${id}`;
  const tabId = (id) => `${prefix}-tab-${id}`;
  const movePage = (next) => {
    setIndex(next);
    // The end-page pager becomes disabled; put focus on the newly selected tab.
    window.requestAnimationFrame(() => tabsRef.current?.children[next]?.focus({ preventScroll: true }));
  };
  const handleTabKey = (event, tabIndex) => {
    const next = event.key === 'ArrowRight' ? (tabIndex + 1) % pages.length
      : event.key === 'ArrowLeft' ? (tabIndex + pages.length - 1) % pages.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setIndex(next);
    event.currentTarget.parentElement.children[next].focus();
  };
  const pageProps = (id) => ({
    id: panelId(id), role: 'tabpanel', 'aria-labelledby': tabId(id),
    hidden: activePage.id !== id, inert: activePage.id !== id, tabIndex: 0,
  });
  const mediaActive = activePage.id === 'photo' || activePage.id === 'render';

  return <S.Workspace>
    <S.Tabs ref={tabsRef} role="tablist" aria-label="Box details pages">
      {pages.map(({ id, label, icon }, tabIndex) => <S.Tab key={id} id={tabId(id)} type="button" role="tab"
        aria-label={label} title={label} aria-selected={index === tabIndex} $active={index === tabIndex}
        aria-controls={panelId(id === 'render' ? 'photo' : id)} tabIndex={index === tabIndex ? 0 : -1}
        onClick={() => setIndex(tabIndex)} onKeyDown={(event) => handleTabKey(event, tabIndex)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg><span>{label}</span>
      </S.Tab>)}
    </S.Tabs>
    <S.Heading><h3>{activePage.label}</h3><span aria-label={`Page ${index + 1} of ${pages.length}`}>{index + 1} / {pages.length}</span></S.Heading>
    <S.Page {...pageProps('identity')}>
      <BoxIdentityFields compact showOrganization={false} {...identity} />
      <BoxComplexField value={isComplexBox} onChange={setIsComplexBox} />
    </S.Page>
    <S.Page {...pageProps('location')}>
      <BoxLocationField compact locationId={identity.locationId} setLocationId={identity.setLocationId}
        locationOptions={identity.locationOptions} locationsLoading={identity.locationsLoading}
        onCreateLocation={identity.onCreateLocation} createBusy={identity.locationCreateBusy}
        errorMessage={identity.locationError} autoAssign={identity.autoSave} showHierarchyHint={false} />
    </S.Page>
    <S.Page {...pageProps('details')}>
      <S.Details>
        <BoxTagsField compact inline tags={identity.tags} setTags={identity.setTags} TagInputComponent={identity.TagInputComponent} />
        <Form.CompactContextGrid>
          <Form.Field $compact>
            <Form.Label htmlFor={`${prefix}-description`} $compact>Physical description</Form.Label>
            <Form.Textarea id={`${prefix}-description`} value={description} onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the physical box, color, size, markings, or condition..." $compact />
          </Form.Field>
          <Form.Field $compact>
            <Form.Label htmlFor={`${prefix}-notes`} $compact>Notes</Form.Label>
            <Form.Textarea id={`${prefix}-notes`} value={notes} onChange={(event) => setNotes(event.target.value)}
              placeholder="Add contextual notes for this box..." $compact />
          </Form.Field>
        </Form.CompactContextGrid>
      </S.Details>
    </S.Page>
    <S.Page {...pageProps('purpose')}><BoxDeclutterFields compact dense {...declutter} /></S.Page>
    {/* Keep one media controller mounted so profile drafts and uploads survive page changes. */}
    <S.Page id={panelId('photo')} role="tabpanel" aria-labelledby={tabId(mediaActive ? activePage.id : 'photo')}
      hidden={!mediaActive} inert={!mediaActive} tabIndex={0}>
      <BoxImageField {...image} compact mobileHeaderPreview={false} workspacePage={activePage.id === 'render' ? 'render' : 'photo'} />
    </S.Page>
    <S.Navigation aria-label="Box details page navigation">
      <S.PageButton type="button" disabled={index === 0} onClick={() => movePage(index - 1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>Previous
      </S.PageButton>
      <S.PageButton type="button" disabled={index === pages.length - 1} onClick={() => movePage(index + 1)}>
        Next<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
      </S.PageButton>
    </S.Navigation>
  </S.Workspace>;
}
