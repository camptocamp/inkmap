import { downloadBlob, getJobStatus, queuePrint } from 'inkmap';

const root = document.getElementById('example-02');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const bar = /** @type {CustomProgress} */ root.querySelector('custom-progress');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

btn.addEventListener('click', async () => {
  btn.showSpinner();

  // display the job progress
  bar.progress = 0;
  bar.status = 'pending';

  // create a job, get a promise that resolves with the job id
  const jobId = await queuePrint(spec.value);

  getJobStatus(jobId).subscribe((printStatus) => {
    // update the job progress
    bar.progress = printStatus.progress;
    bar.status = printStatus.status;

    // job is finished
    if (printStatus.progress === 1) {
      btn.hideSpinner();
      downloadBlob(printStatus.imageBlob, 'inkmap.png');
    }
  });
});
