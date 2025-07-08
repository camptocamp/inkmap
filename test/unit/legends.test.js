import getLegends from '../../src/shared/widgets/legends.js';
import PresetSpecs from '../../demo/preset-specs.js';
import 'isomorphic-fetch';

describe('legends', () => {
  describe('getLegends', () => {
    const spec = PresetSpecs['Spec with legends'];
    const expectedUrl =
      'https://ows.terrestris.de/osm/service?' +
      'REQUEST=GetLegendGraphic&SERVICE=WMS&VERSION=1.3.0&LAYER' +
      '=OSM-WMS&FORMAT=image%2Fpng&DPI=72&SCALE=7000000';
    let fetchedUrl;

    it('creates a getLegendGraphic URL for given spec', async () => {
      global.fetch = jest.fn((url) => {
        fetchedUrl = url;
        return Promise.resolve({
          blob: () =>
            Promise.resolve(
              new Blob(['<image src="data:image/png;base64,"></image>'], {
                type: 'image/png',
              }),
            ),
        });
      });
      HTMLImageElement.prototype.decode = () =>
        new Promise((resolve) => resolve());

      const imageBlob = await getLegends(spec);
      expect(fetchedUrl).toBe(expectedUrl);
      expect(imageBlob).toBeDefined();
      expect(imageBlob).toBeInstanceOf(Blob);
    });
  });
});
