import { downloadBlob, getJobStatus, print, queuePrint } from '../../src/main';
import { getFileName } from '../utils';

const root = document.getElementById('example-02');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  // display the loading spinner
  btn.working = true;

  // create a job, get a promise that resolves with the job id
  const jobId = await queuePrint(spec.value);

  getJobStatus(jobId).subscribe((status) => {
    // display the job progress
    btn.progress = status.progress;

    // job is finished
    if (status.progress === 1) {
      // hide the loading spinner
      btn.working = false;

      // download the result
      downloadBlob(status.imageBlob, getFileName());
    }
  });
});
