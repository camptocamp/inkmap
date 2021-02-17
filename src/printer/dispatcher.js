import { messageToPrinter$ } from './exchange';
import { cancelJob, createJob } from './job';
import { MESSAGE_JOB_CANCEL, MESSAGE_JOB_REQUEST } from '../shared/constants';

messageToPrinter$.subscribe((message) => {
  switch (message.type) {
    case MESSAGE_JOB_REQUEST:
      createJob(message.spec);
      break;
    case MESSAGE_JOB_CANCEL:
      cancelJob(message.jobId);
      break;
    default:
      console.log('Unhandled message', message);
  }
});
