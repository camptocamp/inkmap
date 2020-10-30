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
