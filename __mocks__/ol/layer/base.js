export default class LayerMock {
  constructor(options) {
    if (options.source) {
      this.source = options.source;
    }
  }
  getRenderer() {
    return {
      renderFrame() {},
      prepareFrame() {},
      ready: true
    };
  }
  setSource(source) {
    this.source = source;
  }
  getSource() {
    return this.source;
  }
  setStyle() {
    // do nothing
  }
}
