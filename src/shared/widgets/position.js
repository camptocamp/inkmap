import { CM_PER_INCH } from '../constants';

const WIDGET_OFFSET_MM = 4;

/**
 * Applies transforms to match the given widget position and dpi
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../../main/index').WidgetPosition} position
 * @param {[number, number]} widgetSizePx
 * @param {number} dpi
 */
export function applyWidgetPositionTransform(ctx, position, widgetSizePx, dpi) {
  const xPart = position.split('-')[1];
  const yPart = position.split('-')[0];

  const offsetPx = Math.round((dpi * WIDGET_OFFSET_MM) / (10 * CM_PER_INCH));

  ctx.translate(
    xPart === 'left' ? offsetPx : ctx.canvas.width - offsetPx - widgetSizePx[0],
    yPart === 'top' ? offsetPx : ctx.canvas.height - offsetPx - widgetSizePx[1]
  );
}
