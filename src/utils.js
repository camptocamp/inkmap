export function hasOffscreenCanvasSupport() {
  return !!HTMLCanvasElement.prototype.transferControlToOffscreen
}
