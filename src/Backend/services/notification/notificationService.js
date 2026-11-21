'use strict';

/**
 * Single entry point for raising notifications from the rest of the app.
 * NEVER throws: a failed notification must not break the action that caused it.
 *
 * Put WHAT happened in `data` (ids, counts, status). Do not put names or other
 * personal details in title/body; where to redirect is decided by the frontend
 * from `type` + the viewer's role + `data`.
 */
const { upsertNotification } = require('../../models/notificationModel');
const { TYPES, SEVERITIES } = require('./notificationTypes');
const { sendMail } = require('../mailer');

const KNOWN_TYPES = new Set(Object.values(TYPES));
const CHUNK = 25;

/**
 * @param {{ userId: number, type: string, title: string, body?: string,
 *           data?: object, severity?: 'info'|'warning'|'critical',
 *           dedupeKey?: string }} n
 *  dedupeKey: same key for the same user re-raises (and refreshes) the existing
 *  notification instead of adding another. Omit it to always add a new one.
 *  email: optional { to, text }. Also emails the notification (subject = title).
 *  It is sent independently of the in-app notification, and its failure is only logged.
 */
async function notify({ userId, type, title, body = null, data = {}, severity = 'info', dedupeKey, email = null }) {
  try {
    if (!userId) return null;
    if (!KNOWN_TYPES.has(type)) throw new Error(`unknown notification type "${type}"`);
    if (!SEVERITIES.includes(severity)) throw new Error(`invalid severity "${severity}"`);
    if (email?.to) {
      sendMail({ to: email.to, subject: title, text: email.text || body || title })
        .catch((err) => console.error('[notify] email failed:', err.message));
    }
    return await upsertNotification({ userId, type, title, body, link: null, data, severity, dedupeKey });
  } catch (err) {
    console.error('[notify] failed:', err.message);
    return null;
  }
}

/** Same payload to many users (duplicates and empty ids are ignored). */
async function notifyMany(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  for (let i = 0; i < unique.length; i += CHUNK) {
    await Promise.all(unique.slice(i, i + CHUNK).map((userId) => notify({ ...payload, userId })));
  }
}

module.exports = { notify, notifyMany };