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
        // this will wait for the current window to be claimed by the worker
        setTimeout(() => {
          // a worker still may not be available, i.e. after a force refresh
          // use the library on the main thread in this case
          if (!navigator.serviceWorker.controller) resolve(false);
          resolve(true);
        }, 100);
      },
      () => {
        console.log(
          '[inkmap] Service worker was not found. See https://github.com/camptocamp/inkmap for using multi-threading'
        );
        resolve(false);
      }
    );
  } else {
    resolve(false);
  }
});

/** Pseudorandom UUIDv4 generator. Source: https://stackoverflow.com/a/2117523 */
export function uuidv4() {
  return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c) => {
    const int = parseInt(c);
    return (
      int ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (int / 4)))
    ).toString(16);
  });
}

printerReady.then((useWorker) =>
  console.log(
    `[inkmap] Ready, ${useWorker ? 'using worker' : 'using main thread'}`
  )
);
