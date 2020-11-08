import { downloadBlob, print } from '../../src/main';
import { getFileName } from '../utils';

const root = document.querySelector('.example-01');

/** @type {CustomButton} */
const btn = root.querySelector('custom-button');

/** @type {PrintSpec} */
const specElt = root.querySelector('print-spec');

btn.addEventListener('click', () => {
  btn.working = true;

  print(specElt.value).then((imageBlob) => {
    btn.working = false;
    downloadBlob(imageBlob, getFileName());
  });
});
