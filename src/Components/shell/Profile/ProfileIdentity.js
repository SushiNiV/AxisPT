import React, { useEffect, useRef, useState } from 'react';
import { BiCamera, BiLoaderAlt } from 'react-icons/bi';
import Badge from '../../ui/Badge';
import PhotoCropper from './PhotoCropper';
import useAvatar from './UseAvatar';

/**
 * Identity block of the profile drawer: photo, name and role, with the controls to
 * change or remove the photo.
 *
 * Change flow: pick a file -> frame it in <PhotoCropper> (drag + zoom) -> "Save photo"
 * uploads the framed 512px square as base64 JSON to /avatars/me -> the server
 * re-encodes it and every avatar on the page updates through `useAvatar`.
 */

const ACCEPT = 'image/png,image/jpeg,image/webp'; // listing types (not image/*) makes iOS convert HEIC to JPEG
const ACCEPTED_TYPES = ACCEPT.split(',');
const MAX_FILE_BYTES = 15 * 1024 * 1024; // refuse absurdly large files before decoding
const SUCCESS_VISIBLE_MS = 3000;

const endpoint = () => `${process.env.REACT_APP_API_URL}/avatars/me`;
const authHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
});

/** Calls the avatar endpoint and returns the parsed body, or throws a user-readable Error. */
async function callAvatarApi(options = {}) {
  const res = await fetch(endpoint(), { ...options, headers: { ...authHeader(), ...options.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) throw new Error(body.message || 'Something went wrong. Please try again.');
  return body;
}

/**
 * @param {string} name  Display name (also used for the initial shown without a photo).
 * @param {string} role  Role label shown as a badge.
 */
export default function ProfileIdentity({ name, role }) {
  const { src, onError, setAvatarPath } = useAvatar();
  const fileInput = useRef(null);
  const [cropFile, setCropFile] = useState(null); // file currently being framed
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // shown instantly while the upload is in flight
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  // Success messages fade away on their own; errors stay until the next action.
  useEffect(() => {
    if (!message || message.type !== 'success') return undefined;
    const timer = setTimeout(() => setMessage(null), SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const fail = (err) =>
    setMessage({
      type: 'error',
      text: err instanceof TypeError ? 'Unable to connect to the server. Please try again.' : err.message,
    });

  const handleFile = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = ''; // lets the user pick the same file again later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please choose a PNG, JPEG or WebP image.' });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setMessage({ type: 'error', text: 'That photo is too large. Please choose one under 15 MB.' });
      return;
    }
    setMessage(null);
    setCropFile(file);
  };

  /** Called by the cropper with the framed square; uploads it. */
  const uploadFramed = async (image) => {
    setCropFile(null);
    setBusy(true);
    setMessage(null);
    setPreview(image);
    try {
      const { avatarUrl } = await callAvatarApi({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      setAvatarPath(avatarUrl);
      setMessage({ type: 'success', text: 'Photo updated.' });
    } catch (err) {
      fail(err);
    } finally {
      setPreview(null);
      setBusy(false);
    }
  };

  /** Called when the cropper closes without saving (optionally with a decode error). */
  const closeCropper = (errorMessage) => {
    setCropFile(null);
    if (errorMessage) setMessage({ type: 'error', text: errorMessage });
  };

  const handleRemove = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await callAvatarApi({ method: 'DELETE' });
      setAvatarPath(null);
      setMessage({ type: 'success', text: 'Photo removed.' });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const shown = preview || src;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full ring-2 ring-line">
            {shown ? (
              <img
                src={shown}
                alt=""
                onError={preview ? undefined : onError}
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true" className="grid h-full w-full place-items-center bg-brand text-3xl font-semibold text-brand-on">
                {initial}
              </span>
            )}
          </div>

          {busy && (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white" aria-hidden="true">
              <BiLoaderAlt className="animate-spin text-2xl motion-reduce:animate-none" />
            </span>
          )}

          <button
            type="button"
            onClick={() => fileInput.current && fileInput.current.click()}
            disabled={busy}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 !border-surface bg-brand text-brand-on shadow transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
          >
            <BiCamera aria-hidden="true" />
          </button>

          <input ref={fileInput} type="file" accept={ACCEPT} onChange={handleFile} className="hidden" tabIndex={-1} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink">{name}</p>
          <div className="mt-1">
            <Badge tone="neutral" className="capitalize">{role}</Badge>
          </div>
          {src && !busy && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-2 text-xs font-medium text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <p
        role={message && message.type === 'error' ? 'alert' : 'status'}
        className={`mt-3 min-h-[1.25rem] text-xs ${message && message.type === 'error' ? 'text-danger' : 'text-ink-3'}`}
      >
        {message ? message.text : 'JPG, PNG or WebP. You can reposition it before saving.'}
      </p>

      {cropFile && <PhotoCropper file={cropFile} onCancel={closeCropper} onConfirm={uploadFramed} />}
    </div>
  );
}