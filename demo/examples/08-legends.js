import { downloadBlob, getJobStatus, queuePrint } from '@camptocamp/inkmap';
import { createLegends } from '../../src/main';

const root = document.getElementById('example-08');
const mapBtn = /** @type {CustomButton} */ root.querySelector(
  'custom-button.map-btn',
);
const legendBtn = /** @type {CustomButton} */ root.querySelector(
  'custom-button.legend-btn',
);
root.querySelector('custom-button.legend-btn');
const bar = /** @type {CustomProgress} */ root.querySelector('custom-progress');
const spec = /** @type {PrintSpecEditor} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => {
  mapBtn.enabled = valid;
  legendBtn.enabled = valid;
});

mapBtn.addEventListener('click', async () => {
  mapBtn.showSpinner();

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
      mapBtn.hideSpinner();
      downloadBlob(printStatus.imageBlob, 'inkmap.png');
    }
  });
});

legendBtn.addEventListener('click', async () => {
  const blob = await createLegends(spec.value);
  downloadBlob(blob, 'legend.svg');
});
