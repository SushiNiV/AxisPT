const notificationModel = require('../models/notificationModel');

exports.getMyNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const cursor = req.query.cursor || null;
    const data = await notificationModel.getNotifications(req.user.id, limit, cursor);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('getMyNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyUnreadCount = async (req, res) => {
  try {
    const count = await notificationModel.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (err) {
    console.error('getMyUnreadCount error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await notificationModel.markRead(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await notificationModel.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// ANNOUNCEMENTS (Phase 2 prep)
// ==========================================

exports.getAnnouncements = async (req, res) => {
  try {
    // Map JWT role to DB audience enum. Admins see 'all'.
    let audience = 'all';
    if (req.user.role === 'student') audience = 'students';
    if (req.user.role === 'faculty') audience = 'faculty';

    // programId is passed from the query for now. 
    // In the future, we can fetch this server-side using the SQL we confirmed.
    const programId = req.query.programId ? parseInt(req.query.programId, 10) : null;

    const data = await notificationModel.getAnnouncements(audience, programId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('getAnnouncements error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, body, audience, programId } = req.body;
    if (!title || !body || !audience) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const data = await notificationModel.createAnnouncement({
      title,
      body,
      audience,
      programId: programId || null,
      createdBy: req.user.id,
    });

    notificationModel.fanOutAnnouncement({
      announcementId: data.announcement_id,
      title,
      body,
      audience,
      programId: programId || null,
    }).catch(err => console.error('Fan-out error:', err));

    res.json({ success: true, data });
  } catch (err) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await notificationModel.deleteAnnouncement(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};