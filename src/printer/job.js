import TileQueue, {
  getTilePriority as tilePriorityFunction,
} from 'ol/TileQueue';
import { fromLonLat, get as getProj } from 'ol/proj';
import { getForViewAndSize } from 'ol/extent';
import { createLayer } from './layers';
import { createCanvasContext2D } from 'ol/dom';
import { combineLatest, of } from 'rxjs';
import { map, switchMap, takeWhile } from 'rxjs/operators';
import { canvasToBlob } from './utils';
import { messageToMain } from './exchange';
import { MESSAGE_JOB_STATUS, METRIC_DENOMINATOR } from '../shared/constants';
import { printNorthArrow } from './north-arrow';
import { printScaleBar } from './scalebar';

let counter = 0;

/**
 * Add a new job in the queue
 * Note: this will broadcast the job status updates to the main thread
 * until the job is over.
 * @param {PrintSpec} spec
 */
export function createJob(spec) {
  const sizeInPixel = calculateSizeInPixel(spec);
  const frameState = getFrameState(spec, sizeInPixel);

  /**
   * @type {PrintStatus}
   */
  const job = {
    id: counter++,
    spec,
    status: 'pending',
    progress: 0,
  };

  const context = createCanvasContext2D(sizeInPixel[0], sizeInPixel[1]);

  combineLatest(
    spec.layers.map((layer) => {
      return createLayer(layer, frameState);
    })
  )
    .pipe(
      switchMap((layerStates) => {
        const allReady = layerStates.every(([progress]) => progress === 1);

        if (allReady) {
          for (let i = 0; i < layerStates.length; i++) {
            context.drawImage(layerStates[i][1], 0, 0);
          }
          if (spec.northArrow) {
            printNorthArrow(context, spec.northArrow);
          }
          if (spec.scaleBar) {
            printScaleBar(context, frameState, spec);
          }
          return canvasToBlob(context.canvas).pipe(map((blob) => [1, blob]));
        } else {
          const rawProgress =
            layerStates.reduce((prev, [progress]) => progress + prev, 0) /
            layerStates.length;
          const progress = parseFloat(rawProgress.toFixed(4)); // only keep 4 digits precision

          return of([progress, null]);
        }
      }),
      map(([progress, imageBlob]) => {
        return {
          ...job,
          progress,
          imageBlob,
          status: progress === 1 ? 'finished' : 'ongoing',
        };
      }),
      takeWhile((jobStatus) => jobStatus.progress < 1, true)
    )
    .subscribe((status) => messageToMain(MESSAGE_JOB_STATUS, { status }));
}

/**
 * Returns an OpenLayers frame state for a given job spec
 * @param {PrintSpec} spec
 * @param {Array} pixelSize
 * @return {FrameState}
 */
function getFrameState(spec, pixelSize) {
  const projection = getProj(spec.projection);
  const inchPerMeter = 39.3701;
  const resolution =
    spec.scale / spec.dpi / inchPerMeter / projection.getMetersPerUnit();

  const viewState = {
    center: fromLonLat(spec.center, projection),
    resolution,
    projection,
    rotation: 0,
  };

  const frameState = {
    animate: false,
    coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
    declutterItems: [],
    extent: getForViewAndSize(
      viewState.center,
      viewState.resolution,
      viewState.rotation,
      pixelSize
    ),
    index: 0,
    layerIndex: 0,
    layerStatesArray: [],
    pixelRatio: 1,
    pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
    postRenderFunctions: [],
    size: pixelSize,
    time: Date.now(),
    usedTiles: {},
    viewState: viewState,
    viewHints: [0, 0],
    wantedTiles: {},
  };

  frameState.tileQueue = new TileQueue(
    (tile, tileSourceKey, tileCenter, tileResolution) =>
      tilePriorityFunction(
        frameState,
        tile,
        tileSourceKey,
        tileCenter,
        tileResolution
      ),
    () => {}
  );

  return frameState;
}

/**
 * Returns the map canvas size in pixels based on size units and dpi given in spec
 * @param {PrintSpec} spec
 * @return {Array<Number>}
 */
function calculateSizeInPixel(spec) {
  const { size, dpi } = spec;
  if (!size[2] || size[2] === 'px') {
    return size;
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
      pixelX = (dpi * size[0]) / METRIC_DENOMINATOR;
      pixelY = (dpi * size[1]) / METRIC_DENOMINATOR;
      break;
    case 'mm':
      pixelX = (dpi * size[0]) / (METRIC_DENOMINATOR * 10);
      pixelY = (dpi * size[1]) / (METRIC_DENOMINATOR * 10);
      break;
    case 'm':
      pixelX = (dpi * size[0] * 100) / METRIC_DENOMINATOR;
      pixelY = (dpi * size[1] * 100) / METRIC_DENOMINATOR;
      break;
    default:
      pixelX = size[0];
      pixelY = size[1];
  }

  return [Math.round(pixelX), Math.round(pixelY)];
}
