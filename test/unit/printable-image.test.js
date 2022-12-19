import { PrintableImage } from '../../src/main/printable-image';

describe('PrintableImage', () => {
  let printableImage;

  beforeEach(() => {
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 100;
    canvasEl.height = 50;
    printableImage = new PrintableImage(canvasEl, 200);
  });

  describe('#getImage', () => {
    it('returns the source image', () => {
      expect(printableImage.getImage()).toBeInstanceOf(HTMLCanvasElement);
    });
  });

  describe('#getDpi', () => {
    it('returns the source dpi', () => {
      expect(printableImage.getDpi()).toBe(200);
    });
  });

  describe('#getRealWorldDimensions', () => {
    it('returns an array of real world dimensions', () => {
      expect(printableImage.getRealWorldDimensions('mm')).toEqual([12.7, 6.35]);
      expect(printableImage.getRealWorldDimensions('m')).toEqual([
        0.0127, 0.00635,
      ]);
      expect(printableImage.getRealWorldDimensions('in')).toEqual([0.5, 0.25]);
    });
    it('throws an error on invalid unit', () => {
      expect(() =>
        printableImage.getRealWorldDimensions('zzzz')
      ).toThrowError();
    });
  });
});
