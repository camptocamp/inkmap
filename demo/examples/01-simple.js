import { downloadBlob, print } from '../../src/main';
import { getFileName } from '../utils';

const root = document.querySelector('.example-01');

/** @type {CustomButton} */
const btn = root.querySelector('custom-button');
const specElt = root.querySelector('.spec');

btn.addEventListener('click', () => {
  btn.working = true;
  const specJson = JSON.parse(specElt.value);

  print(specJson).then((imageBlob) => {
    btn.working = false;
    downloadBlob(imageBlob, getFileName());
  });
});
