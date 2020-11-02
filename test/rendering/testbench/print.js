import { print } from '../../../src/main';

const spec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
  ],
  size: [256, 256],
  center: [12, 48],
  dpi: 50,
  scale: 40000000,
  projection: 'EPSG:3857',
};

const canvas = document.getElementById('result');

print(spec).then((imageBlob) => {
  const ctx = canvas.getContext('2d');

  const img = new Image();
  const url = URL.createObjectURL(imageBlob);

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(this, 0, 0);
    URL.revokeObjectURL(url);

    validate();
  };
  img.src = url;
});
