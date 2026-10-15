const sources = new Map();
const prefix = 'dwc-tag-source:';

export function rememberTagSource(location, browser = window) {
  const popup = browser.document.querySelector('[data-tag-popup]:popover-open');
  const review = popup?.closest?.('[data-declutter-candidate]');
  let boxBrowseState = null;
  try { boxBrowseState = JSON.parse(browser.document.querySelector('[data-box-browse-state]')?.getAttribute('data-box-browse-state') || 'null'); } catch { /* Ignore obsolete browse state. */ }
  const scrollContainers = [];
  for (let element = popup?.parentElement; element; element = element.parentElement) {
    const key = element.getAttribute?.('data-tag-scroll-key') || element.id;
    if (key && element.scrollTop) scrollContainers.push({ key, top: element.scrollTop });
  }
  const source = {
    key: location.key, url: `${location.pathname}${location.search}${location.hash}`,
    boxBrowseState, scrollContainers,
    tagPopupKey: popup?.getAttribute('data-tag-popup'),
    tagPopupScrollTop: popup?.scrollTop || 0,
    tagPopupFocusHref: browser.document.activeElement?.closest?.('a')?.getAttribute('href'),
    itemSection: browser.document.querySelector('[data-item-page-section]')?.getAttribute('data-item-page-section'),
    declutterCandidateId: review?.getAttribute('data-declutter-candidate'),
    declutterNotesDraft: review?.querySelector?.('textarea')?.value,
    state: location.state, index: browser.history.state?.idx,
    scrollY: Math.max(browser.scrollY || 0, -(parseFloat(browser.document.body.style.top) || 0)),
    peekExpanded: browser.document.querySelector('[data-peek-expanded]')?.getAttribute('data-peek-expanded') === 'true',
  };
  sources.set(source.key, source);
  try { browser.sessionStorage.setItem(prefix + source.key, JSON.stringify(source)); } catch { /* Memory still covers this session. */ }
  return source;
}
export function readTagSource(key, browser = typeof window === 'undefined' ? null : window) {
  if (sources.has(key)) return sources.get(key);
  try { return JSON.parse(browser.sessionStorage.getItem(prefix + key)); } catch { return null; }
}
export function tagReturnDistance(source, currentIndex) {
  return Number.isInteger(source?.index) && Number.isInteger(currentIndex) && currentIndex > source.index
    ? currentIndex - source.index : 0;
}

export function getTagReturnSnapshot(location, navigationType) {
  const source = navigationType === 'POP' ? readTagSource(location.key) : location.state?.tagRestore;
  return source?.url === `${location.pathname}${location.search}${location.hash}` ? source : null;
}
