'use strict';

/**
 * Background jobs. Call startNotificationJobs() once after the server starts:
 *   require('./services/notifications/jobs').startNotificationJobs();
 *
 * A Postgres advisory lock makes sure only one process runs a job at a time
 * (PM2 cluster mode, several instances). Note: an in-process timer does not run
 * while the host is asleep (e.g. free-tier hosting); use the host's cron to hit
 * a route or script in that case.
 */
const db = require('../../config/db');
const { checkStandings } = require('./standingWatcher');
const { cleanupOldNotifications } = require('../../models/notificationModel');

const STANDING_EVERY_MS = Number(process.env.STANDING_CHECK_MINUTES || 60) * 60 * 1000;
const CLEANUP_EVERY_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 30 * 1000;

const LOCK_STANDING = 74120001;
const LOCK_CLEANUP = 74120002;

async function runLocked(lockKey, name, job) {
  let client;
  try {
    client = await db.connect();
    const { rows } = await client.query('SELECT pg_try_advisory_lock($1) AS ok', [lockKey]);
    if (!rows[0].ok) return; // another process is running it
    try {
      const result = await job();
      if (result) console.log(`[jobs] ${name}:`, JSON.stringify(result));
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [lockKey]);
    }
  } catch (err) {
    console.error(`[jobs] ${name} failed:`, err.message);
  } finally {
    if (client) client.release();
  }
}

let started = false;

function startNotificationJobs() {
  if (started) return;
  started = true;

  const standing = () => runLocked(LOCK_STANDING, 'standing-check', checkStandings);
  const cleanup = () => runLocked(LOCK_CLEANUP, 'cleanup', cleanupOldNotifications);

  setTimeout(standing, FIRST_RUN_DELAY_MS).unref();
  setInterval(standing, STANDING_EVERY_MS).unref();
  setInterval(cleanup, CLEANUP_EVERY_MS).unref();
}

module.exports = { startNotificationJobs };