class Image extends OffscreenCanvas {
  constructor() {
    super(1, 1)
    this.setSize(1, 1)
    this.loadPromiseResolver = null
    this.loadPromise = new Promise(resolve => this.loadPromiseResolver = resolve)
  }
  setSize(width, height) {
    this.width = width
    this.height = height
    this.naturalWidth = width
    this.naturalHeight = height
  }
  addEventListener(eventName, callback) {
    if (eventName === 'load') {
      this.loadPromise.then(callback)
    }
  }
  removeEventListener() {}
  loaded() {
    this.loadPromiseResolver()
  }
}
self.Image = Image
