import {
  getPrintableLegend,
  getLegendAsSvg,
} from '../../src/shared/widgets/legends';
import PresetSpecs from '../../demo/preset-specs';
import 'isomorphic-fetch';
import { PrintableImage } from '../../src/main/printable-image';

describe('legends', () => {
  const spec = { ...PresetSpecs['Spec with legends'], dpi: 100 };
  const expectedUrl = `https://ows.terrestris.de/osm/service?REQUEST=GetLegendGraphic&SERVICE=WMS&VERSION=1.3.0&LAYER=OSM-WMS&FORMAT=image%2Fpng&DPI=100&SCALE=7000000`;
  let fetchedUrl;
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn((url) => {
      fetchedUrl = url;
      return Promise.resolve({
        blob: () =>
          Promise.resolve(
            new Blob(['<image src="data:image/png;base64,"></image>'], {
              type: 'image/png',
            })
          ),
      });
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getLegendAsSvg', () => {
    it('creates a getLegendGraphic URL for given spec', async () => {
      global.fetch = jest.fn((url) => {
        fetchedUrl = url;
        return Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['<image src="data:image/png;base64,"></image>'], {
                type: 'image/png',
              })
            ),
        });
      });
      HTMLImageElement.prototype.decode = () =>
        new Promise((resolve) => resolve());

      const imageBlob = await getLegendAsSvg(spec);
      expect(fetchedUrl).toBe(expectedUrl);
      expect(imageBlob).toBeDefined();
      expect(imageBlob).toBeInstanceOf(Blob);
    });
  });

  describe('getPrintableLegend', () => {
    it('creates a getLegendGraphic URL for given spec', async () => {
      HTMLImageElement.prototype.decode = () =>
        new Promise((resolve) => resolve());

      const image = await getPrintableLegend(spec);
      expect(fetchedUrl).toBe(expectedUrl);
      expect(image).toBeInstanceOf(PrintableImage);
      expect(image.getRealWorldDimensions('mm')).toEqual([151.13, 213.868]);
    });
  });
});
