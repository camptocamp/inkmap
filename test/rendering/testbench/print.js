import { print } from '../../../src/main';

const canvas = document.getElementById('result');

const url = new URL(window.location);
const spec = JSON.parse(url.searchParams.get('spec'));

print(spec)
  .then((imageBlob) => {
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
  })
  .catch(fail);
