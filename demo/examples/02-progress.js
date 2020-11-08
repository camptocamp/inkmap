import { downloadBlob, getJobStatus, print, queuePrint } from '../../src/main';
import { getFileName } from '../utils';

const root = document.querySelector('.example-02');

/** @type {CustomButton} */
const btn = root.querySelector('custom-button');

/** @type {PrintSpec} */
const specElt = root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  btn.working = true;

  const jobId = await queuePrint(specElt.value);

  getJobStatus(jobId).subscribe((status) => {
    btn.progress = status.progress;

    if (status.progress === 1) {
      btn.working = false;
      downloadBlob(status.imageBlob, getFileName());
    }
  });
});
