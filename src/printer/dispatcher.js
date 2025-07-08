import { messageToPrinter$ } from './exchange.js';
import { cancelJob, createJob } from './job.js';
import {
  MESSAGE_JOB_CANCEL,
  MESSAGE_JOB_REQUEST,
} from '../shared/constants.js';

messageToPrinter$.subscribe((message) => {
  switch (message.type) {
    case MESSAGE_JOB_REQUEST:
      createJob(message.spec);
      break;
    case MESSAGE_JOB_CANCEL:
      cancelJob(message.jobId);
      break;
    default:
      console.log('[inkmap] Unhandled message', message);
  }
});
