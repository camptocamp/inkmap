import { applyWidgetPositionTransform } from './position.js';
import { PrintableImage } from '../../main/printable-image.js';
import { realWorldToPixel } from '../units.js';

// size of the square containing the whole symbol
const SOURCE_SYMBOL_SIZE_PX = 130;
const SYMBOL_SIZE_MM = 30;

const FG_STROKE_PATHS = [
  'M 12.940954,-48.296291 A 50,50 0 0 1 49.809735,-4.3577871',
  'M -49.809735,-4.3577863 A 50,50 0 0 1 -12.940952,-48.296291',
  'M -4.3577877,49.809735 A 50,50 0 0 1 -49.809735,4.3577867',
  'M 49.809735,4.3577872 A 50,50 0 0 1 4.3577854,49.809735',
  'M -5.2916667,-43.38024 V -56.609407 L 5.2916667,-43.38024 v -13.229167',
  'M -21.166667,31.75 0,-31.75 21.166667,31.75 0,15.875 Z',
];
const FG_FILL_PATHS = ['M 0,-31.75 21.166667,31.75 0,15.875 Z'];
const BG_STROKE_PATHS = [
  'm 8,-50 a 8,8 0 0 1 -8,8 8,8 0 0 1 -8,-8 8,8 0 0 1 8,-8 8,8 0 0 1 8,8 z',
  'M 50,0 A 50,50 0 0 1 0,50 50,50 0 0 1 -50,0 50,50 0 0 1 0,-50 50,50 0 0 1 50,0 Z',
];
const BG_FILL_PATHS = [
  'M -21.166667,31.75 0,-31.75 21.166667,31.75 0,15.875 Z',
];

/**
 * Returns a `PrintableImage` containing the north arrow for the given spec.
 * @param {import("../../main/index.js").PrintSpec} spec
 * @param {import("../../main/index.js").LengthWithUnit} [sizeHint] Optional size hint; otherwise the image size will be determined based on the spec
 * @return {import("../../main/printable-image.js").PrintableImage}
 */
export function getPrintableNorthArrow(spec, sizeHint) {
  const canvas = document.createElement('canvas');

  function sizeHintToPx() {
    const smallest = sizeHint[0];
    const unit = sizeHint[1] || 'px';
    return realWorldToPixel(smallest, unit, spec.dpi);
  }

  const sizePx = sizeHint ? sizeHintToPx() : getNorthArrowSizePx(spec.dpi);
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');

  // put the arrow in the center of the canvas, scale it to use all the canvas
  ctx.translate(sizePx / 2, sizePx / 2);
  ctx.scale(sizePx / SOURCE_SYMBOL_SIZE_PX, sizePx / SOURCE_SYMBOL_SIZE_PX);

  printNorthArrowInternal(ctx);

  return new PrintableImage(canvas, spec.dpi);
}

/**
 * Print a north arrow on top of the canvas
 * @param {CanvasRenderingContext2D} ctx Rendering context of the canvas
 * @param {true|import('../../main/index.js').WidgetPosition} position Position of the arrow; `true` defaults to `'top-right'`
 * @param {number} dpi DPI of the printed document
 */
export function printNorthArrow(ctx, position, dpi) {
  const finalSymbolSizePx = getNorthArrowSizePx(dpi);

  ctx.save();
  applyWidgetPositionTransform(
    ctx,
    position === true ? 'top-right' : position,
    [finalSymbolSizePx, finalSymbolSizePx],
    dpi,
  );

  // account for the fact that the symbol SVG is centered on 0,0 and has an intrinsic size
  ctx.translate(finalSymbolSizePx / 2, finalSymbolSizePx / 2);
  ctx.scale(
    finalSymbolSizePx / SOURCE_SYMBOL_SIZE_PX,
    finalSymbolSizePx / SOURCE_SYMBOL_SIZE_PX,
  );

  printNorthArrowInternal(ctx);

  ctx.restore();
}

function getNorthArrowSizePx(dpi) {
  return realWorldToPixel(SYMBOL_SIZE_MM, 'mm', dpi);
}

/**
 * Print a north arrow on a canvas
 * Apply scale/translation to the context to make sure the arrow is printed correctly
 * @param {CanvasRenderingContext2D} ctx Rendering context of the canvas
 */
function printNorthArrowInternal(ctx) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.strokeStyle = 'rgb(255, 255, 255)';
  ctx.lineWidth = 8;
  BG_STROKE_PATHS.forEach((path) => {
    ctx.stroke(new Path2D(path));
  });
  BG_FILL_PATHS.forEach((path) => {
    ctx.fill(new Path2D(path));
  });

  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.strokeStyle = 'rgb(0, 0, 0)';
  ctx.lineWidth = 3;
  FG_STROKE_PATHS.forEach((path) => {
    ctx.stroke(new Path2D(path));
  });
  FG_FILL_PATHS.forEach((path) => {
    ctx.fill(new Path2D(path));
  });
}
