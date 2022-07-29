import { downloadBlob, print, registerProjection } from '@camptocamp/inkmap';

const root = document.getElementById('example-06');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpecEditor} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

btn.addEventListener('click', async () => {
  btn.showSpinner();

  // registers the projection EPSG:2154
  registerProjection({
    name: 'EPSG:2154',
    bbox: [51.56, -9.86, 41.15, 10.38],
    proj4:
      '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  });

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(spec.value);

  btn.hideSpinner();

  downloadBlob(blob, 'inkmap.png');
});
