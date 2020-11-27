import { getPointResolution, METERS_PER_UNIT } from 'ol/proj';
import ProjUnits from 'ol/proj/Units';
import { assert } from 'ol/asserts.js';

export function printScaleBar(ctx, frameState, spec) {
  let scaleParams = getScaleBarParams(frameState, spec);
  createScaleBar(ctx, frameState, scaleParams, spec);
}

function getScaleBarParams(frameState, spec) {
  // default values like ol.control.ScaleLine
  const minWidth = 64;
  const LEADING_DIGITS = [1, 2, 5];
  const Units = {
    DEGREES: 'degrees',
    IMPERIAL: 'imperial',
    NAUTICAL: 'nautical',
    METRIC: 'metric',
    US: 'us',
  };

  const center = frameState.viewState.center;
  const projection = frameState.viewState.projection;
  // use units from spec if provided, default "metric"
  const units = spec.scaleBar.units ? spec.scaleBar.units : 'metric';
  const pointResolutionUnits =
    units == Units.DEGREES ? ProjUnits.DEGREES : ProjUnits.METERS;
  let pointResolution = getPointResolution(
    projection,
    frameState.viewState.resolution,
    center,
    pointResolutionUnits
  );

  let nominalCount = minWidth * pointResolution;
  let suffix = '';

  if (units == Units.DEGREES) {
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
  } else if (units == Units.IMPERIAL) {
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
  } else if (units == Units.NAUTICAL) {
    pointResolution /= 1852;
    suffix = 'nm';
  } else if (units == Units.METRIC) {
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
  } else if (units == Units.US) {
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
  } else {
    assert(false, 33); // Invalid units
  }

  let i = 3 * Math.floor(Math.log(minWidth * pointResolution) / Math.log(10));
  let count, width, decimalCount;
  while (i) {
    decimalCount = Math.floor(i / 3);
    const decimal = Math.pow(10, decimalCount);
    count = LEADING_DIGITS[((i % 3) + 3) % 3] * decimal;
    width = Math.round(count / pointResolution);
    if (isNaN(width)) {
      return;
    } else if (width >= minWidth) {
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

function createScaleBar(ctx, frameState, scaleParams, spec) {
  const mapScale =
    '1 / ' +
    Math.round(getScaleForResolution(frameState, spec)).toLocaleString();

  let scalewidth = scaleParams.width;
  let scalenumber = scaleParams.scalenumber;
  let scaleunit = scaleParams.suffix;

  let line1 = 6;
  // use position from spec if provided, default "bottom-left"
  let xOffset =
    spec.scaleBar.position === 'bottom-right'
      ? frameState.size[0] - scalewidth - 60
      : 10;
  let yOffset = 10;
  let fontsize1 = 12;
  let font1 = fontsize1 + 'px Arial';

  ctx.save();
  ctx.globalAlpha = 0.8;

  // Scale Dimensions
  let xzero = scalewidth + xOffset;
  let yzero = ctx.canvas.height - yOffset;
  let xfirst = xOffset + (scalewidth * 1) / 4;
  let xsecond = xfirst + (scalewidth * 1) / 4;
  let xthird = xsecond + (scalewidth * 1) / 4;
  let xfourth = xthird + (scalewidth * 1) / 4;

  // Scale Text
  ctx.beginPath();
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 5;
  ctx.font = font1;
  // Title
  ctx.strokeText(['Echelle : ' + ' ' + mapScale], xOffset, yzero - fontsize1);
  ctx.fillText(['Echelle : ' + ' ' + mapScale], xOffset, yzero - fontsize1);
  // Number with units
  ctx.strokeText(
    [scalenumber + ' ' + scaleunit],
    xzero + 5,
    yzero + fontsize1 / 2
  );
  ctx.fillText(
    [scalenumber + ' ' + scaleunit],
    xzero + 5,
    yzero + fontsize1 / 2
  );

  // Stroke
  ctx.beginPath();
  ctx.lineWidth = line1 + 2;
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#ffffff';
  ctx.moveTo(xOffset, yzero);
  ctx.lineTo(xzero + 1, yzero);
  ctx.stroke();

  // sections black/white
  ctx.beginPath();
  ctx.lineWidth = line1;
  ctx.strokeStyle = '#000000';
  ctx.moveTo(xOffset, yzero);
  ctx.lineTo(xfirst, yzero);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = line1;
  ctx.strokeStyle = '#FFFFFF';
  ctx.moveTo(xfirst, yzero);
  ctx.lineTo(xsecond, yzero);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = line1;
  ctx.strokeStyle = '#000000';
  ctx.moveTo(xsecond, yzero);
  ctx.lineTo(xthird, yzero);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = line1;
  ctx.strokeStyle = '#FFFFFF';
  ctx.moveTo(xthird, yzero);
  ctx.lineTo(xfourth, yzero);
  ctx.stroke();

  ctx.restore();
}

function getScaleForResolution(frameState, spec) {
  // use DPI from spec if present
  const dpi = spec.dpi ? spec.dpi : 25.4 / 0.28;
  const mpu = frameState.viewState.projection.getMetersPerUnit();
  const inchesPerMeter = 39.37;
  return (
    parseFloat(frameState.viewState.resolution.toString()) *
    mpu *
    inchesPerMeter *
    dpi
  );
}
