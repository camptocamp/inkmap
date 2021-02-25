import { print } from 'inkmap';
import { jsPDF } from 'jspdf';
import { computeAttributionsText } from '../../src/printer/attributions';

const root = document.getElementById('example-05');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

btn.addEventListener('click', async () => {
  btn.showSpinner();

  const mapWidth = 277; // mm
  const mapHeight = 150; // mm

  // Force map size to fit the PDF document
  const specValue = {
    ...spec.value,
    size: [mapWidth, mapHeight, 'mm'],
    attributions: null, // do not print the attributions on the map
  };

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(specValue);

  btn.hideSpinner();

  // initializes the PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });

  // create an Object URL from the map image blob and add it to the PDF
  const imgUrl = URL.createObjectURL(blob);
  doc.addImage(imgUrl, 'JPEG', 10, 40, mapWidth, mapHeight);

  // add a title
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('A fantastic map.', 148.5, 20, null, null, 'center');

  // add a creation date
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.text(
    `Print date : ${new Date().toLocaleString()}`,
    10,
    200,
    null,
    null,
    'left'
  );

  // add attribution
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.text(computeAttributionsText(spec.value), 287, 200, null, null, 'right');

  // download the result
  doc.save('inkmap.pdf');
});
