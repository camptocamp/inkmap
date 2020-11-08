/**
 * @return {string} Generated print filename
 */
export function getFileName() {
  return `inkmap-${new Date().toISOString().substr(0, 10)}.png`;
}
