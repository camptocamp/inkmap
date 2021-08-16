import { applyWidgetPositionTransform } from '../../../src/printer/widgets/position';
import { CM_PER_INCH } from '../../../src/shared/constants';

describe('widgets', () => {
  describe('position utils', () => {
    describe('applyWidgetPositionTransform', () => {
      let ctxMock;
      beforeEach(() => {
        ctxMock = {
          canvas: { width: 300, height: 400 },
          translate: jest.fn(),
        };
      });
      it('translates context according to position (bottom left)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'north-arrow',
          'bottom-left',
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(8, 332);
      });
      it('translates context according to position (top left)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'north-arrow',
          'top-left',
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(8, 8);
      });
      it('translates context according to position (bottom right)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'north-arrow',
          'bottom-right',
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(252, 332);
      });
      it('translates context according to position (top right)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'north-arrow',
          'top-right',
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(252, 8);
      });
      it('translates context according to position (auto, north-arrow)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'north-arrow',
          true,
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(252, 8);
      });
      it('translates context according to position (auto, scalebar)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'scalebar',
          true,
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(8, 332);
      });
      it('translates context according to position (auto, attributions)', () => {
        applyWidgetPositionTransform(
          ctxMock,
          'attributions',
          true,
          [40, 60],
          CM_PER_INCH * 20
        );
        expect(ctxMock.translate).toHaveBeenCalledWith(252, 332);
      });
    });
  });
});
