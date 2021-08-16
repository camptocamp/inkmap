import { CM_PER_INCH } from '../../shared/constants';

const WIDGET_OFFSET_MM = 4;

const DEFAULT_POSITIONS = {
  'north-arrow': 'top-right',
  scalebar: 'bottom-left',
  attributions: 'bottom-right',
};

/**
 * Applies transforms to match the given widget position and dpi
 * @param {CanvasRenderingContext2D} ctx
 * @param {'north-arrow'|'scalebar'|'attributions'} widgetType
 * @param {import('../../main/index').WidgetPosition} position
 * @param {[number, number]} widgetSizePx
 * @param {number} dpi
 */
export function applyWidgetPositionTransform(
  ctx,
  widgetType,
  position,
  widgetSizePx,
  dpi
) {
  /** @type {string} */
  const explicitPos =
    position === true ? DEFAULT_POSITIONS[widgetType] : position;

  const xPart = explicitPos.split('-')[1];
  const yPart = explicitPos.split('-')[0];

  const offsetPx = Math.round((dpi * WIDGET_OFFSET_MM) / (10 * CM_PER_INCH));

  ctx.translate(
    xPart === 'left' ? offsetPx : ctx.canvas.width - offsetPx - widgetSizePx[0],
    yPart === 'top' ? offsetPx : ctx.canvas.height - offsetPx - widgetSizePx[1]
  );
}
