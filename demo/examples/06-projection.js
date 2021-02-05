import { downloadBlob, print } from 'inkmap';
import { registerProjection } from '../../src/main';
import { generateFileName } from '../fileutils';

const root = document.getElementById('example-06');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  // display the loading spinner
  btn.working = true;

  // registers the projection EPSG:2154
  registerProjection({
    name: 'EPSG:2154',
    bbox: [51.56, -9.86, 41.15, 10.38],
    proj4:
      '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  });

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(spec.value);

  // hide the loading spinner
  btn.working = false;

  // download the result
  const filename = generateFileName();
  downloadBlob(blob, filename);
});
