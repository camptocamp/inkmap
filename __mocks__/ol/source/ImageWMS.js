let loadCallback;

export function triggerLoadEnd() {
  loadCallback();
}

export default class ImageSourceMock {
  setImageLoadFunction() {}
  once(type, callback) {
    if (type === 'imageloadend') {
      loadCallback = callback;
    }
  }
}
