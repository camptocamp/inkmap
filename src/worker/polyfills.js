/**
 * This defines an Image class on the worker thread, to allow libraries such as
 * OpenLayers to work more or less seamlessly.
 * Image elements are useful for loading images over HTTP and decoding them,
 * but unfortunately this is not available in workers. As such, this replaces
 * the Image class with a extended OffscreenCanvas class so as to sort of
 * reproduce the Image class behaviour.
 */
class Image extends OffscreenCanvas {
  constructor() {
    super(1, 1);
    this.src_ = null;
    this.hintImageSize(1, 1);
    this.loadPromiseResolver = null;
    this.loadPromiseRejecter = null;
    this.loadPromise = new Promise((resolve, reject) => {
      this.loadPromiseResolver = resolve;
      this.loadPromiseRejecter = reject;
    });
  }

  // this is a new API, required because we cannot guess an image size
  // simply from the blob received by `fetch`
  hintImageSize(width, height) {
    this.width = width;
    this.height = height;
    this.naturalWidth = width;
    this.naturalHeight = height;
  }

  // setting `src` will trigger a loading of the image and a trigger of a `load` event eventually
  set src(url) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        return createImageBitmap(blob);
      })
      .then((imageData) => {
        const ctx = this.getContext('2d');
        ctx.drawImage(imageData, 0, 0);
        return this.loadPromiseResolver();
      })
      .catch(this.loadPromiseRejecter);
  }
  get src() {
    return this.src_;
  }

  // this is to sort of comply with the HTMLImage API
  /**
   * @param {'load'|'error'} eventName
   * @param {function(): void} callback
   */
  addEventListener(eventName, callback) {
    if (eventName === 'load') {
      // error can be silenced since we can catch it with the 'error' event
      this.loadPromise.then(callback).catch(() => {});
    } else if (eventName === 'error') {
      this.loadPromise.catch(callback);
    }
  }
  removeEventListener() {}
}

self.Image = Image;

/**
 * This class allows using `document.createElement('canvas')` on the worker.
 */
class FakeDocument {
  createElement(type) {
    if (type === 'canvas') {
      return new OffscreenCanvas(1, 1);
    }
  }
}

// @ts-ignore
self.document = new FakeDocument();

class FakeHTMLVideoElement {
  constructor() {}
}

self.HTMLImageElement = Image;
self.HTMLCanvasElement = OffscreenCanvas;
self.HTMLVideoElement = FakeHTMLVideoElement;
