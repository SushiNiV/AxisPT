import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../ui/Button';
import { decodeImage } from './ImageUtils';

/**
 * Dialog for framing a profile photo before it is uploaded.
 *
 * The user drags the photo and uses the slider (or keyboard) to zoom; the circle
 * shows exactly what the header and drawer will display. "Save photo" hands back a
 * square 512px JPEG of the framed area, so the server never has to guess a crop.
 *
 * Rendered in a portal because the profile drawer uses a CSS transform, which would
 * otherwise trap a `position: fixed` dialog inside the drawer's 380px box.
 *
 * @param {File} file                              The image the user picked.
 * @param {(errorMessage?: string) => void} onCancel  Closed without saving; the message is
 *                                                 set when the file could not be decoded.
 * @param {(dataUri: string) => void} onConfirm    Receives the framed 512x512 JPEG data URI.
 */

const VIEW = 256; // on-screen size of the framing square, in CSS px
const BACKING = VIEW * 2; // canvas pixels, so the preview stays sharp on high-density screens
const OUTPUT = 512; // exported image size in px
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const NUDGE_PX = 12;
const ZOOM_STEP = 0.1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Works out where the image is drawn inside the square viewport.
 * At zoom 1 the image just covers the square; the offset is clamped so the image
 * can never be dragged far enough to reveal empty space.
 *
 * @returns {{ dx: number, dy: number, dw: number, dh: number, offset: {x: number, y: number} }}
 *   Draw rectangle in viewport pixels, plus the clamped offset.
 */
export function frame(imageWidth, imageHeight, view, zoom, offset) {
  const scale = Math.max(view / imageWidth, view / imageHeight) * zoom;
  const dw = imageWidth * scale;
  const dh = imageHeight * scale;
  const maxX = Math.max(0, (dw - view) / 2);
  const maxY = Math.max(0, (dh - view) / 2);
  const x = clamp(offset.x, -maxX, maxX);
  const y = clamp(offset.y, -maxY, maxY);
  return { dx: view / 2 - dw / 2 + x, dy: view / 2 - dh / 2 + y, dw, dh, offset: { x, y } };
}

const sizeOf = (image) => ({ w: image.naturalWidth || image.width, h: image.naturalHeight || image.height });

/** Draws the framed image onto a canvas context of `pixels` x `pixels`. */
function paint(ctx, image, pixels, zoom, offset) {
  const { w, h } = sizeOf(image);
  const f = frame(w, h, VIEW, zoom, offset);
  const k = pixels / VIEW;
  ctx.fillStyle = '#ffffff'; // JPEG has no transparency; avoid black behind see-through PNGs
  ctx.fillRect(0, 0, pixels, pixels);
  ctx.drawImage(image, f.dx * k, f.dy * k, f.dw * k, f.dh * k);
}

export default function PhotoCropper({ file, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Decode the chosen file; if it is not a readable image, close and report why.
  useEffect(() => {
    let alive = true;
    decodeImage(file)
      .then((decoded) => alive && setImage(decoded))
      .catch((err) => alive && cancelRef.current(err.message));
    return () => { alive = false; };
  }, [file]);

  // Redraw the preview whenever the framing changes.
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    paint(canvasRef.current.getContext('2d'), image, BACKING, zoom, offset);
  }, [image, zoom, offset]);

  // Put keyboard focus on the preview as soon as there is something to adjust.
  useEffect(() => {
    if (image && canvasRef.current) canvasRef.current.focus();
  }, [image]);

  /** Applies a new zoom/offset, clamping so the image always covers the square. */
  const apply = (nextZoom, nextOffset) => {
    if (!image) return;
    const { w, h } = sizeOf(image);
    setZoom(nextZoom);
    setOffset(frame(w, h, VIEW, nextZoom, nextOffset).offset);
  };

  /** Zooms about the center of the square, keeping the framed area steady. */
  const changeZoom = (value) => {
    const next = clamp(value, MIN_ZOOM, MAX_ZOOM);
    const ratio = next / zoom;
    apply(next, { x: offset.x * ratio, y: offset.y * ratio });
  };

  const onPointerDown = (e) => {
    if (!image) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    apply(zoom, { x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation(); // keep the profile drawer open behind this dialog
      onCancel();
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      // Keep Tab inside the dialog while it is open.
      const items = [...dialogRef.current.querySelectorAll('button:not([disabled]), input, canvas[tabindex]')];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }

    if (e.target !== canvasRef.current) return;
    const moves = {
      ArrowLeft: [-NUDGE_PX, 0], ArrowRight: [NUDGE_PX, 0], ArrowUp: [0, -NUDGE_PX], ArrowDown: [0, NUDGE_PX],
    };
    if (moves[e.key]) {
      e.preventDefault();
      apply(zoom, { x: offset.x + moves[e.key][0], y: offset.y + moves[e.key][1] });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      changeZoom(zoom + ZOOM_STEP);
    } else if (e.key === '-') {
      e.preventDefault();
      changeZoom(zoom - ZOOM_STEP);
    }
  };

  /** Renders the framed area at full output size and returns it as a JPEG data URI. */
  const exportFramed = () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    paint(canvas.getContext('2d'), image, OUTPUT, zoom, offset);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  return createPortal(
    <div className="ax fixed inset-0 z-[300] grid place-items-center bg-black/60 p-4" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Adjust photo"
        className="w-full max-w-sm rounded-panel border !border-line bg-surface p-4 shadow-2xl"
      >
        <h2 className="font-display text-lg font-semibold text-ink">Adjust photo</h2>
        <p className="mt-1 text-sm text-ink-2">Drag to reposition. Use the slider to zoom.</p>

        <div className="relative mx-auto mt-4 overflow-hidden rounded-ctl bg-surface-2" style={{ width: VIEW, height: VIEW }}>
          <canvas
            ref={canvasRef}
            width={BACKING}
            height={BACKING}
            tabIndex={0}
            role="img"
            aria-label="Photo preview. Drag or use the arrow keys to move it, and plus or minus to zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="block focus-visible:outline-none"
            style={{ width: VIEW, height: VIEW, touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
          />
          {/* The clear circle is what the header and drawer will show; the dim corners are cropped off. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.55)] ring-2 ring-white/70"
          />
          {!image && (
            <p className="absolute inset-0 grid place-items-center text-sm text-ink-3">Loading photo…</p>
          )}
        </div>

        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step="0.01"
          value={zoom}
          disabled={!image}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="mt-4 w-full accent-brand"
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onCancel()}>Cancel</Button>
          <Button onClick={() => onConfirm(exportFramed())} disabled={!image}>Save photo</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}