import {filter, map, pairwise, scan, startWith, switchMap} from 'rxjs/operators'
import {from} from 'rxjs'
import {messageToMain$} from './exchange'
import {MESSAGE_JOB_STATUS} from '../shared/constants'


export const jobs$ = messageToMain$.pipe(
  filter(message => message.type === MESSAGE_JOB_STATUS),
  map(message => message.status),
  scan((jobs, status) =>
    [...jobs.filter(job => job.id !== status.id), status], []),
  startWith([]),
  // tap(jobs => console.log('jobs$ = ', jobs))
)

export const newJob$ = jobs$.pipe(
  pairwise(),
  switchMap(([prevJobs, jobs]) => {
    return from(
      jobs.filter(job => !prevJobs.some(prevJob => prevJob.id === job.id))
    )
  }),
  // tap(job => console.log('newJob$ emitted ', job))
)

export function getJobStatusObservable(jobId) {
  return jobs$.pipe(
    map(jobs => jobs.find(job => job.id === jobId)),
    filter(job => !!job),
    // tap(job => console.log(`job(id=${jobId})$ emitted `, job))
  )
}
