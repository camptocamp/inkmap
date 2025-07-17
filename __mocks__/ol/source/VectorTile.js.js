let errorCallback;

export default class VectorTileSourceMock {
  constructor() {
  }
  setTileLoadFunction() {}
  on(type, callback) {
    if (type === 'tileloaderror') {
      errorCallback = callback;
    }
  }
}
