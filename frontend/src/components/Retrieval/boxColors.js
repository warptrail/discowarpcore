import {
  BOX_THEME_PRESETS,
  getBoxTheme,
  hexToRgbString,
} from '../../util/inventoryColorTheme';

export const BOX_COLOR_PALETTE = BOX_THEME_PRESETS.map((theme) => theme.primary);

export function getBoxColor(boxId) {
  return getBoxTheme(boxId).primary;
}


export function getBoxColorTones(boxId) {
  return getBoxTheme(boxId);
}


export { hexToRgbString };
