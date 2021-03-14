import { isWorker } from '../worker/utils';
import { from, Observable } from 'rxjs';
import sourceState from 'ol/source/State';

/**
 * Transforms a canvas to a Blob through an observable
 * @param {OffscreenCanvas|HTMLCanvasElement}canvas
 * @return {import('rxjs').Observable<Blob>} an observable that will emit the Blob object
 *  and complete immediately.
 */
export function canvasToBlob(canvas) {
  // @ts-ignore
  if (isWorker()) return from(canvas.convertToBlob());

  return new Observable((subscriber) => {
    /** @type {HTMLCanvasElement} */ (canvas).toBlob((blob) => {
      subscriber.next(blob);
      subscriber.complete();
    }, 'image/png');
  });
}

/**
 * @param {import('ol/PluggableMap').FrameState} rootFrameState
 * @param {import('ol/layer/Layer').default} layer
 * @param {number} [opacity] Opacity (0 to 1), 1 if not defined
 * @return {import('ol/PluggableMap').FrameState}
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
        sourceState,
        visible: true,
        zIndex: 0,
      },
    ],
  };
}

/**
 * Reusable helper for OpenLayers renderers
 * @param {CanvasRenderingContext2D} context
 */
export function useContainer(context) {
  this.containerReused = false;
  this.canvas = context.canvas;
  this.context = context;
  this.container = {
    firstElementChild: context.canvas,
    style: {
      opacity: 1,
    },
  };
}

/**
 * @param {string} baseUrl
 * @param {string} wfsVersion
 * @param {string} layerName
 * @param {string} format
 * @param {string} projCode
 * @param {[number, number, number, number]} extent
 */
export function generateGetFeatureUrl(
  baseUrl,
  wfsVersion,
  layerName,
  format,
  projCode,
  extent
) {
  if (baseUrl.substring(0, 4) !== 'http') {
    return baseUrl;
  }
  const urlObj = new URL(baseUrl);
  const typeNameLabel = wfsVersion === '2.0.0' ? 'typenames' : 'typename';
  urlObj.searchParams.set('SERVICE', 'WFS');
  urlObj.searchParams.set('version', wfsVersion);
  urlObj.searchParams.set('request', 'GetFeature');
  urlObj.searchParams.set(typeNameLabel, layerName);
  urlObj.searchParams.set('srsName', projCode);
  urlObj.searchParams.set('bbox', `${extent.join(',')},${projCode}`);
  if (format === 'geojson') {
    urlObj.searchParams.set('outputFormat', 'application/json');
  }
  return urlObj.href;
}
