/**
 * Decodes an image file into something that can be drawn on a canvas.
 * Honors the camera's rotation flag so portrait phone photos are not sideways.
 *
 * @param {File} file
 * @returns {Promise<ImageBitmap|HTMLImageElement>}
 * @throws {Error} with a user-readable message when the file is not a readable image.
 */
export async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to the <img> decoder
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}