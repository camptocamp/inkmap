/**
 * Generate a filename based on the current date.
 *
 *  @param ending File-ending to use. Defaults to 'png'.
 *
 */
export function generateFileName(ending = 'png') {
  const date = new Date().toISOString().substr(0, 19).replaceAll(':', '_');
  const filename = `inkmap-${date}.${ending}`;
  return filename;
}
