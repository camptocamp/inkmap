import { getPrintableNorthArrow } from '../../src/shared/widgets/north-arrow';

describe('north arrow utils', () => {
  describe('getPrintableNorthArrow', () => {
    /** @type {any} */
    const spec = {
      layers: [],
      dpi: 127,
    };
    describe('without size hint', () => {
      it('returns an image with a size equivalent to 30mm', () => {
        const image = getPrintableNorthArrow(spec);
        expect(image.getDpi()).toBe(spec.dpi);
        expect(image.getImage().width).toBe(150);
        expect(image.getImage().height).toBe(150);
        expect(image.getRealWorldDimensions('cm')).toEqual([3, 3]);
      });
    });
    describe('with size hint', () => {
      it('returns an image with a size equivalent to 45mm', () => {
        const image = getPrintableNorthArrow(spec, [45, 'mm']);
        expect(image.getDpi()).toBe(spec.dpi);
        expect(image.getImage().width).toBe(225);
        expect(image.getImage().height).toBe(225);
        expect(image.getRealWorldDimensions('cm')).toEqual([4.5, 4.5]);
      });
    });
  });
});
