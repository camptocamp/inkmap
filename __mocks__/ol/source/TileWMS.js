let errorCallback;

export function triggerLoadError(event) {
  errorCallback(event);
}

export default class TileWMSSourceMock {
  constructor(urls) {
    this.urls = urls;
  }
  getUrls() {
    return this.urls;
  }
  setTileLoadFunction() {}
  on(type, callback) {
    if (type === 'tileloaderror') {
      errorCallback = callback;
    }
  }
}
