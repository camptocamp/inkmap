import { downloadBlob, getJobStatus, queuePrint } from 'inkmap';

const root = document.getElementById('example-02');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const bar = /** @type {CustomProgress} */ root.querySelector('custom-progress');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  // display the loading spinner
  btn.working = true;

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
      // hide the loading spinner
      btn.working = false;

      // download the result
      const filename = `inkmap-${new Date().toISOString().substr(0, 10)}.png`;
      downloadBlob(printStatus.imageBlob, filename);
    }
  });
});
