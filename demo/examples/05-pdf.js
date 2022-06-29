import { print, getAttributionsText, getNorthArrow } from '@camptocamp/inkmap';
import { jsPDF } from 'jspdf';
import { getScaleBar } from '../../src/main';

const root = document.getElementById('example-05');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpecEditor} */ root.querySelector('print-spec');

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
    attributions: null, // do not print widgets on the map
    northArrow: false,
    scaleBar: false,
  };

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(specValue);

  btn.hideSpinner();

  // initializes the PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 210 by 297mm
    putOnlyUsedFonts: true,
  });

  // create an Object URL from the map image blob and add it to the PDF
  const imgUrl = URL.createObjectURL(blob);
  doc.addImage(imgUrl, 'JPEG', 10, 40, mapWidth, mapHeight);

  // add a title
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('A fantastic map.', 148.5, 13, null, null, 'center');

  // add north arrow
  const arrow = getNorthArrow(specValue, [16, 'mm']);
  const arrowSizeMm = arrow.getRealWorldDimensions('mm');
  doc.addImage(
    arrow.getImage(),
    'PNG',
    140,
    21,
    arrowSizeMm[0],
    arrowSizeMm[1]
  );

  // add scalebar next to the north arrow
  const scalebar = getScaleBar(specValue, [30, 'mm']);
  const scalebarSizeMm = scalebar.getRealWorldDimensions('mm');
  doc.addImage(
    scalebar.getImage(),
    'PNG',
    287 - scalebarSizeMm[0],
    37 - scalebarSizeMm[1],
    scalebarSizeMm[0],
    scalebarSizeMm[1]
  );

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
  doc.text(getAttributionsText(spec.value), 287, 200, null, null, 'right');

  // download the result
  doc.save('inkmap.pdf');
});
