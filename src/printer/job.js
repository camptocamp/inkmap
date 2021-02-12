import { createCanvasContext2D } from 'ol/dom';
import { getForViewAndSize } from 'ol/extent';
import { fromLonLat, get as getProjection } from 'ol/proj';
import TileQueue, {
  getTilePriority as tilePriorityFunction,
} from 'ol/TileQueue';
import { combineLatest, of } from 'rxjs';
import { map, switchMap, takeWhile } from 'rxjs/operators';

import { CM_PER_INCH, MESSAGE_JOB_STATUS } from '../shared/constants';
import {
  registerWithExtent,
  search as searchProjection,
} from '../shared/projections';
import { messageToMain } from './exchange';
import { cancel$, createLayer } from './layers';
import { printNorthArrow } from './north-arrow';
import { printScaleBar } from './scalebar';
import { canvasToBlob } from './utils';

let counter = 0;

/**
 * Add a new job in the queue
 * Note: this will broadcast the job status updates to the main thread
 * until the job is over.
 * @param {PrintSpec} spec
 */
export async function createJob(spec) {
  registerProjections(spec.projectionDefinitions);
  const sizeInPixel = calculateSizeInPixel(spec);
  const frameState = await getFrameState(spec, sizeInPixel);

  /**
   * @type {PrintStatus}
   */
  const job = {
    id: counter++,
    spec,
    status: 'pending',
    progress: 0,
    sourceLoadErrors: [],
  };

  const context = createCanvasContext2D(sizeInPixel[0], sizeInPixel[1]);

  combineLatest(
    spec.layers.map((layer) => {
      return createLayer(job.id, layer, frameState);
    })
  )
    .pipe(
      switchMap((layerStates) => {
        const allReady = layerStates.every(([progress]) => progress === 1);
        const oneCanceled = layerStates.some(([progress]) => progress === -1);
        let sourceLoadErrors = [];

        if (allReady) {
          for (let i = 0; i < layerStates.length; i++) {
            const canvasImage = layerStates[i][1];
            const errorUrl = layerStates[i][2];
            context.drawImage(canvasImage, 0, 0);
            if (errorUrl) {
              sourceLoadErrors.push({
                url: errorUrl,
              });
            }
          }
          if (spec.northArrow) {
            printNorthArrow(context, spec.northArrow);
          }
          if (spec.scaleBar) {
            printScaleBar(context, frameState, spec);
          }
          return canvasToBlob(context.canvas).pipe(
            map((blob) => [1, blob, sourceLoadErrors])
          );
        } else if (oneCanceled) {
          return of([-1, null, sourceLoadErrors]);
        } else {
          const rawProgress =
            layerStates.reduce((prev, [progress]) => progress + prev, 0) /
            layerStates.length;
          const progress = parseFloat(rawProgress.toFixed(4)); // only keep 4 digits precision

          return of([progress, null, sourceLoadErrors]);
        }
      }),
      map(([progress, imageBlob, sourceLoadErrors]) => {
        return {
          ...job,
          progress,
          imageBlob,
          status:
            progress === 1
              ? 'finished'
              : progress === -1
              ? 'canceled'
              : 'ongoing',
          sourceLoadErrors,
        };
      }),
      takeWhile(
        (jobStatus) => jobStatus.progress < 1 && jobStatus.progress !== -1,
        true
      )
    )
    .subscribe((status) => messageToMain(MESSAGE_JOB_STATUS, { status }));
}

/**
 * Returns an OpenLayers frame state for a given job spec
 * @param {PrintSpec} spec
 * @param {Array} sizeInPixel
 * @return {FrameState}
 */
async function getFrameState(spec, sizeInPixel) {
  let projection = getProjection(spec.projection);

  if (!projection && spec.projection.startsWith('EPSG:')) {
    const splitted = spec.projection.split(':');
    const { name, proj4def, bbox } = await searchProjection(splitted[1]);
    registerWithExtent(name, proj4def, bbox);
    projection = getProjection(spec.projection);
  }

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
      sizeInPixel
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

function registerProjections(definitions) {
  if (definitions) {
    for (const projection of definitions) {
      registerWithExtent(projection.name, projection.proj4, projection.bbox);
    }
  }
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

export function cancelJob(jobId) {
  cancel$.next(jobId);
}
