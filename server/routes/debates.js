const express = require('express');
const router = express.Router();
const Debate = require('../models/Debate');
const DebatePoint = require('../models/DebatePoint');
const DebateComment = require('../models/DebateComment');
const Notification = require('../models/Notification');
const { auth, guruAuth, adminAuth } = require('../middleware/auth');
const { resolveShlokaReferences } = require('../utils/shlokaRef');

async function notify(userId, type, message, debateId) {
  try {
    const notification = new Notification({ userId, type, message, debateId });
    await notification.save();
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
}

async function notifyAllGurus(type, message, debateId) {
  try {
    const User = require('../models/User');
    const gurus = await User.find({ role: { $in: ['guru', 'acharya'] } });
    const notifications = gurus.map(guru => ({
      userId: guru._id,
      type,
      message,
      debateId
    }));
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Failed to notify gurus:', err.message);
  }
}

function isOnSide(debate, userId) {
  const uid = userId.toString();
  const gov = Array.isArray(debate.governmentParticipants) ? debate.governmentParticipants : [];
  const opp = Array.isArray(debate.oppositionParticipants) ? debate.oppositionParticipants : [];
  return {
    isGovernment: gov.some(p => (p && p.toString ? p.toString() : p) === uid),
    isOpposition: opp.some(p => (p && p.toString ? p.toString() : p) === uid)
  };
}

function isParticipant(debate, userId) {
  const { isGovernment, isOpposition } = isOnSide(debate, userId);
  return isGovernment || isOpposition;
}

function isJudge(debate, userId) {
  return debate.judges.some(j => j.toString() === userId.toString());
}

// List debates
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = 'newest' } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['open', 'active', 'judging', 'completed'] };
    }
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'status') sortOption = { status: 1, createdAt: -1 };
    const debates = await Debate.find(query)
      .populate('createdBy', 'name avatar')
      .populate('governmentParticipants', 'name avatar')
      .populate('oppositionParticipants', 'name avatar')
      .populate('judges', 'name avatar')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Debate.countDocuments(query);
    res.json({ debates, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), total });
  } catch (error) {
    console.error('Error listing debates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create debate (Guru only)
router.post('/', guruAuth, async (req, res) => {
  try {
    const { title, motion, description, notes } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!motion || !motion.trim()) return res.status(400).json({ message: 'Motion is required' });
    const debate = new Debate({
      title: title.trim(), motion: motion.trim(),
      description: description?.trim() || '', notes: notes?.trim() || '',
      createdBy: req.user._id
    });
    await debate.save();
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await notify(admin._id, 'new_debate', `New Śāstrārtha proposal: "${debate.title}"`, debate._id);
    }
    res.status(201).json(debate);
  } catch (error) {
    console.error('Error creating debate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending debates
router.get('/pending/all', auth, async (req, res) => {
  try {
    const query = { status: { $in: ['pending', 'rejected'] } };
    if (req.user.role !== 'admin') query.createdBy = req.user._id;
    const debates = await Debate.find(query).populate('createdBy', 'name avatar').sort({ createdAt: -1 });
    res.json({ debates });
  } catch (error) {
    console.error('Error fetching pending debates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my debates
router.get('/my/participations', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const debates = await Debate.find({ $or: [{ createdBy: userId }, { governmentParticipants: userId }, { oppositionParticipants: userId }] })
      .populate('createdBy', 'name avatar').populate('governmentParticipants', 'name avatar').populate('oppositionParticipants', 'name avatar').sort({ updatedAt: -1 });
    res.json({ debates });
  } catch (error) {
    console.error('Error fetching my debates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single debate
router.get('/:id', async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('governmentParticipants', 'name avatar')
      .populate('oppositionParticipants', 'name avatar')
      .populate('judges', 'name avatar');
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    const governmentPointsCount = await DebatePoint.countDocuments({ debateId: debate._id, side: 'government', parentPointId: null });
    const oppositionPointsCount = await DebatePoint.countDocuments({ debateId: debate._id, side: 'opposition', parentPointId: null });
    res.json({ ...debate.toObject(), governmentPointsCount, oppositionPointsCount });
  } catch (error) {
    console.error('Error fetching debate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve / Reject debate (Admin only)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { approved } = req.body;
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (debate.status !== 'pending') return res.status(400).json({ message: 'Debate is not in pending status' });
    if (approved) {
      debate.status = 'open';
      await debate.save();
      await notifyAllGurus('debate_approved', `New Śāstrārtha published: "${debate.title}" — Join Government or Opposition!`, debate._id);
      await notify(debate.createdBy, 'debate_approved', `Your Śāstrārtha proposal "${debate.title}" has been approved!`, debate._id);
      res.json({ message: 'Debate approved', debate });
    } else {
      debate.status = 'rejected';
      debate.notes = req.body.reason || 'Rejected by admin';
      await debate.save();
      await notify(debate.createdBy, 'debate_rejected', `Your Śāstrārtha proposal "${debate.title}" was not approved.`, debate._id);
      res.json({ message: 'Debate rejected', debate });
    }
  } catch (error) {
    console.error('Error approving debate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join debate (Guru only)
router.post('/:id/join', guruAuth, async (req, res) => {
  try {
    const { side } = req.body;
    if (!side || !['government', 'opposition'].includes(side)) return res.status(400).json({ message: 'Side must be "government" or "opposition"' });
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (debate.status !== 'open') return res.status(400).json({ message: 'Debate is not open for participation' });
    const userId = req.user._id;
    const { isGovernment, isOpposition } = isOnSide(debate, userId);
    if (isGovernment || isOpposition) return res.status(400).json({ message: 'You have already joined this debate' });
    if (!Array.isArray(debate.governmentParticipants)) debate.governmentParticipants = [];
    if (!Array.isArray(debate.oppositionParticipants)) debate.oppositionParticipants = [];
    if (side === 'government') debate.governmentParticipants.push(userId);
    else debate.oppositionParticipants.push(userId);
    if (debate.governmentParticipants.length > 0 && debate.oppositionParticipants.length > 0) debate.status = 'active';
    await debate.save();
    const notifyType = side === 'government' ? 'joined_government' : 'joined_opposition';
    const notifyMsg = `${req.user.name} joined the ${side} side in "${debate.title}"`;
    const govParticipants = Array.isArray(debate.governmentParticipants) ? debate.governmentParticipants : [];
    const oppParticipants = Array.isArray(debate.oppositionParticipants) ? debate.oppositionParticipants : [];
    const creatorId = debate.createdBy ? debate.createdBy : null;
    const allParticipants = [...govParticipants, ...oppParticipants];
    if (creatorId) allParticipants.push(creatorId);
    const uniqueParticipants = [...new Set(allParticipants.map(p => (p && p.toString ? p.toString() : String(p))))].filter(pid => pid && pid !== userId.toString());
    for (const pid of uniqueParticipants) {
      await notify(pid, notifyType, notifyMsg, debate._id);
    }
    res.json({ message: `Joined ${side} side`, debate });
  } catch (error) {
    console.error('Error joining debate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add point (Guru on correct side)
router.post('/:id/points', guruAuth, async (req, res) => {
  try {
    const { side, title, content, references } = req.body;
    if (!side || !['government', 'opposition'].includes(side)) return res.status(400).json({ message: 'Side must be "government" or "opposition"' });
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (!['open', 'active'].includes(debate.status)) return res.status(400).json({ message: 'Debate is not accepting arguments' });
    const userId = req.user._id;
    const { isGovernment, isOpposition } = isOnSide(debate, userId);
    if (side === 'government' && !isGovernment) return res.status(403).json({ message: 'You are not on the Government side' });
    if (side === 'opposition' && !isOpposition) return res.status(403).json({ message: 'You are not on the Opposition side' });
    let shlokaReferences = [];
    try { shlokaReferences = await resolveShlokaReferences(content.trim()); } catch (e) { console.error('Shloka resolution failed:', e.message); }
    const point = new DebatePoint({ debateId: debate._id, parentPointId: null, side, authorId: userId, title: title?.trim() || '', content: content.trim(), references: references || [], shlokaReferences });
    await point.save();
    const targetParticipants = side === 'government' ? debate.oppositionParticipants : debate.governmentParticipants;
    for (const pid of targetParticipants) {
      await notify(pid, 'new_counterpoint', `New point from ${side} in "${debate.title}": ${title || content.slice(0, 100)}`, debate._id);
    }
    const allParticipantIds = [...debate.governmentParticipants, ...debate.oppositionParticipants].map(p => p.toString());
    const creatorId = debate.createdBy.toString();
    if (!allParticipantIds.includes(creatorId)) {
      await notify(debate.createdBy, 'new_counterpoint', `New point in "${debate.title}": ${title || content.slice(0, 100)}`, debate._id);
    }
    res.status(201).json(point);
  } catch (error) {
    console.error('Error adding point:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to point (Opposite side Guru)
router.post('/:id/points/:pointId/reply', guruAuth, async (req, res) => {
  try {
    const { content, references } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (!['open', 'active'].includes(debate.status)) return res.status(400).json({ message: 'Debate is not accepting arguments' });
    const parentPoint = await DebatePoint.findById(req.params.pointId);
    if (!parentPoint) return res.status(404).json({ message: 'Point not found' });
    if (parentPoint.debateId.toString() !== debate._id.toString()) return res.status(400).json({ message: 'Point does not belong to this debate' });
    const userId = req.user._id;
    const { isGovernment, isOpposition } = isOnSide(debate, userId);
    const oppositeSide = parentPoint.side === 'government' ? 'opposition' : 'government';
    const userSide = isGovernment ? 'government' : isOpposition ? 'opposition' : null;
    if (!userSide) return res.status(403).json({ message: 'You are not a participant in this debate' });
    if (userSide === parentPoint.side) return res.status(403).json({ message: 'You can only reply to points from the opposite side' });
    let shlokaReferences = [];
    try { shlokaReferences = await resolveShlokaReferences(content.trim()); } catch (e) { console.error('Shloka resolution failed:', e.message); }
    const reply = new DebatePoint({ debateId: debate._id, parentPointId: parentPoint._id, side: oppositeSide, authorId: userId, title: '', content: content.trim(), references: references || [], shlokaReferences });
    await reply.save();
    await notify(parentPoint.authorId, 'new_reply', `${req.user.name} replied to your point in "${debate.title}"`, debate._id);
    const parentSideParticipants = parentPoint.side === 'government' ? debate.governmentParticipants : debate.oppositionParticipants;
    for (const pid of parentSideParticipants) {
      if (pid.toString() !== parentPoint.authorId.toString()) {
        await notify(pid, 'new_reply', `New reply in "${debate.title}" from ${oppositeSide}`, debate._id);
      }
    }
    res.status(201).json(reply);
  } catch (error) {
    console.error('Error replying to point:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get points for debate (Threaded)
router.get('/:id/points', async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    const allPoints = await DebatePoint.find({ debateId: debate._id }).populate('authorId', 'name avatar').sort({ createdAt: 1 });
    const pointMap = {};
    const rootPoints = [];
    allPoints.forEach(point => { pointMap[point._id.toString()] = { ...point.toObject(), replies: [] }; });
    allPoints.forEach(point => {
      const p = pointMap[point._id.toString()];
      if (point.parentPointId) {
        const parent = pointMap[point.parentPointId.toString()];
        if (parent) parent.replies.push(p);
      } else rootPoints.push(p);
    });
    const governmentPoints = rootPoints.filter(p => p.side === 'government');
    const oppositionPoints = rootPoints.filter(p => p.side === 'opposition');
    res.json({ governmentPoints, oppositionPoints, allThreaded: rootPoints });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign judges (Admin only)
router.post('/:id/judges', adminAuth, async (req, res) => {
  try {
    const { judgeIds } = req.body;
    if (!judgeIds || !Array.isArray(judgeIds) || judgeIds.length === 0) return res.status(400).json({ message: 'judgeIds array is required' });
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (!['active', 'judging'].includes(debate.status)) return res.status(400).json({ message: 'Debate must be active or in judging phase' });
    const User = require('../models/User');
    const mongoose = require('mongoose');
    const validJudges = [];
    for (const jId of judgeIds) {
      let user;
      if (mongoose.Types.ObjectId.isValid(jId)) user = await User.findById(jId);
      else user = await User.findOne({ email: jId.toLowerCase() });
      if (!user) return res.status(400).json({ message: 'User not found' });
      if (!['guru', 'acharya'].includes(user.role)) return res.status(400).json({ message: `${user.name} is not a Guru` });
      if (isParticipant(debate, user._id)) return res.status(400).json({ message: `${user.name} is participating and cannot be a judge` });
      if (debate.createdBy.toString() === user._id.toString()) return res.status(400).json({ message: `${user.name} created this debate and cannot be a judge` });
      validJudges.push(user._id);
    }
    debate.judges = validJudges;
    debate.status = 'judging';
    await debate.save();
    for (const jId of validJudges) {
      await notify(jId, 'debate_judging', `You have been assigned as a judge for "${debate.title}"`, debate._id);
    }
    const allParticipants = [...debate.governmentParticipants, ...debate.oppositionParticipants];
    for (const pid of allParticipants) {
      await notify(pid, 'debate_judging', `"${debate.title}" has moved to the Judging phase`, debate._id);
    }
    res.json({ message: 'Judges assigned', debate });
  } catch (error) {
    console.error('Error assigning judges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Declare winner (Admin or Judge)
router.post('/:id/winner', auth, async (req, res) => {
  try {
    const { winner, finalRemarks } = req.body;
    if (!winner || !['government', 'opposition'].includes(winner)) return res.status(400).json({ message: 'Winner must be "government" or "opposition"' });
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    
    // Check authorization: must be admin OR an assigned judge
    const isAdmin = req.user.role === 'admin';
    const isAssignedJudge = isJudge(debate, req.user._id);
    if (!isAdmin && !isAssignedJudge) return res.status(403).json({ message: 'Only admins or assigned judges can declare the winner' });

    if (debate.status !== 'judging') return res.status(400).json({ message: 'Debate must be in judging phase' });
    debate.winner = winner;
    debate.finalRemarks = finalRemarks?.trim() || '';
    debate.status = 'completed';
    debate.completedAt = new Date();
    debate.lockedAt = new Date();
    await debate.save();
    const allParticipants = [...debate.governmentParticipants, ...debate.oppositionParticipants, debate.createdBy, ...debate.judges];
    const uniqueParticipants = [...new Set(allParticipants.map(p => p.toString()))];
    for (const pid of uniqueParticipants) {
      await notify(pid, 'winner_announced', `Winner declared in "${debate.title}": ${winner} side wins!`, debate._id);
    }
    res.json({ message: `Winner declared: ${winner}`, debate });
  } catch (error) {
    console.error('Error declaring winner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add community comment (supports replies via parentCommentId)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { comment, parentCommentId } = req.body;
    if (!comment || !comment.trim()) return res.status(400).json({ message: 'Comment is required' });
    const debate = await Debate.findById(req.params.id);
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (parentCommentId) {
      const parent = await DebateComment.findById(parentCommentId);
      if (!parent) return res.status(404).json({ message: 'Parent comment not found' });
    }
    const debateComment = new DebateComment({
      debateId: debate._id,
      userId: req.user._id,
      comment: comment.trim(),
      parentCommentId: parentCommentId || null
    });
    await debateComment.save();
    const populated = await DebateComment.findById(debateComment._id).populate('userId', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get community comments (threaded: root comments + replies)
router.get('/:id/comments', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const allComments = await DebateComment.find({ debateId: req.params.id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await DebateComment.countDocuments({ debateId: req.params.id });
    // Build threaded structure
    const commentMap = {};
    const rootComments = [];
    allComments.forEach(c => {
      commentMap[c._id.toString()] = { ...c.toObject(), replies: [] };
    });
    allComments.forEach(c => {
      const cId = c._id.toString();
      const parentId = c.parentCommentId ? c.parentCommentId.toString() : null;
      if (parentId && commentMap[parentId]) {
        commentMap[parentId].replies.push(commentMap[cId]);
      } else {
        rootComments.push(commentMap[cId]);
      }
    });
    res.json({ comments: rootComments, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), total });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like / Unlike a comment
router.post('/:id/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await DebateComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const userId = req.user._id;
    const idx = comment.likes.indexOf(userId);
    if (idx === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(idx, 1);
    }
    await comment.save();
    res.json({ likes: comment.likes.length, liked: idx === -1 });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
