let loadCallback;
let errorCallback;

export function triggerLoadEnd() {
  loadCallback();
}

export function triggerLoadError(event) {
  errorCallback(event);
}

export default class ImageWMSSourceMock {
  constructor(url) {
    this.url = url;
  }
  getUrl() {
    return this.url;
  }
  setImageLoadFunction() {}
  once(type, callback) {
    if (type === 'imageloadend') {
      loadCallback = callback;
    }
    if (type === 'imageloaderror') {
      errorCallback = callback;
    }
  }
}
