import { downloadBlob, getJobStatus, queuePrint } from 'inkmap';

const root = document.getElementById('example-07');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');
const errors = root.querySelector('#errors');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

btn.addEventListener('click', async () => {
  btn.showSpinner();

  // create a job, get a promise that resolves with the job id
  const jobId = await queuePrint(spec.value);

  getJobStatus(jobId).subscribe((status) => {
    // display the job progress
    btn.progress = status.progress;

    // job is finished
    if (status.progress === 1) {
      btn.hideSpinner();

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

      downloadBlob(status.imageBlob, 'inkmap.png');
    }
  });
});
