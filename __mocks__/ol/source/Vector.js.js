let errorCallback;

export function triggerLoadError(event) {
  errorCallback(event);
}

export default class WFSSourceMock {
  constructor(urls) {
    this.urls = urls;
  }
  getUrls() {
    return this.urls;
  }
  setTileLoadFunction() {}
  on(type, callback) {
    if (type === 'vectorloaderror') { // custom event dispatched for load errors
      errorCallback = callback;
    }
  }
  getState() {
    return 'ready'
  }
}
