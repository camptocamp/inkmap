import {
  cancelJob,
  downloadBlob,
  getJobsStatus,
  getJobStatus,
  queuePrint,
} from '@camptocamp/inkmap';

const root = document.getElementById('example-04');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const bars = /** @type {ProgressBars} */ root.querySelector('progress-bars');
const spec = /** @type {PrintSpecEditor} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

// subscribe to the jobs status updates
// ATTENTION! subscriptions to long-running observables might cause memory leaks!
getJobsStatus().subscribe((jobs) => {
  bars.jobsStatus = jobs;
});

btn.addEventListener('click', async () => {
  // create a job, get a promise that resolves with the job id
  const jobId = await queuePrint(spec.value);

  getJobStatus(jobId).subscribe((printStatus) => {
    // job is finished
    if (printStatus.progress === 1) {
      downloadBlob(printStatus.imageBlob, `inkmap-${jobId}.png`);
    }
  });
});

// cancel a job when a "cancel" button is clicked
bars.addEventListener('cancelJob', (event) => cancelJob(event.detail.jobId));
