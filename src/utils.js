import {isWorker} from './worker/utils'
import {fromPromise} from 'rxjs/internal-compatibility'
import {Observable} from 'rxjs'

export function hasOffscreenCanvasSupport() {
  return !!HTMLCanvasElement.prototype.transferControlToOffscreen
}

/**
 * Will automatically download the image data as an image file.
 * @param {Blob} imageBlob
 * @param {string} filename
 */
export function downloadBlob(imageBlob, filename) {
  const anchor = document.createElement('a')
  const objectUrl = URL.createObjectURL(imageBlob)
  anchor.setAttribute('download', filename)
  anchor.setAttribute('href', objectUrl)
  anchor.click()
}

/**
 * Transforms a canvas to a Blob through an observable
 * @param {OffscreenCanvas|HTMLCanvasElement}canvas
 * @return {Observable<Blob>} an observable that will emit the Blob object
 *  and complete immediately.
 */
export function canvasToBlob(canvas) {
  if (isWorker()) return fromPromise(canvas.convertToBlob())

  return new Observable((subscriber => {
    canvas.toBlob(blob => {
      subscriber.next(blob)
      subscriber.complete()
    }, 'image/png')
  }))
}
