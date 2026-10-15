export const DECLUTTER_OVERVIEW_EVENT = 'declutter:overview';
let overview = null;
export const getDeclutterOverview = () => overview;
export function publishDeclutterOverview(value) {
  overview=value;
  if (typeof window!=='undefined') window.dispatchEvent(new CustomEvent(DECLUTTER_OVERVIEW_EVENT,{detail:value}));
}
