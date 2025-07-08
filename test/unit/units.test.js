import { pixelToRealWorld, realWorldToPixel } from '../../src/shared/units.js';

describe('units helpers', () => {
  describe('realWorldToPixel', () => {
    it('returns the correct dimension', () => {
      expect(realWorldToPixel(6.35, 'mm', 200)).toEqual(50);
      expect(realWorldToPixel(0.00635, 'm', 200)).toEqual(50);
      expect(realWorldToPixel(0.635, 'cm', 200)).toEqual(50);
      expect(realWorldToPixel(0.25, 'in', 200)).toEqual(50);
      expect(realWorldToPixel(50, 'px', 200)).toEqual(50);
    });
  });
  describe('pixelToRealWorld', () => {
    it('returns the correct dimension', () => {
      expect(pixelToRealWorld(50, 'mm', 200)).toEqual(6.35);
      expect(pixelToRealWorld(50, 'm', 200)).toEqual(0.00635);
      expect(pixelToRealWorld(50, 'cm', 200)).toEqual(0.635);
      expect(pixelToRealWorld(50, 'in', 200)).toEqual(0.25);
      expect(pixelToRealWorld(50, 'px', 200)).toEqual(50);
    });
  });
});
