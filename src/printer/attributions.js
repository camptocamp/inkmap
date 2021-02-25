/**
 * Print all attributions from the spec in one single line.
 * @param {CanvasRenderingContext2D} ctx
 * @param {PrintSpec} spec
 */
export function printAttributions(ctx, spec) {
  const gutter = 10;
  const fontSize = 12;
  let x, y;

  switch (spec.attributions) {
    case 'bottom-left':
      x = gutter;
      y = ctx.canvas.height - gutter;
      ctx.textAlign = 'left';
      break;
    case 'top-left':
      x = gutter;
      y = gutter + fontSize;
      ctx.textAlign = 'left';
      break;
    case 'bottom-right':
      x = ctx.canvas.width - gutter;
      y = ctx.canvas.height - gutter;
      ctx.textAlign = 'right';
      break;
    case 'top-right':
      x = ctx.canvas.width - gutter;
      y = gutter + fontSize;
      ctx.textAlign = 'right';
      break;
  }

  ctx.miterLimit = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 5;
  ctx.font = `${fontSize}px Arial`;

  const text = computeAttributionsText(spec);

  // Number with units
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

/**
 * Compute full attributions text.
 * @param {PrintSpec} spec
 */
export function computeAttributionsText(spec) {
  return (
    spec.layers
      .filter((layer) => !!layer.attribution)
      .map((layer) => layer.attribution)
      .join(', ') || 'Unknown source'
  );
}
