import { messageToPrinter$ } from './exchange';
import { createJob } from './job';
import { MESSAGE_JOB_REQUEST } from '../shared/constants';

messageToPrinter$.subscribe((message) => {
  switch (message.type) {
    case MESSAGE_JOB_REQUEST:
      createJob(message.spec);
      break;
    default:
      console.log('Unhandled message', message);
  }
});
