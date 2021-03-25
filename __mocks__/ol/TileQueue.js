const TILE_COUNT_MOCK = 20

export function setQueuedCount(count, remainingTilesCount) {
  instance.queuedCount = count;
  instance.remaining = remainingTilesCount;
  jest.runOnlyPendingTimers();
}

let instance = null

export default class TileQueueMock {
  constructor() {
    this.remaining = TILE_COUNT_MOCK;
    this.queuedCount = TILE_COUNT_MOCK;
    instance = this;
  }
  reprioritize() {}
  loadMoreTiles() {}
  getTilesLoading() {
    return this.remaining;
  }
  get queuedElements_() {
    // this will generate an object with one key per tile
    return new Array(this.queuedCount)
      .fill(0)
      .reduce((prev, curr, index) => ({ ...prev, [index]: true }), {});
  }
}
