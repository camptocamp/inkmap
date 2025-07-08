import { getPrintableScaleBar } from '../../src/shared/widgets/scalebar.js';

describe('scalebar utils', () => {
  describe('getPrintableScaleBar', () => {
    /** @type {any} */
    const spec = {
      layers: [],
      dpi: 127,
      scale: 10000,
      projection: 'EPSG:3857',
      center: [4, 40],
    };
    describe('without size hint', () => {
      it('returns an image with an auto-generated width and height of 1.1cm', () => {
        const image = getPrintableScaleBar(spec);
        expect(image.getDpi()).toBe(spec.dpi);
        expect(image.getImage().width).toBe(356);
        expect(image.getImage().height).toBe(55);
        expect(image.getRealWorldDimensions('cm')).toEqual([7.12, 1.1]);
      });
    });
    describe('with size hint (bigger than default)', () => {
      it('returns an image with an auto-generated width (above 10cm) and height of 1.1cm', () => {
        const image = getPrintableScaleBar(spec, [100, 'mm']);
        expect(image.getDpi()).toBe(spec.dpi);
        expect(image.getImage().width).toBe(688);
        expect(image.getImage().height).toBe(55);
        expect(image.getRealWorldDimensions('cm')).toEqual([13.76, 1.1]);
      });
    });
    describe('with size hint (smaller than default)', () => {
      it('returns an image with an auto-generated width (above 15cm) and height of 1.1cm', () => {
        const image = getPrintableScaleBar(spec, [15, 'mm']);
        expect(image.getDpi()).toBe(spec.dpi);
        expect(image.getImage().width).toBe(161);
        expect(image.getImage().height).toBe(55);
        expect(image.getRealWorldDimensions('cm')).toEqual([3.22, 1.1]);
      });
    });
  });
});
