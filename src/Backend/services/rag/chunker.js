/**
 * Split text into chunks of at most `maxChars`, packing whole paragraphs together.
 * Paragraphs longer than `maxChars` are hard-split with `overlap` characters shared
 * between neighbouring pieces so no sentence is lost at a boundary.
 * @param {string} text
 * @param {{maxChars?: number, overlap?: number}} [opts]
 * @returns {string[]}
 */
function chunkText(text, { maxChars = 800, overlap = 100 } = {}) {
  const pieces = [];
  for (const para of text.split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p) continue;
    if (p.length <= maxChars) {
      pieces.push(p);
      continue;
    }
    for (let i = 0; i < p.length; i += maxChars - overlap) {
      pieces.push(p.slice(i, i + maxChars));
    }
  }

  const chunks = [];
  let current = '';
  for (const piece of pieces) {
    const candidate = current ? `${current}\n\n${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

module.exports = { chunkText };