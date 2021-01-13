import { isWorker } from '../worker/utils';
import { from, Observable } from 'rxjs';

/**
 * Transforms a canvas to a Blob through an observable
 * @param {OffscreenCanvas|HTMLCanvasElement}canvas
 * @return {Observable<Blob>} an observable that will emit the Blob object
 *  and complete immediately.
 */
export function canvasToBlob(canvas) {
  if (isWorker()) return from(canvas.convertToBlob());

  return new Observable((subscriber) => {
    canvas.toBlob((blob) => {
      subscriber.next(blob);
      subscriber.complete();
    }, 'image/png');
  });
}

/**
 * @param {FrameState} rootFrameState
 * @param {ol.layer.Layer} layer
 * @param {number} opacity
 * @return {FrameState}
 */
export function setFrameState(rootFrameState, layer, opacity) {
  return {
    ...rootFrameState,
    layerStatesArray: [
      {
        layer,
        managed: true,
        maxResolution: null,
        maxZoom: null,
        minResolution: 0,
        minZoom: null,
        opacity: opacity !== undefined ? opacity : 1,
        sourceState: 'ready',
        visible: true,
        zIndex: 0,
      },
    ],
  };
}

/**
 *
 * @param {CanvasRenderingContext2D} context
 * @return {function}
 */
export let useContainer = function (context) {
  this.containerReused = false;
  this.canvas = context.canvas;
  this.context = context;
  this.container = {
    firstElementChild: context.canvas,
    style: {
      opacity: 1,
    },
  };
};
