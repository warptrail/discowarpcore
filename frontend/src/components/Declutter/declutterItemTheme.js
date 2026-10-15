import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

export function getDeclutterItemTheme(item) {
  const address = String(item?.boxNumber || item?.box?.box_id || '');
  const physicalBoxId = address.match(/^(\d{3})(?:$|[-/.])/)?.[1];
  return getBoxThemeCssVars(getBoxTheme(physicalBoxId));
}
