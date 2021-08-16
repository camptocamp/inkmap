import { createCanvasContext2D } from 'ol/dom';
import { combineLatest, of } from 'rxjs';
import { map, switchMap, takeWhile } from 'rxjs/operators';

import { MESSAGE_JOB_STATUS } from '../shared/constants';
import { registerWithExtent } from '../shared/projections';
import { messageToMain } from './exchange';
import { cancel$, createLayer } from './layers';
import { printNorthArrow } from './widgets/north-arrow';
import { printScaleBar } from './widgets/scalebar';
import { calculateSizeInPixel, canvasToBlob, getJobFrameState } from './utils';
import { printAttributions } from './widgets/attributions';

let counter = 0;

/**
 * Add a new job in the queue
 * Note: this will broadcast the job status updates to the main thread
 * until the job is over.
 * @param {import('../main/index').PrintSpec} spec
 */
export async function createJob(spec) {
  registerProjections(spec.projectionDefinitions);
  const sizeInPixel = calculateSizeInPixel(spec);
  const frameState = await getJobFrameState(spec, sizeInPixel);

  /**
   * @type {import('../main/index').PrintStatus}
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
            if (canvasImage.width !== 0 && canvasImage.height !== 0) {
              context.drawImage(canvasImage, 0, 0);
              if (errorUrl) {
                sourceLoadErrors.push({
                  url: errorUrl,
                });
              }
            }
          }
          if (spec.northArrow) {
            printNorthArrow(context, spec.northArrow, spec.dpi);
          }
          if (spec.scaleBar) {
            printScaleBar(context, frameState, spec);
          }
          if (spec.attributions) {
            printAttributions(context, spec);
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

function registerProjections(definitions) {
  if (definitions) {
    for (const projection of definitions) {
      registerWithExtent(projection.name, projection.proj4, projection.bbox);
    }
  }
}

export function cancelJob(jobId) {
  cancel$.next(jobId);
}
