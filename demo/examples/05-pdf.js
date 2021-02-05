import { print } from 'inkmap';
import { jsPDF } from 'jspdf';
import { generateFileName } from '../fileutils';

const root = document.getElementById('example-05');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

btn.addEventListener('click', async () => {
  // display the loading spinner
  btn.working = true;

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(spec.value);

  // hide the loading spinner
  btn.working = false;

  // convert the result into a Data URL
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function () {
    const imgData = reader.result;

    // add the image to a newly created PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      hotfixes: ['px_scaling'],
    });
    doc.addImage(
      imgData,
      'JPEG',
      15,
      40,
      spec.value.size[0],
      spec.value.size[1]
    );

    // download the result
    const filename = generateFileName('pdf');
    doc.save(filename);
  };
});
