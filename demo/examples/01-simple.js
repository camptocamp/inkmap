import { downloadBlob, print } from '../../src/main';
import { getFileName } from '../utils';

const root = document.querySelector('.example-01');

/** @type {CustomButton} */
const btn = root.querySelector('custom-button');

/** @type {PrintSpec} */
const specElt = root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  btn.working = true;

  const blob = await print(specElt.value);

  btn.working = false;

  downloadBlob(blob, getFileName());
});
