import {
  BOX_THEME_PRESETS,
  getBoxTheme,
  hexToRgbString,
} from '../../util/inventoryColorTheme';

export const BOX_COLOR_PALETTE = BOX_THEME_PRESETS.map((theme) => theme.primary);

export function getBoxColor(boxId) {
  return getBoxTheme(boxId).primary;
}

export function getBoxGroupColor(groupLabel, fallbackBoxId = 0) {
  void groupLabel;
  return getBoxColor(fallbackBoxId);
}

export function getBoxColorTones(boxId) {
  return getBoxTheme(boxId);
}

export function getBoxGroupColorTones(groupLabel, fallbackBoxId = 0) {
  void groupLabel;
  return getBoxTheme(fallbackBoxId);
}

export { hexToRgbString };
