export function hasOffscreenCanvasSupport() {
  return !!HTMLCanvasElement.prototype.transferControlToOffscreen;
}

/**
 * Will automatically download the image data as an image file.
 * @param {Blob} imageBlob
 * @param {string} filename
 */
export function downloadBlob(imageBlob, filename) {
  const anchor = document.createElement('a');
  const objectUrl = URL.createObjectURL(imageBlob);
  anchor.setAttribute('download', filename);
  anchor.setAttribute('href', objectUrl);
  anchor.click();
}

/**
 * Resolves to a boolean (true/false) on subscription
 * True means a worker is used for print jobs
 * @type {Promise<boolean>}
 */
export const printerReady = new Promise((resolve) => {
  if (hasOffscreenCanvasSupport()) {
    navigator.serviceWorker.register('inkmap-worker.js').then(
      () => {
        resolve(true);
      },
      (error) => {
        console.log('Service worker registration failed:', error);
      }
    );
  } else {
    resolve(false);
  }
});
