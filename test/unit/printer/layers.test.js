import {
  cancel$,
  createLayer,
  getWMSParams,
} from '../../../src/printer/layers.js';
import { generateGetFeatureUrl } from '../../../src/printer/utils.js';
import ImageWMSSourceMock, {
  triggerLoadEnd,
  triggerLoadError,
} from '../../../__mocks__/ol/source/ImageWMS.js.js';
import TileWMSSourceMock, {
  triggerLoadError as triggerTileWMSError,
} from '../../../__mocks__/ol/source/TileWMS.js.js';
import XYZSourceMock, {
  triggerLoadError as triggerXYZError,
} from '../../../__mocks__/ol/source/XYZ.js';
import { setQueuedCount } from '../../../__mocks__/ol/TileQueue.js.js';
import { applyStyle } from 'ol-mapbox-style';
import VectorTileLayer from 'ol/layer/VectorTile.js';

/** @type {import('ol/Map').FrameState} */
const frameState = {
  animate: false,
  coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
  declutterItems: [],
  extent: [
    -696165.0132013096, 5090855.383524774, 3367832.7922398755,
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

export class SourceEventMock {
  constructor(target) {
    this.target = target;
  }
}

jest.useFakeTimers();

describe('layer creation', () => {
  describe('XYZ layer creation', () => {
    const jobId = 1;
    /** @type {Layer} */
    const spec = {
      type: 'XYZ',
      url: 'https://my.url/z/y/x.png',
    };
    let layer$;
    let received;
    let completed;
    const xyzSourceMock = new XYZSourceMock(['testurl']);
    const tileErrorEventMock = new SourceEventMock(xyzSourceMock);

    beforeEach(async () => {
      completed = false;
      layer$ = await createLayer(jobId, spec, frameState);
      layer$.subscribe(
        (status) => (received = status),
        null,
        () => (completed = true),
      );
    });

    it('initially emit a status with progress 0', () => {
      expect(received).toEqual([0, null, undefined]);
    });

    it('status updates are sent regularly', () => {
      setQueuedCount(12, 12);
      expect(received).toEqual([0.4, null, undefined]);

      setQueuedCount(2, 2);
      expect(received).toEqual([0.9, null, undefined]);
    });

    it('when no queued elements left but tiles are remaining, do not complete', () => {
      setQueuedCount(0, 2);
      expect(received).toEqual([0.999, null, undefined]);
    });

    it('when observable completes, canvas is received', () => {
      setQueuedCount(0, 0);
      expect(received).toEqual([1, expect.anything(), undefined]);
      expect(completed).toBeTruthy();
    });

    it('when error occurs during tile loading, error url is received', () => {
      triggerXYZError(tileErrorEventMock);
      setQueuedCount(2, 2);
      expect(received).toEqual([0.9, null, 'testurl']);
    });

    it('when observable completes with error, canvas and error url are received', () => {
      triggerXYZError(tileErrorEventMock);
      setQueuedCount(0, 0);
      expect(received).toEqual([1, expect.anything(), 'testurl']);
      expect(completed).toBeTruthy();
    });

    it('when canceled, canvas and error are not defined, then complete', () => {
      cancel$.next(1);
      expect(received).toEqual([-1, null, undefined]);
      expect(completed).toBeTruthy();
    });
  });

  describe('WMS layer', () => {
    describe('single image WMS layer parameter construction', () => {
      it('returns the correct params (without version)', () => {
        expect(
          getWMSParams({
            type: 'WMS',
            url: 'https://my.url/wms',
            layer: 'SOME_LAYER',
          }),
        ).toEqual({
          LAYERS: 'SOME_LAYER',
          VERSION: '1.3.0',
        });
      });
      it('returns the correct params (with version)', () => {
        expect(
          getWMSParams({
            type: 'WMS',
            url: 'https://my.url/wms',
            layer: 'SOME_LAYER',
            version: '1.1.1',
          }),
        ).toEqual({
          LAYERS: 'SOME_LAYER',
          VERSION: '1.1.1',
        });
      });
      it('returns the correct params (with token) as customParams', () => {
        expect(
          getWMSParams({
            type: 'WMS',
            url: 'https://my.url/wms',
            layer: 'SOME_LAYER',
            customParams: { token: 'test' },
          }),
        ).toEqual({
          LAYERS: 'SOME_LAYER',
          VERSION: '1.3.0',
          token: 'test',
        });
      });
    });

    describe('tiled WMS layer parameter construction', () => {
      it('returns the correct params (without version)', () => {
        expect(
          getWMSParams({
            type: 'WMS',
            url: 'https://my.url/wms',
            layer: 'SOME_LAYER',
            tiled: true,
          }),
        ).toEqual({
          LAYERS: 'SOME_LAYER',
          VERSION: '1.3.0',
          TILED: true,
        });
      });
      it('returns the correct params (with version)', () => {
        expect(
          getWMSParams({
            type: 'WMS',
            url: 'https://my.url/wms',
            layer: 'SOME_LAYER',
            version: '1.1.1',
            tiled: true,
          }),
        ).toEqual({
          LAYERS: 'SOME_LAYER',
          VERSION: '1.1.1',
          TILED: true,
        });
      });
    });

    describe('WMS layer creation', () => {
      const jobId = 1;
      /** @type {Layer} */
      const spec = {
        type: 'WMS',
        url: 'https://my.url/wms',
        layer: 'SOME_LAYER',
        opacity: 0.4,
        projection: 'EPSG:6870',
      };
      let layer$;
      let received;
      let completed;
      const imageWMSSourceMock = new ImageWMSSourceMock('testurl');
      const errorEventMock = new SourceEventMock(imageWMSSourceMock);

      beforeEach(async () => {
        completed = false;
        layer$ = await createLayer(jobId, spec, frameState);
        layer$.subscribe(
          (status) => (received = status),
          null,
          () => (completed = true),
        );
      });

      it('initially emit a status with progress 0', () => {
        expect(received).toEqual([0, null, undefined]);
      });

      it('when observable completes, canvas is received', () => {
        triggerLoadEnd();
        jest.runOnlyPendingTimers();

        expect(received).toEqual([1, expect.anything(), undefined]);
        expect(completed).toBeTruthy();
      });

      it('when observable completes with error, canvas and error url are received', () => {
        triggerLoadError(errorEventMock);
        jest.runOnlyPendingTimers();

        expect(received).toEqual([1, expect.anything(), 'testurl']);
        expect(completed).toBeTruthy();
      });
    });

    describe('tiled WMS layer creation', () => {
      const jobId = 1;
      /** @type {Layer} */
      const spec = {
        type: 'WMS',
        url: 'https://my.url/wms',
        layer: 'SOME_LAYER',
        opacity: 0.4,
        tiled: true,
        projection: 'EPSG:6870',
      };
      let layer$;
      let received;
      let completed;
      const tileWMSSourceMock = new TileWMSSourceMock(['testurl']);
      const tileErrorEventMock = new SourceEventMock(tileWMSSourceMock);

      beforeEach(async () => {
        completed = false;
        layer$ = await createLayer(jobId, spec, frameState);
        layer$.subscribe(
          (status) => (received = status),
          null,
          () => (completed = true),
        );
      });

      it('initially emit a status with progress 0', () => {
        expect(received).toEqual([0, null, undefined]);
      });

      it('status updates are sent regularly', () => {
        setQueuedCount(12, 12);
        expect(received).toEqual([0.4, null, undefined]);

        setQueuedCount(2, 2);
        expect(received).toEqual([0.9, null, undefined]);
      });

      it('when no queued elements left but tiles are remaining, do not complete', () => {
        setQueuedCount(0, 2);
        expect(received).toEqual([0.999, null, undefined]);
      });

      it('when observable completes, canvas is received', () => {
        setQueuedCount(0, 0);
        expect(received).toEqual([1, expect.anything(), undefined]);
        expect(completed).toBeTruthy();
      });

      it('when error occurs during tile loading, error url is received', () => {
        triggerTileWMSError(tileErrorEventMock);
        setQueuedCount(2, 2);
        expect(received).toEqual([0.9, null, 'testurl']);
      });

      it('when observable completes with error, canvas and error url are received', () => {
        triggerTileWMSError(tileErrorEventMock);
        setQueuedCount(0, 0);
        expect(received).toEqual([1, expect.anything(), 'testurl']);
        expect(completed).toBeTruthy();
      });

      it('when canceled, canvas and error are not defined, then complete', () => {
        cancel$.next(1);
        expect(received).toEqual([-1, null, undefined]);
        expect(completed).toBeTruthy();
      });
    });
  });

  describe('WFS layer creation', () => {
    const jobId = 1;
    /** @type {Layer} */
    const spec = {
      type: 'WFS',
      url: 'https://my.url/wfs',
      layer: 'my:layername',
      format: 'geojson',
      version: '1.1.0',
    };
    let layer$;
    let received;
    let completed;

    beforeEach(async () => {
      completed = false;
      layer$ = await createLayer(jobId, spec, frameState);
      layer$.subscribe(
        (status) => (received = status),
        null,
        () => (completed = true),
      );
    });

    it('initially emit a status with progress 0', () => {
      expect(received).toEqual([0, null]);
    });

    it('generates GetFeature URL according to spec', () => {
      const url = generateGetFeatureUrl(
        spec.url,
        spec.version,
        spec.layer,
        spec.format,
        frameState.viewState.projection,
        frameState.extent,
      );
      expect(url).toEqual(
        'https://my.url/wfs?SERVICE=WFS&version=1.1.0&request=GetFeature&typename=my%3Alayername&srsName=EPSG%3A3857&bbox=-696165.0132013096%2C5090855.383524774%2C3367832.7922398755%2C7122854.286245367%2CEPSG%3A3857&outputFormat=application%2Fjson',
      );
    });
  });

  describe('GeoJSON layer creation', () => {
    const jobId = 1;
    /** @type {Layer} */
    const spec = {
      type: 'GeoJSON',
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test Point',
            },
          },
        ],
      },
      style: {
        name: 'Demo Style',
        rules: [
          {
            name: 'Rule 1',
            symbolizers: [
              {
                kind: 'Line',
                color: 'blue',
                width: 3,
              },
            ],
          },
        ],
      },
    };
    let layer$;
    let received;
    let completed;

    beforeEach(async () => {
      completed = false;
      layer$ = await createLayer(jobId, spec, { ...frameState });
      layer$.subscribe(
        (status) => (received = status),
        console.error,
        () => (completed = true),
      );
    });

    it('initially emit a status with progress 0', () => {
      expect(received).toEqual([0, null]);
    });

    it('after waiting the layer completes', async () => {
      await jest.advanceTimersByTimeAsync(2000);
      expect(received).toEqual([1, expect.anything()]);
      expect(completed).toBeTruthy();
    });
  });

  describe('VectorTile layer creation (without style json)', () => {
    const jobId = 1;
    /** @type {Layer} */
    const spec = {
      type: 'VectorTile',
      url: '/VectorTileServer/tile/{z}/{y}/{x}.pbf',
      style: {
        name: 'Demo Style',
        rules: [
          {
            name: 'Rule 1',
            symbolizers: [
              {
                kind: 'Line',
                color: 'blue',
                width: 3,
              },
            ],
          },
        ],
      },
    };
    let layer$;
    let received;
    let completed;

    beforeEach(async () => {
      completed = false;
      layer$ = await createLayer(jobId, spec, { ...frameState });
      layer$.subscribe(
        (status) => (received = status),
        console.error,
        () => (completed = true),
      );
    });

    it('initially emit a status with progress 0 (once style is parsed)', async () => {
      await jest.advanceTimersByTimeAsync(500);
      expect(received).toEqual([0, null]);
    });

    it('does not call applyStyle() from ol-mapbox-style', () => {
      expect(applyStyle).not.toHaveBeenCalled();
    });
  });

  describe('VectorTile layer creation (with style json)', () => {
    const jobId = 1;
    /** @type {Layer} */
    const spec = {
      type: 'VectorTile',
      styleUrl: 'http://localhost/VectorTileServer/style.json',
    };
    let layer$;
    let received;
    let completed;

    describe('nominal style JSON', () => {
      beforeEach(() => {
        window.fetch = () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                version: 8,
                sprite: 'http://localhost/VectorTileServer/sprite',
                glyphs: '../fonts/{fontstack}/{range}.pbf',
                sources: {
                  esri: {
                    type: 'vector',
                    url: 'http://localhost/VectorTileServer/source.json',
                  },
                },
                layers: [],
              }),
          });
      });

      beforeEach(async () => {
        completed = false;
        layer$ = await createLayer(jobId, spec, { ...frameState });
        layer$.subscribe(
          (status) => (received = status),
          console.error,
          () => (completed = true),
        );
      });

      it('initially emit a status with progress 0', () => {
        expect(received).toEqual([0, null]);
      });

      it('does call applyStyle() from ol-mapbox-style', () => {
        expect(applyStyle).toHaveBeenCalled();
      });
    });

    describe('style JSON containing relative paths', () => {
      beforeEach(() => {
        window.fetch = () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                version: 8,
                sprite: './sprite',
                glyphs: '../fonts/{fontstack}/{range}.pbf',
                sources: {
                  esri: {
                    type: 'vector',
                    url: './source.json',
                  },
                },
                layers: [],
              }),
          });
      });

      beforeEach(async () => {
        await createLayer(jobId, spec, { ...frameState }).subscribe();
      });

      it('does call applyStyle() with corrected URLs (not relative)', () => {
        expect(applyStyle).toHaveBeenCalledWith(expect.any(VectorTileLayer), {
          glyphs: '../fonts/{fontstack}/{range}.pbf',
          layers: [],
          sources: {
            esri: {
              type: 'vector',
              url: 'http://localhost/VectorTileServer/source.json',
            },
          },
          sprite: 'http://localhost/VectorTileServer/sprite',
          version: 8,
        });
      });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });
});
