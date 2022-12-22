import {
  filter,
  map,
  pairwise,
  scan,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
import { from } from 'rxjs';
import { messageToMain$, messageToPrinter } from './exchange';
import { MESSAGE_JOB_REQUEST, MESSAGE_JOB_STATUS } from '../shared/constants';
import isEqual from 'lodash/isEqual';

export const jobs$ = messageToMain$.pipe(
  filter((message) => message.type === MESSAGE_JOB_STATUS),
  map((message) => message.status),
  scan(
    (jobs, status) => [...jobs.filter((job) => job.id !== status.id), status],
    []
  ),
  startWith([]),
  shareReplay({ bufferSize: 1, refCount: true })
);

export const newJob$ = jobs$.pipe(
  pairwise(),
  switchMap(([prevJobs, jobs]) => {
    return from(
      jobs.filter((job) => !prevJobs.some((prevJob) => prevJob.id === job.id))
    );
  })
);

export function getJobsStatusObservable() {
  return jobs$.pipe(
    pairwise(),
    map(([prevJobs, jobs]) =>
      jobs.filter(
        (job) =>
          !prevJobs.find(
            (prevJob) => prevJob.id === job.id && prevJob.progress == 1
          )
      )
    )
  );
}

export function getJobStatusObservable(jobId) {
  return jobs$.pipe(
    map((jobs) => jobs.find((job) => job.id === jobId)),
    filter((job) => !!job)
  );
}

/**
 * @param {import('.').PrintSpec} printSpec
 * @return {import('rxjs').Observable<number>} Observable emitting the print job id and completing afterwards
 */
export function createNewJob(printSpec) {
  messageToPrinter(MESSAGE_JOB_REQUEST, { spec: printSpec });
  return newJob$.pipe(
    filter((job) => isEqual(job.spec, printSpec)),
    take(1),
    map((job) => job.id)
  );
}
