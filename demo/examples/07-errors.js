import { downloadBlob, getJobStatus, queuePrint } from 'inkmap';
import { generateFileName } from '../fileutils';

const root = document.getElementById('example-07');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');
const errors = root.querySelector('#errors');

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

      // display urls with errors
      if (status.sourceLoadErrors.length > 0) {
        let errorMessage = 'The following layers encountered errors:<br>';
        status.sourceLoadErrors.forEach((element) => {
          errorMessage = `${errorMessage} - ${element.url}<br>`;
        });
        errors.innerHTML = errorMessage;
      } else {
        errors.innerHTML = '';
      }

      // download the result
      const filename = generateFileName();
      downloadBlob(status.imageBlob, filename);
    }
  });
});
