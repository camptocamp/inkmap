import { applyWidgetPositionTransform } from './position';
import { CM_PER_INCH } from '../constants';

const FONT_SIZE_MM = 6;

/**
 * Print all attributions from the spec in one single line.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../../main/index.js').PrintSpec} spec
 */
export function printAttributions(ctx, spec) {
  const pxToMmRatio = spec.dpi / (CM_PER_INCH * 10);

  ctx.miterLimit = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.textBaseline = 'top';
  ctx.font = `${FONT_SIZE_MM}px Arial`;

  const text = computeAttributionsText(spec);

  ctx.save();

  applyWidgetPositionTransform(
    ctx,
    /** @type {import('../../main/index.js').WidgetPosition} */
    (spec.attributions === true ? 'bottom-right' : spec.attributions),
    [
      ctx.measureText(text).width * pxToMmRatio,
      FONT_SIZE_MM * pxToMmRatio * 0.85,
    ],
    spec.dpi,
  );

  ctx.scale(pxToMmRatio, pxToMmRatio);

  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
}

/**
 * Returns the attributions text of a spec.
 * It concatenates all unique attributions from the layers.
 * If no attributions are found, it returns 'Unknown source'.
 * @param {import('../../main/index.js').PrintSpec} spec
 * @return {string}
 */
export function computeAttributionsText(spec) {
  return (
    spec.layers
      .filter((layer) => !!layer.attribution)
      .map((layer) => layer.attribution)
      .reduce((acc, attribution) => {
        if (acc.indexOf(attribution) === -1) {
          acc.push(attribution);
        }
        return acc;
      }, [])
      .join(', ') || 'Unknown source'
  );
}
