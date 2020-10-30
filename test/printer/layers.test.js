import { createLayer } from '../../src/printer/layers';
import { triggerLoadEnd } from '../../__mocks__/ol/source/ImageWMS';

/** @type {FrameState} */
const frameState = {
  animate: false,
  coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
  declutterItems: [],
  extent: [
    -696165.0132013096,
    5090855.383524774,
    3367832.7922398755,
    7122854.286245367,
  ],
  index: 0,
  layerIndex: 0,
  layerStatesArray: [],
  pixelRatio: 1,
  pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
  postRenderFunctions: [],
  size: [800, 400],
  tileQueue: null,
  time: 1604056713131,
  usedTiles: {},
  viewHints: [0, 0],
  viewState: {
    center: [0, 0],
    resolution: 5079.997256801481,
    projection: 'EPSG:3857',
    rotation: 0,
  },
  wantedTiles: {},
};

class TileQueueMock {
  constructor(tileCount) {
    this.remaining = tileCount;
  }
  reprioritize() {}
  loadMoreTiles() {}
  getTilesLoading() {
    return this.remaining > 0;
  }
  get queuedElements_() {
    // this will generate an object with one key per tile
    return new Array(this.remaining)
      .fill(0)
      .reduce((prev, curr, index) => ({ ...prev, [index]: true }), {});
  }
  _setRemainingTiles(count) {
    this.remaining = count;
    jest.runOnlyPendingTimers();
  }
}

jest.useFakeTimers();
describe('layer creation', () => {
  describe('XYZ layer creation', () => {
    /** @type {Layer} */
    const spec = {
      type: 'XYZ',
      url: 'https://my.url/z/y/x.png',
    };
    let layer$;
    let received;
    let tileQueue;
    let completed;

    beforeEach(() => {
      tileQueue = /** @type {TileQueue} */ new TileQueueMock(20);
      completed = false;
      layer$ = createLayer(spec, { ...frameState, tileQueue });
      layer$.subscribe(
        (status) => (received = status),
        null,
        () => (completed = true)
      );
    });

    it('initially emit a status with progress 0', () => {
      expect(received).toEqual([0, null]);
    });

    it('status updates are sent regularly', () => {
      tileQueue._setRemainingTiles(12);
      expect(received).toEqual([0.4, null]);

      tileQueue._setRemainingTiles(2);
      expect(received).toEqual([0.9, null]);
    });

    it('when observable completes, canvas is received', () => {
      tileQueue._setRemainingTiles(0);
      expect(received).toEqual([1, expect.objectContaining({})]);
      expect(completed).toBeTruthy();
    });
  });

  describe('WMS layer creation', () => {
    /** @type {Layer} */
    const spec = {
      type: 'WMS',
      url: 'https://my.url/wms',
      layer: 'SOME_LAYER',
      opacity: 0.4,
    };
    let layer$;
    let received;
    let completed;

    beforeEach(() => {
      completed = false;
      layer$ = createLayer(spec, frameState);
      layer$.subscribe(
        (status) => (received = status),
        null,
        () => (completed = true)
      );
    });

    it('initially emit a status with progress 0', () => {
      expect(received).toEqual([0, null]);
    });

    it('when observable completes, canvas is received', () => {
      triggerLoadEnd();
      jest.runOnlyPendingTimers();

      expect(received).toEqual([1, expect.objectContaining({})]);
      expect(completed).toBeTruthy();
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
