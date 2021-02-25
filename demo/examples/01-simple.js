import { downloadBlob, print } from 'inkmap';

const root = document.getElementById('example-01');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

btn.addEventListener('click', async () => {
  btn.showSpinner();

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(spec.value);

  btn.hideSpinner();

  downloadBlob(blob, 'inkmap.png');
});
