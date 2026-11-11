'use strict';

/**
 * Notification controller: the signed-in user's notifications (the bell) and
 * announcements. The user always comes from the verified token.
 *
 * Conventions: success is { success: true, ... }; failures are thrown as
 * HttpError and handled by the global error handler.
 */

const notificationModel = require('../models/notificationModel');
const { HttpError } = require('../../utils/httpError');
const { parseId } = require('../../utils/request');
const { audit } = require('../../utils/audit');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const AUDIENCES = ['all', 'students', 'faculty'];
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 5000;

/** Token role -> announcement audience. Admins see "all". */
const AUDIENCE_BY_ROLE = { student: 'students', faculty: 'faculty' };

/** Roles whose program is looked up on the server rather than taken from the request. */
const PROGRAM_BOUND_ROLES = ['student', 'faculty'];

function parsePageSize(value) {
  if (value === undefined || value === '') return DEFAULT_PAGE_SIZE;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'limit must be a whole number of at least 1.');
  return Math.min(n, MAX_PAGE_SIZE);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** GET /notifications?limit=&cursor= */
exports.getMyNotifications = async (req, res) => {
  const data = await notificationModel.getNotifications(
    req.user.id,
    parsePageSize(req.query.limit),
    req.query.cursor || null
  );
  res.json({ success: true, ...data });
};

/** GET /notifications/unread-count */
exports.getMyUnreadCount = async (req, res) => {
  const count = await notificationModel.getUnreadCount(req.user.id);
  res.json({ success: true, count });
};

/** POST /notifications/:id/read */
exports.markRead = async (req, res) => {
  await notificationModel.markRead(req.user.id, parseId(req.params.id));
  res.json({ success: true });
};

/** POST /notifications/read-all */
exports.markAllRead = async (req, res) => {
  await notificationModel.markAllRead(req.user.id);
  res.json({ success: true });
};

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

/**
 * GET /announcements
 * Students and faculty get the announcements for their own program, looked up
 * from their account. Admins may filter with ?programId=.
 */
exports.getAnnouncements = async (req, res) => {
  const { role, id: userId } = req.user;
  const audience = AUDIENCE_BY_ROLE[role] || 'all';

  const programId = PROGRAM_BOUND_ROLES.includes(role)
    ? await notificationModel.getProgramIdForUser(userId, role)
    : (req.query.programId ? parseId(req.query.programId) : null);

  const data = await notificationModel.getAnnouncements(audience, programId);
  res.json({ success: true, data });
};

/** POST /announcements  Body: { title, body, audience, programId? } */
exports.createAnnouncement = async (req, res) => {
  const { title, body, audience, programId } = req.body ?? {};

  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanBody = typeof body === 'string' ? body.trim() : '';
  if (!cleanTitle || !cleanBody || !audience) {
    throw new HttpError(400, 'Missing required fields');
  }
  if (cleanTitle.length > MAX_TITLE_LENGTH) {
    throw new HttpError(400, `Title must be at most ${MAX_TITLE_LENGTH} characters.`);
  }
  if (cleanBody.length > MAX_BODY_LENGTH) {
    throw new HttpError(400, `Body must be at most ${MAX_BODY_LENGTH} characters.`);
  }
  if (!AUDIENCES.includes(audience)) {
    throw new HttpError(400, `Audience must be one of: ${AUDIENCES.join(', ')}.`);
  }

  const cleanProgramId = programId ? parseId(programId) : null;

  const announcement = await notificationModel
    .createAnnouncement({
      title: cleanTitle,
      body: cleanBody,
      audience,
      programId: cleanProgramId,
      createdBy: req.user.id,
    })
    .catch((error) => {
      if (error?.code === '23503') throw new HttpError(400, 'The selected program does not exist.');
      throw error;
    });

  // Delivery happens in the background: the response does not wait for every recipient.
  // fanOutAnnouncement never throws; it logs its own failures.
  notificationModel.fanOutAnnouncement({
    announcementId: announcement.announcement_id,
    title: cleanTitle,
    body: cleanBody,
    audience,
    programId: cleanProgramId,
  });

  await audit(req, {
    tableName: 'announcements',
    recordId: announcement.announcement_id,
    action: 'ANNOUNCEMENT_CREATED',
    oldValues: null,
    newValues: { title: cleanTitle, audience, program_id: cleanProgramId },
  });

  res.json({ success: true, data: announcement });
};

/** DELETE /announcements/:id  Also removes the notifications it created. */
exports.deleteAnnouncement = async (req, res) => {
  const announcementId = parseId(req.params.id);

  const deleted = await notificationModel.deleteAnnouncement(announcementId);
  if (!deleted) throw new HttpError(404, 'Announcement not found.');

  await audit(req, {
    tableName: 'announcements',
    recordId: announcementId,
    action: 'ANNOUNCEMENT_DELETED',
    oldValues: null,
    newValues: { title: deleted.title },
  });

  res.json({ success: true });
};