import { downloadBlob, print } from '../../src/main';
import { getFileName } from '../utils';

const root = document.getElementById('example-01');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  // display the loading spinner
  btn.working = true;

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(spec.value);

  // hide the loading spinner
  btn.working = false;

  // download the result
  downloadBlob(blob, getFileName());
});
