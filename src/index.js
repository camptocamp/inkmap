import {hasOffscreenCanvasSupport} from './utils'
import {timer} from 'rxjs'
import {map, take} from 'rxjs/operators'

if (hasOffscreenCanvasSupport()) {
  navigator.serviceWorker.register('inkmap-worker.js').then(
    () => {},
    error => {
      console.log('Service worker registration failed:', error)
    }
  )
}

/**
 * @typedef {Object} Layer
 * @property {string} type Either `XYZ`, `WMTS` or `WMS`.
 * @property {string} url URL or URL template for the layer; for XYZ layers, a URL can contain the following tokens: `{a-d}` for randomly choosing a letter, `{x}`, `{y}` and `{z}`.
 * @property {string} name Layer name (for WMS and WMTS layers).
 * @property {number} opacity Opacity, from 0 (hidden) to 1 (visible).
 */

/**
 * @typedef {Object} PrintSpec
 * @property {Layer[]} layers Array of `Layer` objects that will be rendered in the map; last layers will be rendered on top of first layers.
 * @property {[number, number]|[number, number, string]} size Width and height in pixels, or in the specified unit in 3rd place; valid units are `px`, `mm`, `cm`, `m` and `in`.
 * @property {[number, number]} center Longitude and latitude of the map center.
 * @property {number} dpi Dot-per-inch, usually 96 for a computer screen and 300 for a detailed print.
 * @property {number} scale Scale denominator.
 * @property {string} projection EPSG projection code.
 */

/**
 * @typedef {Object} PrintStatus
 * @property {number} id Job id.
 * @property {number} progress Job progress, from 0 to 1.
 * @property {string} status Either `'pending'`, `'ongoing'` or `'finished'`.
 * @property {string} resultImageUrl An URL used to access the print result (PNG image). This will only be available once the job status is `'finished'`
 */

/**
 * Starts generating a map image from a print spec.
 * @param {PrintSpec} printSpec
 * @return {Observable<PrintStatus>} Observable emitting print statuses, completes when the print job is over.
 */
export function print(printSpec) {
  return timer(100, 200).pipe(
    take(11),
    map(index => ({
      progress: index / 10
    }))
  )
}
