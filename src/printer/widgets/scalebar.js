import { getPointResolution, METERS_PER_UNIT } from 'ol/proj';
import ProjUnits from 'ol/proj/Units';
import { Units } from 'ol/control/ScaleLine';
import { applyWidgetPositionTransform } from './position';
import { CM_PER_INCH } from '../../shared/constants';

const FONT_SIZE_MM = 6;
const BAR_HEIGHT_MM = 3;
const MIN_BAR_WIDTH_MM = 40;
const PADDING_UNDER_TEXT_MM = 1;
const BORDER_SIZE_MM = 1;

/**
 * Determines scale bar size and annotation and prints it to map.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('ol/PluggableMap').FrameState} frameState
 * @param {import('../../main/index').PrintSpec} spec
 */
export function printScaleBar(ctx, frameState, spec) {
  const scaleBarParams = getScaleBarParams(
    frameState,
    (typeof spec.scaleBar === 'object' && spec.scaleBar.units) || 'metric',
    spec.dpi
  );
  renderScaleBar(
    ctx,
    frameState,
    scaleBarParams,
    typeof spec.scaleBar === 'object' ? spec.scaleBar.position : spec.scaleBar,
    spec.dpi
  );
}

/**
 * Gets width and annotation for graphical scale bar.
 * @param {import('ol/PluggableMap').FrameState} frameState
 * @param {import('../../main/index').ScaleUnits} units
 * @param {number} dpi
 * @return {import('../../main/index').ScaleBarParams}
 */
function getScaleBarParams(frameState, units, dpi) {
  const minWidthPx = (dpi * MIN_BAR_WIDTH_MM) / (CM_PER_INCH * 10);
  const LEADING_DIGITS = [1, 2, 5];

  const center = frameState.viewState.center;
  const projection = frameState.viewState.projection;
  const pointResolutionUnits =
    units === Units.DEGREES ? ProjUnits.DEGREES : ProjUnits.METERS;
  let pointResolution = getPointResolution(
    projection,
    frameState.viewState.resolution,
    center,
    pointResolutionUnits
  );

  let nominalCount = minWidthPx * pointResolution;
  let suffix = '';

  if (units === Units.DEGREES) {
    const metersPerDegree = METERS_PER_UNIT[ProjUnits.DEGREES];
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
  } else if (units === Units.IMPERIAL) {
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
  } else if (units === Units.NAUTICAL) {
    pointResolution /= 1852;
    suffix = 'nm';
  } else if (units === Units.METRIC) {
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
  } else if (units === Units.US) {
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
    width: width,
    scalenumber: count,
    suffix: suffix,
  };
}

/**
 * Renders scale bar on canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('ol/PluggableMap').FrameState} frameState
 * @param {import('../../main/index').ScaleBarParams} scaleBarParams
 * @param {import('../../main/index').WidgetPosition} position
 * @param {number} dpi
 */
function renderScaleBar(ctx, frameState, scaleBarParams, position, dpi) {
  const pxToMmRatio = dpi / (CM_PER_INCH * 10);

  const scaleWidthPx = scaleBarParams.width;
  const scaleNumber = scaleBarParams.scalenumber;
  const scaleUnit = scaleBarParams.suffix;

  const scaleText = `${scaleNumber} ${scaleUnit}`;
  ctx.font = `${FONT_SIZE_MM}px Arial`;
  const scaleTextWidthMm = ctx.measureText(scaleText).width;

  const totalWidthPx =
    scaleWidthPx + (scaleTextWidthMm + BORDER_SIZE_MM) * pxToMmRatio;
  const totalHeightPx =
    (FONT_SIZE_MM + PADDING_UNDER_TEXT_MM + BAR_HEIGHT_MM + BORDER_SIZE_MM) *
    pxToMmRatio;

  ctx.save();
  applyWidgetPositionTransform(
    ctx,
    'scalebar',
    position,
    [totalWidthPx, totalHeightPx],
    dpi
  );

  // scale the canvas in order to use millimeters for draw instructions
  ctx.scale(pxToMmRatio, pxToMmRatio);

  const scaleWidthMm = scaleWidthPx / pxToMmRatio;
  const darkColor = '#000000';
  const lightColor = '#FFFFFF';

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = BORDER_SIZE_MM;

  ctx.translate(BORDER_SIZE_MM * 0.5, BORDER_SIZE_MM * 0.5);

  // Scale Text
  ctx.textAlign = 'left';
  ctx.strokeStyle = lightColor;
  ctx.fillStyle = darkColor;
  ctx.textBaseline = 'top';
  ctx.strokeText('0', 0, 0);
  ctx.fillText('0', 0, 0);
  ctx.strokeText(scaleText, scaleWidthMm, 0);
  ctx.fillText(scaleText, scaleWidthMm, 0);

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
    BAR_HEIGHT_MM - BORDER_SIZE_MM
  );
  ctx.fillRect(
    scaleWidthMm * 0.75,
    BORDER_SIZE_MM / 2,
    scaleWidthMm * 0.25 - BORDER_SIZE_MM / 2,
    BAR_HEIGHT_MM - BORDER_SIZE_MM
  );

  ctx.restore();
}
