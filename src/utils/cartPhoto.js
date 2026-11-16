// src/utils/cartPhoto.js
// Turn a photo the customer picked into what the cart API stores: a JPEG of at
// most 1200px, as plain base64 (no "data:" prefix). iPhone HEIC photos are
// converted first; the converter is only downloaded when one is picked.

const MAX_SIDE = 1200;
const MAX_INPUT_MB = 20;

const isHeic = (file) => /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');

const toJpegBlob = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    let { width, height } = img;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    width = Math.round(width * scale); height = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't read that photo."))), 'image/jpeg', 0.85);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that photo.")); };
  img.src = url;
});

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(new Error("Couldn't read that photo."));
  reader.readAsDataURL(blob);
});

/** File -> plain base64 JPEG for /api/cart/items/<id>/add-image/. Throws a readable Error. */
export async function prepareCartPhoto(file) {
  if (!file) throw new Error('Choose a photo.');
  if (!file.type.startsWith('image/') && !isHeic(file)) throw new Error('Choose a photo (JPEG, PNG or HEIC).');
  if (file.size > MAX_INPUT_MB * 1024 * 1024) throw new Error(`That photo is over ${MAX_INPUT_MB} MB.`);
  let source = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import('heic2any');
    source = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
  }
  const raw = await blobToBase64(await toJpegBlob(source));
  if (!raw) throw new Error("Couldn't read that photo.");
  return raw;
}

/** The stored base64 as something an <img> can show. */
export const photoSrc = (base64) => {
  if (!base64) return null;
  if (base64.startsWith('data:')) return base64;
  return `data:image/${base64.startsWith('iVBOR') ? 'png' : 'jpeg'};base64,${base64}`;
};
