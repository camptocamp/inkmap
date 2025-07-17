import { CM_PER_INCH } from './constants.js';
import { get as getProjection } from 'ol/proj.js';

/**
 * @param {import("../main/index.js").RealWorldUnit} unit
 * @param {number} dpi
 * @returns {number}
 */
function fromPxRatio(unit, dpi) {
  switch (unit) {
    case 'in':
      return 1 / dpi;
    case 'cm':
      return CM_PER_INCH / dpi;
    case 'mm':
      return (CM_PER_INCH * 10) / dpi;
    case 'm':
      return CM_PER_INCH / 100 / dpi;
    case 'px':
      return 1;
    default:
      throw new Error(`Invalid real world unit: ${unit}`);
  }
}

/**
 * Converts a dimension expressed in a real world unit to pixels based on DPI
 * @param {number} realWorldDimension
 * @param {import("../main/index.js").RealWorldUnit} unit
 * @param {number} dpi
 * @returns {number} Dimension expressed in pixels
 */
export function realWorldToPixel(realWorldDimension, unit, dpi) {
  return realWorldDimension / fromPxRatio(unit, dpi);
}

/**
 * Converts a dimension expressed in pixels to a real world unit based on DPI
 * @param {number} pixelDimension
 * @param {import("../main/index.js").RealWorldUnit} unit
 * @param {number} dpi
 * @returns {number} Dimension expressed in pixels
 */
export function pixelToRealWorld(pixelDimension, unit, dpi) {
  return pixelDimension * fromPxRatio(unit, dpi);
}

/**
 * Returns the resolution (i.e. px per real world unit)
 * @param {string} projection
 * @param {number} scale Scale denominator
 * @param {number} dpi
 */
export function scaleToResolution(projection, scale, dpi) {
  const olProj = getProjection(projection);
  return (scale * CM_PER_INCH) / dpi / olProj.getMetersPerUnit() / 100;
}
