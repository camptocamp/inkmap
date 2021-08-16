const SYMBOL_SIZE = 130; // size of the square containing the whole symbol
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
 * Print a north arrow on top of the canvas
 * @param {CanvasRenderingContext2D} ctx Rendering context of the canvas
 * @param {boolean|string} position Position of the arrow; `true` defaults to `'top-right'`
 */
export function printNorthArrow(ctx, position) {
  const positionStr = typeof position === 'boolean' ? 'top-right' : position;

  let xTranslate = ctx.canvas.width - SYMBOL_SIZE / 2 - 10;
  let yTranslate = 10 + SYMBOL_SIZE / 2;

  const splitted = positionStr.split('-');

  if (splitted[0] === 'bottom') {
    yTranslate = ctx.canvas.height - SYMBOL_SIZE / 2 - 10;
  }

  if (splitted.length > 1 && splitted[1] === 'left') {
    xTranslate = 10 + SYMBOL_SIZE / 2;
  }

  ctx.save();
  ctx.translate(xTranslate, yTranslate);

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

  ctx.restore();
}