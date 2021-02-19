import { print } from 'inkmap';
import { jsPDF } from 'jspdf';

const root = document.getElementById('example-05');
const btn = /** @type {CustomButton} */ root.querySelector('custom-button');
const spec = /** @type {PrintSpec} */ root.querySelector('print-spec');

// make sure the spec is valid to allow printing
spec.onValidityCheck((valid) => (btn.enabled = valid));

btn.addEventListener('click', async () => {
  btn.showSpinner();

  // Get map size from printSpec
  const specValue = {
    ...spec.value,
    size: [pdfSpec.map.width, pdfSpec.map.height],
  };

  // create a job, get a promise that resolves when the job is finished
  const blob = await print(specValue);

  btn.hideSpinner();

  // convert the result into a Data URL
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function () {
    const imgData = reader.result;

    // add the image to a newly created PDF
    const doc = new jsPDF({
      orientation: pdfSpec.orientation,
      unit: 'px',
      format: pdfSpec.format,
      putOnlyUsedFonts: true,
      hotfixes: ['px_scaling'],
    });

    doc.addImage(
      imgData,
      'JPEG',
      pdfSpec.map.x,
      pdfSpec.map.y,
      pdfSpec.map.width,
      pdfSpec.map.height
    );

    // add other blocks from the pdf spec
    for (const block of pdfSpec.blocks) {
      if (block.rectangle) {
        doc.rect(
          block.rectangle.x,
          block.rectangle.y,
          block.rectangle.width,
          block.rectangle.height
        );
      }
      if (block.text) {
        if (block.text.font) {
          doc.setFont(block.text.font.name, block.text.font.style);
          doc.setFontSize(block.text.font.size);
        }
        doc.text(
          block.text.content,
          block.text.x,
          block.text.y,
          null,
          null,
          block.text.align
        );
        if (pdfSpec.font) {
          doc.setFont(pdfSpec.font.name, pdfSpec.font.style);
          doc.setFontSize(pdfSpec.font.size);
        }
      }
    }

    // download the result
    doc.save('inkmap.pdf');
  };
});

const pdfSpec = {
  // A4 landscape 96 DPI => 1123px x 794px
  orientation: 'landscape',
  format: 'a4',
  font: {
    name: 'courier',
    style: 'normal',
    size: 10,
  },
  map: {
    x: 20,
    y: 100,
    width: 800,
    height: 500,
  },
  blocks: [
    {
      id: 'title',
      rectangle: {
        x: 20,
        y: 20,
        width: 800,
        height: 60,
      },
      text: {
        content: 'Some nice title above my map',
        x: 420, // depends on align
        y: 60, // depends on font size
        align: 'center',
        font: {
          name: 'times',
          style: 'bold',
          size: 20,
        },
      },
    },
    {
      id: 'date',
      rectangle: {
        x: 840,
        y: 20,
        width: 263,
        height: 60,
      },
      text: {
        content: `Print date : ${new Date().toISOString().substr(0, 10)}`,
        x: 850,
        y: 50,
      },
    },
    {
      id: 'legend',
      rectangle: {
        x: 840,
        y: 100,
        width: 263,
        height: 500,
      },
    },
    {
      id: 'projection',
      rectangle: {
        x: 840,
        y: 620,
        width: 263,
        height: 74,
      },
    },
    {
      id: 'description',
      rectangle: {
        x: 20,
        y: 620,
        width: 800,
        height: 74,
      },
    },
    {
      id: 'footer',
      rectangle: {
        x: 20,
        y: 714,
        width: 1083,
        height: 60,
      },
    },
  ],
};
