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
    };
  }
  setSource(source) {
    this.source = source;
  }
  getSource() {
    return this.source;
  }
}
