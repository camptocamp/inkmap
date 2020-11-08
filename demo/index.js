import './elements/custom-button';
import { print, downloadBlob } from '../src/main';

document.querySelectorAll('.print-unit').forEach((unit) => {
  /** @type {CustomButton} */
  const btn = unit.querySelector('custom-button');
  const specElt = unit.querySelector('.spec');

  btn.addEventListener('click', () => {
    btn.working = true;
    btn.progress = 0.5;

    print(JSON.parse(specElt.value)).then((imageBlob) => {
      btn.working = false;
      downloadBlob(
        imageBlob,
        `inkmap-${new Date().toISOString().substr(0, 10)}.png`
      );
    });
  });
});
