import { createCanvasContext2D } from 'ol/dom.js';
import { catchError, combineLatest, of } from 'rxjs';
import { map, switchMap, takeWhile } from 'rxjs/operators';

import { MESSAGE_JOB_STATUS } from '../shared/constants.js';
import { registerWithExtent } from '../shared/projections.js';
import { messageToMain } from './exchange.js';
import { cancel$, createLayer } from './layers.js';
import {
  calculateSizeInPixel,
  canvasToBlob,
  getJobFrameState,
} from './utils.js';
import { printAttributions } from '../shared/widgets/attributions.js';
import { printNorthArrow } from '../shared/widgets/north-arrow.js';
import { printScaleBar } from '../shared/widgets/scalebar.js';
import { PrintError } from '../shared/print-error.js';

let counter = 0;

/**
 * Add a new job in the queue
 * Note: this will broadcast the job status updates to the main thread
 * until the job is over.
 * @param {import('../main/index.js').PrintSpec} spec
 */
export async function createJob(spec) {
  registerProjections(spec.projectionDefinitions);
  const sizeInPixel = calculateSizeInPixel(spec);
  const frameState = await getJobFrameState(spec, sizeInPixel);

  /** @type {import('../main/index.js').PrintError[]} */
  const jobErrors = [];

  function logError(error, layerIndex) {
    /** @type {import('../main/index.js').PrintError} */
    const printError = { message: error.message };
    if (layerIndex !== undefined) {
      printError.layerIndex = layerIndex;
    }
    jobErrors.push(printError);
  }

  /**
   * @type {import('../main/index.js').PrintStatus}
   */
  const job = {
    id: counter++,
    spec,
    status: 'pending',
    progress: 0,
    imageBlob: null,
    errors: jobErrors,
  };

  const context = createCanvasContext2D(sizeInPixel[0], sizeInPixel[1]);

  const layerObservables = spec.layers.map((layer, layerIndex) =>
    createLayer(job.id, layer, frameState).pipe(
      catchError((error, source) => {
        logError(error, layerIndex);
        return source;
      }),
    ),
  );

  const layerStates$ = layerObservables.length
    ? combineLatest(layerObservables)
    : of([]);
  layerStates$
    .pipe(
      switchMap((layerStates) => {
        const allReady = layerStates.every(([progress]) => progress === 1);
        const oneCanceled = layerStates.some(([progress]) => progress === -1);

        if (allReady) {
          for (let i = 0; i < layerStates.length; i++) {
            const canvasImage = layerStates[i][1];
            if (canvasImage.width !== 0 && canvasImage.height !== 0) {
              context.drawImage(canvasImage, 0, 0);
            }
          }
          if (spec.northArrow) {
            printNorthArrow(context, spec.northArrow, spec.dpi);
          }
          if (
            (typeof spec.scaleBar === 'object' && spec.scaleBar.position) ||
            spec.scaleBar
          ) {
            printScaleBar(context, spec);
          }
          if (spec.attributions) {
            printAttributions(context, spec);
          }
          return canvasToBlob(context.canvas).pipe(map((blob) => [1, blob]));
        } else if (oneCanceled) {
          return of([-1, null]);
        } else {
          const rawProgress =
            layerStates.reduce((prev, [progress]) => progress + prev, 0) /
            layerStates.length;
          // only keep 4 digits precision for readability
          const progress = Math.min(0.999, parseFloat(rawProgress.toFixed(4)));

          return of([progress, null]);
        }
      }),
      map(
        ([progress, imageBlob]) =>
          /** @type {import('../main/index.js').PrintStatus} */ ({
            ...job,
            progress,
            imageBlob,
            status:
              progress === 1
                ? 'finished'
                : progress === -1
                  ? 'canceled'
                  : 'ongoing',
          }),
      ),
      catchError((error, source) => {
        logError(error);
        return source;
      }),
      takeWhile(
        (jobStatus) => jobStatus.progress < 1 && jobStatus.progress !== -1,
        true,
      ),
    )
    .subscribe((status) => messageToMain(MESSAGE_JOB_STATUS, { status }));
}

function registerProjections(definitions) {
  if (definitions) {
    for (const projection of definitions) {
      registerWithExtent(projection.name, projection.proj4, projection.bbox);
    }
  }
}

/**
 * Cancel a job given its id
 * @param {number} jobId
 */
export function cancelJob(jobId) {
  cancel$.next(jobId);
}
