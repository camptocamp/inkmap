import { computeAttributionsText } from '../../src/shared/widgets/attributions';

describe('attributions', () => {
  describe('computeAttribution', () => {
    describe('one layer with attribution', () => {
      it('computes the correct attributions', () => {
        expect(
          computeAttributionsText({
            layers: [{ attribution: 'Text abcd' }],
          })
        ).toBe('Text abcd');
      });
    });
    describe('several layers with attribution', () => {
      it('computes the correct attributions', () => {
        expect(
          computeAttributionsText({
            layers: [{ attribution: 'Text abcd' }, { attribution: 'Ef Ghi' }],
          })
        ).toBe('Text abcd, Ef Ghi');
      });
    });
    describe('no layer with attribution', () => {
      it('computes the correct attributions', () => {
        expect(
          computeAttributionsText({
            layers: [{}],
          })
        ).toBe('Unknown source');
      });
    });
  });
});
