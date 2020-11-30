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
import { MESSAGE_JOB_STATUS } from '../shared/constants';
import { printNorthArrow } from './north-arrow';

let counter = 0;

/**
 * Add a new job in the queue
 * Note: this will broadcast the job status updates to the main thread
 * until the job is over.
 * @param {PrintSpec} spec
 */
export function createJob(spec) {
  const frameState = getFrameState(spec);

  /**
   * @type {PrintStatus}
   */
  const job = {
    id: counter++,
    spec,
    status: 'pending',
    progress: 0,
  };

  const context = createCanvasContext2D(spec.size[0], spec.size[1]);

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

          printNorthArrow(context);

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
 * @return {FrameState}
 */
function getFrameState(spec) {
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
      spec.size
    ),
    index: 0,
    layerIndex: 0,
    layerStatesArray: [],
    pixelRatio: 1,
    pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
    postRenderFunctions: [],
    size: spec.size,
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
