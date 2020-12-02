const ARROW_PATH =
  'M 0.00,51.40\
C 0.00,51.40 25.50,0.00 25.50,0.00\
  25.50,0.00 51.00,51.40 51.00,51.40\
  51.00,51.40 25.50,38.60 25.50,38.60\
  25.50,38.60 0.00,51.40 0.00,51.40 Z';
const N_PATH =
  'M 16.17,51.90\
  C 16.17,51.90 21.93,51.90 21.93,51.90\
    21.93,51.90 29.37,63.00 29.37,63.00\
    29.37,63.00 29.37,51.90 29.37,51.90\
    29.37,51.90 35.22,51.90 35.22,51.90\
    35.22,51.90 35.22,72.00 35.22,72.00\
    35.22,72.00 29.37,72.00 29.37,72.00\
    29.37,72.00 21.93,61.00 21.93,61.00\
    21.93,61.00 21.93,72.00 21.93,72.00\
    21.93,72.00 16.17,72.00 16.17,72.00\
    16.17,72.00 16.17,51.90 16.17,51.90 Z';
const NORTH_ARROW_WIDTH = 51;
const NORTH_ARROW_HEIGHT = 72;

/**
 * Print a north arrow on top of the canvas
 * @param {CanvasRenderingContext2D} ctx Rendering context of the canvas
 * @param {boolean|string} position Position of the arrow; `true` defaults to `'top-right'`
 */
export function printNorthArrow(ctx, position) {
  if (position === true) {
    position = 'top-right';
  }

  let xTranslate = ctx.canvas.width - NORTH_ARROW_WIDTH - 10;
  let yTranslate = 10;

  const splitted = position.split('-');

  if (splitted[0] === 'bottom') {
    yTranslate = ctx.canvas.height - NORTH_ARROW_HEIGHT - 10;
  }

  if (splitted.length > 1 && splitted[1] === 'left') {
    xTranslate = 10;
  }

  ctx.save();
  ctx.translate(xTranslate, yTranslate);
  ctx.fillStyle = '#000000';
  const pathArrow = new Path2D(ARROW_PATH);
  ctx.fill(pathArrow);
  const PathN = new Path2D(N_PATH);
  ctx.fill(PathN);
  ctx.restore();
}
