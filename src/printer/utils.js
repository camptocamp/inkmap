import { isWorker } from '../worker/utils';
import { from, Observable } from 'rxjs';
import { fromLonLat, get as getProjection } from 'ol/proj';
import {
  registerWithExtent,
  search as searchProjection,
} from '../shared/projections';
import { getForViewAndSize } from 'ol/extent';
import TileQueue, {
  getTilePriority as tilePriorityFunction,
} from 'ol/TileQueue';
import { CM_PER_INCH } from '../shared/constants';
import { scaleToResolution } from '../shared/units';

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
 * Returns an OpenLayers frame state for a given job spec
 * This frame state will be used as a basis for all layers
 * @param {import('../main/index.js').PrintSpec} spec
 * @param {Array} sizeInPixel
 * @return {Promise<import('ol/Map').FrameState>}
 */
export async function getJobFrameState(spec, sizeInPixel) {
  let projection = getProjection(spec.projection);

  if (!projection && spec.projection.startsWith('EPSG:')) {
    const splitted = spec.projection.split(':');
    const { name, proj4def, bbox } = await searchProjection(splitted[1]);
    registerWithExtent(name, proj4def, bbox);
    projection = getProjection(spec.projection);
  }

  const resolution = scaleToResolution(spec.projection, spec.scale, spec.dpi);

  const viewState = {
    center: fromLonLat(spec.center, projection),
    resolution,
    projection,
    rotation: 0,
    zoom: 1,
  };

  return {
    animate: false,
    coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
    // @ts-ignore
    declutterTree: [],
    mapId: '',
    renderTargets: {},
    extent: getForViewAndSize(
      viewState.center,
      viewState.resolution,
      viewState.rotation,
      sizeInPixel,
    ),
    index: 0,
    layerIndex: 0,
    layerStatesArray: [],
    pixelRatio: 1,
    pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
    postRenderFunctions: [],
    size: sizeInPixel,
    time: Date.now(),
    usedTiles: {},
    viewState,
    viewHints: [0, 0],
    wantedTiles: {},
    tileQueue: null, // tile queue is created for each layer
  };
}

/**
 * Returns the map canvas size in pixels based on size units and dpi given in spec
 * @param {import('../main/index.js').PrintSpec} spec
 * @return {[number, number]}
 */
export function calculateSizeInPixel(spec) {
  const { size, dpi } = spec;
  if (!size[2] || size[2] === 'px') {
    return [size[0], size[1]];
  }
  let pixelX;
  let pixelY;
  const unit = size[2];

  switch (unit) {
    case 'in':
      pixelX = dpi * size[0];
      pixelY = dpi * size[1];
      break;
    case 'cm':
      pixelX = (dpi * size[0]) / CM_PER_INCH;
      pixelY = (dpi * size[1]) / CM_PER_INCH;
      break;
    case 'mm':
      pixelX = (dpi * size[0]) / (CM_PER_INCH * 10);
      pixelY = (dpi * size[1]) / (CM_PER_INCH * 10);
      break;
    case 'm':
      pixelX = (dpi * size[0] * 100) / CM_PER_INCH;
      pixelY = (dpi * size[1] * 100) / CM_PER_INCH;
      break;
    default:
      pixelX = size[0];
      pixelY = size[1];
  }

  return [Math.round(pixelX), Math.round(pixelY)];
}

/**
 * Adapt a generic OL frame state to work with a specific layer
 * @param {import('ol/Map').FrameState} rootFrameState
 * @param {import('ol/layer/Layer').default} layer
 * @param {number} [opacity] Opacity (0 to 1), 1 if not defined
 * @return {import('ol/Map').FrameState}
 */
export function makeLayerFrameState(rootFrameState, layer, opacity) {
  let fakeTime = 0;
  let frameState = {
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
        sourceState: '',
        visible: true,
        zIndex: 0,
      },
    ],
    // this is used to make sure that tile transitions are skipped
    // TODO: remove this once the reprojected tile transitions are fixed in OL
    get time() {
      fakeTime += 10000;
      return fakeTime;
    },
  };
  frameState.tileQueue = new TileQueue(
    (tile, tileSourceKey, tileCenter, tileResolution) =>
      tilePriorityFunction(
        frameState,
        tile,
        tileSourceKey,
        tileCenter,
        tileResolution,
      ),
    () => {},
  );
  return frameState;
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
 * @param {number[]} extent
 */
export function generateGetFeatureUrl(
  baseUrl,
  wfsVersion,
  layerName,
  format,
  projCode,
  extent,
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
