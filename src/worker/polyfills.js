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
    this.width = this.naturalWidth = 0;
    this.height = this.naturalHeight = 0;
    this.src_ = null;
    this.loadPromiseResolver = null;
    this.loadPromiseRejecter = null;
    this.loadPromise = new Promise((resolve, reject) => {
      this.loadPromiseResolver = resolve;
      this.loadPromiseRejecter = reject;
    });
  }

  // setting `src` will trigger a loading of the image and a trigger of a `load` event eventually
  set src(url) {
    this.src_ = url;
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => createImageBitmap(blob))
      .then((imageData) => {
        this.width = this.naturalWidth = imageData.width;
        this.height = this.naturalHeight = imageData.height;
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

self.window = {
  devicePixelRatio: 1,
  location: self.location,
};
self.document = {
  fonts: self.fonts,
};
