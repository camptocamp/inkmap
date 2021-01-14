import { getJobsStatus, queuePrint } from 'inkmap';
import { tap } from 'rxjs/operators';
import { downloadBlob, getJobStatus } from '../../src/main';

const root = document.getElementById('example-04');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const bars = /** @type {CustomProgresses} */ root.querySelector(
  'custom-progresses'
);
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

// subscribe to the long-running observable
// beware of managing the unsubscription
getJobsStatus().subscribe((jobs) => {
  bars.jobsStatus = jobs;
});

btn.addEventListener('click', async () => {
  // create a job, get a promise that resolves with the job id
  const jobId = await queuePrint(spec.value);

  getJobStatus(jobId).subscribe((printStatus) => {
    // job is finished
    if (printStatus.progress === 1) {
      // download the result
      const filename = `inkmap-${jobId}-${new Date()
        .toISOString()
        .substr(0, 10)}.png`;
      downloadBlob(printStatus.imageBlob, filename);
    }
  });
});
