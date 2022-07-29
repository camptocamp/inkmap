import {
  cancelJob,
  downloadBlob,
  getJobStatus,
  queuePrint,
} from '@camptocamp/inkmap';

const root = document.getElementById('example-03');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const bar = /** @type {CustomProgress} */ root.querySelector('custom-progress');
const spec = /** @type {PrintSpecEditor} */ root.querySelector('print-spec');
const btnCancel = /** @type {Button} */ root.querySelector('.cancel-btn');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

let jobId;

btn.addEventListener('click', async () => {
  btn.showSpinner();

  // display the job progress
  bar.progress = 0;
  bar.status = 'pending';

  // create a job, get a promise that resolves with the job id
  jobId = await queuePrint(spec.value);

  getJobStatus(jobId).subscribe((printStatus) => {
    // update the job progress
    bar.progress = printStatus.progress;
    bar.status = printStatus.status;

    // job is finished or canceled
    if (printStatus.progress === 1 || printStatus.progress === -1) {
      btn.hideSpinner();
    }

    // job is finished
    if (printStatus.progress === 1) {
      downloadBlob(printStatus.imageBlob, 'inkmap.png');
    }
  });
});

btnCancel.addEventListener('click', async () => {
  // cancel job based on job id
  cancelJob(jobId);
});
