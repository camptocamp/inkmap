import { fromLonLat, getPointResolution, METERS_PER_UNIT } from 'ol/proj';
import { applyWidgetPositionTransform } from './position.js';
import {
  pixelToRealWorld,
  realWorldToPixel,
  scaleToResolution,
} from '../units.js';
import { PrintableImage } from '../../main/printable-image.js';

const FONT_SIZE_MM = 6;
const BAR_HEIGHT_MM = 3;
const MIN_BAR_WIDTH_MM = 40;
const PADDING_UNDER_TEXT_MM = 1;
const BORDER_SIZE_MM = 1;

/**
 * @typedef {Object} ScaleBarParams
 * @property {number} widthMm Width of rendered graphical scalebar in mm.
 * @property {string} scaleIndication Distance used as scale indication, formatted
 */

/**
 * Returns a `PrintableImage` containing the scale bar for the given spec.
 * Note: if the projection in the spec is not yet registered in proj4, this will fail!
 * @param {import("../../main/index.js").PrintSpec} spec
 * @param {import("../../main/index.js").LengthWithUnit} [sizeHint] Optional size hint; otherwise the image size will be determined based on the spec
 * @return {import("../../main/printable-image.js").PrintableImage}
 */
export function getPrintableScaleBar(spec, sizeHint) {
  const canvas = document.createElement('canvas');

  function sizeHintToPx() {
    if (!sizeHint) return null;
    const width = sizeHint[0];
    const unit = sizeHint[1] || 'px';
    return realWorldToPixel(width, unit, spec.dpi);
  }

  const ctx = canvas.getContext('2d');
  const scaleBarParams = getScaleBarParams(spec, sizeHintToPx());
  const [width, height] = getScaleBarSizePx(scaleBarParams, spec.dpi, ctx);

  canvas.width = width;
  canvas.height = height;

  const mmToPxRatio = realWorldToPixel(1, 'mm', spec.dpi);
  ctx.scale(mmToPxRatio, mmToPxRatio);
  printScaleBarInternal(ctx, scaleBarParams);
  ctx.restore();

  return new PrintableImage(canvas, spec.dpi);
}

/**
 * Determines scale bar size and annotation and prints it to map.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("../../main/index.js").PrintSpec} spec
 */
export function printScaleBar(ctx, spec) {
  const scaleBarParams = getScaleBarParams(spec);
  const position =
    typeof spec.scaleBar === 'object' ? spec.scaleBar.position : spec.scaleBar;

  const [totalWidthPx, totalHeightPx] = getScaleBarSizePx(
    scaleBarParams,
    spec.dpi,
    ctx,
  );

  ctx.save();
  applyWidgetPositionTransform(
    ctx,
    typeof position === 'boolean' ? 'bottom-left' : position,
    [totalWidthPx, totalHeightPx],
    spec.dpi,
  );

  // scale the canvas in order to use millimeters for draw instructions
  const mmToPxRatio = realWorldToPixel(1, 'mm', spec.dpi);
  ctx.scale(mmToPxRatio, mmToPxRatio);
  printScaleBarInternal(ctx, scaleBarParams);
  ctx.restore();
}

/**
 * Gets width and annotation for graphical scale bar.
 * @param {import("../../main/index.js").PrintSpec} spec
 * @param {number} [sizeHint] Size hint in px (optional)
 * @return {ScaleBarParams}
 */
function getScaleBarParams(spec, sizeHint) {
  const minWidthPx = sizeHint
    ? sizeHint
    : realWorldToPixel(MIN_BAR_WIDTH_MM, 'mm', spec.dpi);
  const LEADING_DIGITS = [1, 2, 5];

  const units =
    (typeof spec.scaleBar === 'object' && spec.scaleBar.units) || 'metric';
  const center = fromLonLat(spec.center, spec.projection);
  const resolution = scaleToResolution(spec.projection, spec.scale, spec.dpi);
  /** @type {import('ol/proj/Units').Units} */
  const pointResolutionUnits = units === 'degrees' ? units : 'm';
  let pointResolution = getPointResolution(
    spec.projection,
    resolution,
    center,
    pointResolutionUnits,
  );

  let nominalCount = minWidthPx * pointResolution;
  let suffix = '';

  if (units === 'degrees') {
    const metersPerDegree = METERS_PER_UNIT[units];
    nominalCount *= metersPerDegree;
    if (nominalCount < metersPerDegree / 60) {
      suffix = '\u2033'; // seconds
      pointResolution *= 3600;
    } else if (nominalCount < metersPerDegree) {
      suffix = '\u2032'; // minutes
      pointResolution *= 60;
    } else {
      suffix = '\u00b0'; // degrees
    }
  } else if (units === 'imperial') {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution /= 0.0254;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.3048;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.344;
    }
  } else if (units === 'nautical') {
    pointResolution /= 1852;
    suffix = 'nm';
  } else if (units === 'metric') {
    if (nominalCount < 0.001) {
      suffix = 'μm';
      pointResolution *= 1000000;
    } else if (nominalCount < 1) {
      suffix = 'mm';
      pointResolution *= 1000;
    } else if (nominalCount < 1000) {
      suffix = 'm';
    } else {
      suffix = 'km';
      pointResolution /= 1000;
    }
  } else if (units === 'us') {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution *= 39.37;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.30480061;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.3472;
    }
  }

  let i = 3 * Math.floor(Math.log(minWidthPx * pointResolution) / Math.log(10));
  let count, width, decimalCount;
  while (true) {
    decimalCount = Math.floor(i / 3);
    const decimal = Math.pow(10, decimalCount);
    count = LEADING_DIGITS[((i % 3) + 3) % 3] * decimal;
    width = Math.round(count / pointResolution);
    if (isNaN(width)) {
      return;
    } else if (width >= minWidthPx) {
      break;
    }
    ++i;
  }
  return {
    widthMm: pixelToRealWorld(width, 'mm', spec.dpi),
    scaleIndication: `${count} ${suffix}`,
  };
}

/**
 * @param {ScaleBarParams} scaleBarParams
 * @param {number} dpi
 * @param {CanvasRenderingContext2D} ctx
 * @return {[number,number]}
 */
function getScaleBarSizePx(scaleBarParams, dpi, ctx) {
  ctx.font = `${FONT_SIZE_MM}px Arial`;
  const scaleTextWidthMm = ctx.measureText(
    scaleBarParams.scaleIndication,
  ).width;
  return [
    realWorldToPixel(
      scaleBarParams.widthMm + scaleTextWidthMm + BORDER_SIZE_MM,
      'mm',
      dpi,
    ),
    realWorldToPixel(
      FONT_SIZE_MM + PADDING_UNDER_TEXT_MM + BAR_HEIGHT_MM + BORDER_SIZE_MM,
      'mm',
      dpi,
    ),
  ];
}

/**
 * Print a scale bar on a canvas
 * Apply scale/translation to the context to make sure the scale bar is printed correctly
 * @param {CanvasRenderingContext2D} ctx Rendering context of the canvas
 * @param {ScaleBarParams} scaleBarParams
 */
function printScaleBarInternal(ctx, scaleBarParams) {
  const scaleWidthMm = scaleBarParams.widthMm;
  const darkColor = '#000000';
  const lightColor = '#FFFFFF';

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = BORDER_SIZE_MM;
  ctx.font = `${FONT_SIZE_MM}px Arial`;

  ctx.translate(BORDER_SIZE_MM * 0.5, BORDER_SIZE_MM * 0.5);

  // Scale Text
  ctx.textAlign = 'left';
  ctx.strokeStyle = lightColor;
  ctx.fillStyle = darkColor;
  ctx.textBaseline = 'top';
  ctx.strokeText('0', 0, 0);
  ctx.fillText('0', 0, 0);
  ctx.strokeText(scaleBarParams.scaleIndication, scaleWidthMm, 0);
  ctx.fillText(scaleBarParams.scaleIndication, scaleWidthMm, 0);

  ctx.translate(FONT_SIZE_MM * 0.3, FONT_SIZE_MM + PADDING_UNDER_TEXT_MM);

  // dark bar
  ctx.strokeRect(0, 0, scaleWidthMm, BAR_HEIGHT_MM);
  ctx.fillRect(0, 0, scaleWidthMm, BAR_HEIGHT_MM);

  // light sections
  ctx.fillStyle = lightColor;
  ctx.fillRect(
    scaleWidthMm * 0.25,
    BORDER_SIZE_MM / 2,
    scaleWidthMm * 0.25,
    BAR_HEIGHT_MM - BORDER_SIZE_MM,
  );
  ctx.fillRect(
    scaleWidthMm * 0.75,
    BORDER_SIZE_MM / 2,
    scaleWidthMm * 0.25 - BORDER_SIZE_MM / 2,
    BAR_HEIGHT_MM - BORDER_SIZE_MM,
  );
}
