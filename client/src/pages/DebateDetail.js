import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiPlus, FiSend, FiCheck, FiX, FiAward, FiLock, FiInfo, FiShield, FiMessageCircle } from 'react-icons/fi';
import ShlokaAutocomplete from '../components/ShlokaAutocomplete';
import GuruAutocomplete from '../components/GuruAutocomplete';
import AnswerBodyWithShlokas from '../components/AnswerBodyWithShlokas';

const STATUS_MAP = {
  pending: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
  open: { label: 'Open for Participation', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  active: { label: 'Active', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
  judging: { label: 'Judging', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400' },
  completed: { label: 'Completed', dot: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400' }
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || {};
  return (
    <span className={`inline-flex items-center gap-1.5 text-[14px] font-medium px-2.5 py-1 rounded-full border border-transparent ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
    </span>
  );
};

// ── Threaded Point ──────────────────────────────────────────
const ThreadedPoint = ({ point, isNested, onReply, currentUserSide, canReply, debateStatus }) => {
  const [expanded, setExpanded] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setReplying(true);
    try { await onReply(point._id, replyContent.trim()); setReplyContent(''); setShowReply(false); } catch (err) {}
    setReplying(false);
  };

  const sideClass = point.side === 'government'
    ? 'border-l-[3px] border-blue-500/50'
    : 'border-l-[3px] border-red-500/50';
  const sideBadge = point.side === 'government'
    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400';
  const canUserReply = canReply && debateStatus !== 'completed' && debateStatus !== 'judging';

  return (
    <div className={`${isNested ? 'ml-5 pl-4 border-l border-gray-100 dark:border-[#2A2520]/80' : ''}`}>
      <div className={`mb-2.5 bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-[#2A2520]/60 ${sideClass} hover:border-gray-300/80 dark:hover:border-[#3A342E]/80 hover:shadow-sm transition-all duration-200 p-4`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-[14px] font-semibold px-2 py-0.5 rounded-[6px] ${sideBadge}`}>
              {point.side === 'government' ? 'Govt' : 'Opp'}
            </span>
            <span className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
              {point.authorId?.name || 'Unknown'}
            </span>
            <span className="text-[15px] text-gray-400 dark:text-gray-500">
              {new Date(point.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {point.replies?.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[16px] text-gray-400 dark:text-gray-500 hover:text-brand transition-colors"
            >
              {point.replies.length} replies
            </button>
          )}
        </div>

        {/* Content */}
        {point.title && (
          <h4 className="text-[16px] font-semibold text-gray-800 dark:text-gray-200 mb-1">{point.title}</h4>
        )}
        <div className="text-[16px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
          <AnswerBodyWithShlokas content={point.content} shlokaReferences={point.shlokaReferences} />
        </div>

        {/* Reply action */}
        {canUserReply && currentUserSide && point.side !== currentUserSide && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-[#2A2520]/60">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[16px] text-brand hover:text-brand-500 font-medium flex items-center gap-1.5 transition-colors"
            >
              <FiMessageCircle size={12} />
              {showReply ? 'Cancel' : 'Reply to this point'}
            </button>
          </div>
        )}

        {/* Reply form */}
        {showReply && (
          <div className="mt-2.5 bg-gray-50/80 dark:bg-[#2A2520]/40 rounded-xl p-3 border border-gray-100 dark:border-[#2A2520]/60">
            <ShlokaAutocomplete
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Write your counterpoint with shloka references..."
              rows={3}
            />
            <div className="flex justify-end mt-2 gap-2">
              <button
                onClick={() => { setShowReply(false); setReplyContent(''); }}
                className="h-7 px-3 text-[15px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2520]/60 rounded-[7px] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={replying || !replyContent.trim()}
                className="h-7 px-3 text-[15px] font-medium bg-brand text-white rounded-[7px] hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <FiSend size={11} />
                {replying ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {expanded && point.replies?.length > 0 && (
        <div className="space-y-2">
          {point.replies.map(reply => (
            <ThreadedPoint
              key={reply._id}
              point={reply}
              isNested={true}
              onReply={onReply}
              currentUserSide={currentUserSide}
              canReply={canReply}
              debateStatus={debateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Community Comments (Modern) ────────────────────────────
const CommunityComments = ({ debateId, comments, onAddComment, currentUser }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [localComments, setLocalComments] = useState(comments);

  useEffect(() => { setLocalComments(comments); }, [comments]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try { await onAddComment(newComment.trim()); setNewComment(''); setFocused(false); } catch (err) {}
    setSubmitting(false);
  };

  const handleLike = async (commentId) => {
    if (!currentUser) return;
    setLikedMap(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    try {
      const res = await api.post(`/debates/${debateId}/comments/${commentId}/like`);
      setLikedMap(prev => ({ ...prev, [commentId]: res.data.liked }));
    } catch {
      setLikedMap(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    try {
      const res = await api.post(`/debates/${debateId}/comments`, { comment: replyText.trim(), parentCommentId: parentId });
      const newReply = { ...res.data, replies: [], userId: res.data.userId };
      setLocalComments(prev => prev.map(c => {
        if (c._id === parentId) return { ...c, replies: [...(c.replies || []), newReply] };
        return c;
      }));
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted!');
    } catch (err) { toast.error('Failed to post reply'); }
    setReplying(false);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const avatarLetter = (name) => (name?.charAt(0)?.toUpperCase() || '?');

  const renderComment = (c, idx, isReply = false) => (
    <div key={c._id} className={`${isReply ? 'ml-10 mt-3' : ''}`}>
      <div className="flex gap-2.5">
        <div className="shrink-0">
          <div className={`${isReply ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-[14px]'} rounded-full bg-gradient-to-br from-brand to-brand-500 flex items-center justify-center font-semibold text-white shadow-sm`}>
            {avatarLetter(c.userId?.name)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-[#2A2520]/40 rounded-2xl rounded-tl-md px-4 py-3 border border-gray-100/60 dark:border-[#2A2520]/60">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">
                {c.userId?.name || 'Anonymous'}
              </span>
              <span className="text-[12px] text-gray-400 dark:text-gray-500">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">{c.comment}</p>
          </div>
          <div className="flex items-center gap-3 ml-2 mt-1">
            <button
              onClick={() => handleLike(c._id)}
              className={`text-[12px] font-medium transition-colors ${likedMap[c._id] ? 'text-brand' : 'text-gray-400 dark:text-gray-500 hover:text-brand'}`}
            >
              {likedMap[c._id] ? '♥' : '♡'} {c.likes?.length || 0}
            </button>
            {!isReply && (
              <button onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)} className="text-[12px] font-medium text-gray-400 dark:text-gray-500 hover:text-brand transition-colors">
                Reply
              </button>
            )}
          </div>
          {replyingTo === c._id && currentUser && (
            <div className="flex gap-2 mt-2 ml-2">
              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit(c._id); } }} placeholder="Write a reply..." className="flex-1 border border-gray-200 dark:border-[#3A342E] rounded-lg px-3 py-2 text-[14px] text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1C1814] placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all" autoFocus />
              <button onClick={() => handleReplySubmit(c._id)} disabled={replying || !replyText.trim()} className="h-9 px-3 bg-brand text-white rounded-lg text-[13px] font-medium hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">{replying ? '...' : 'Reply'}</button>
            </div>
          )}
        </div>
      </div>
      {c.replies?.length > 0 && (
        <div className="space-y-3">{c.replies.map((r, ri) => renderComment(r, ri, true))}</div>
      )}
    </div>
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-[#2A2520]/60 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-brand/10 flex items-center justify-center">
            <FiMessageCircle size={15} className="text-brand" />
          </div>
          <h3 className="text-[17px] font-bold text-gray-800 dark:text-gray-200">Discussion</h3>
          <span className="text-[14px] text-gray-400 dark:text-gray-500 font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2A2520]/60">{localComments.length}</span>
        </div>
      </div>

      {currentUser ? (
        <div className="flex gap-3 mb-6">
          <div className="shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-500 flex items-center justify-center text-[15px] font-semibold text-white shadow-sm">{avatarLetter(currentUser.name)}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${focused ? 'border-brand/40 ring-2 ring-brand/10 shadow-sm' : 'border-gray-200 dark:border-[#3A342E] hover:border-gray-300 dark:hover:border-[#504840]'}`}>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={handleKeyDown} placeholder="Share your thoughts on this debate..." rows={focused ? 3 : 1} className="w-full bg-white dark:bg-[#1C1814] resize-none text-[16px] text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-500 outline-none px-4 pt-3 pb-2 transition-all" maxLength={5000} />
              {focused && (
                <div className="flex items-center justify-between px-3 pb-2.5">
                  <span className={`text-[12px] font-medium ${newComment.length > 4500 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>{5000 - newComment.length} remaining</span>
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline text-[11px] text-gray-300 dark:text-gray-600">⌘↵ to post</span>
                    <button onMouseDown={(e) => { e.preventDefault(); handleSubmit(); }} disabled={submitting || !newComment.trim()} className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[9px] text-[14px] font-medium transition-all active:scale-[0.97] ${newComment.trim() && !submitting ? 'bg-brand text-white hover:bg-brand-500 shadow-sm shadow-brand/10' : 'bg-gray-100 dark:bg-[#2A2520] text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}><FiSend size={12} />{submitting ? 'Posting...' : 'Post'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-gradient-to-br from-brand/5 to-transparent rounded-xl border border-brand/10 p-5 text-center">
          <p className="text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-1">Join the discussion</p>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-3">Share your perspective on this debate.</p>
          <Link to="/login" className="inline-flex items-center gap-1.5 h-9 px-4 bg-brand text-white rounded-[9px] text-[14px] font-medium hover:bg-brand-500 transition-all shadow-sm active:scale-[0.97]"><FiMessageCircle size={13} />Login to Comment</Link>
        </div>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto scroll-smooth">
        {localComments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-[#2A2520]/40 flex items-center justify-center mx-auto mb-3"><FiMessageCircle size={24} className="text-gray-300 dark:text-gray-500" /></div>
            <p className="text-[16px] font-medium text-gray-500 dark:text-gray-400">No comments yet</p>
            <p className="text-[14px] text-gray-400 dark:text-gray-500 mt-0.5">Be the first to share your thoughts!</p>
          </div>
        ) : (
          localComments.map((c, idx) => renderComment(c, idx))
        )}
      </div>
    </div>
  );
};

// ── Modal Base ──────────────────────────────────────────────
const Modal = ({ open, onClose, title, icon: Icon, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-[#1C1814] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2A2520] max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2A2520]/60">
            <div className="flex items-center gap-2.5">
              {Icon && <Icon size={18} className="text-brand" />}
              <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2520] text-gray-400 hover:text-gray-600 transition-colors">
              <FiX size={15} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────
const DebateDetail = () => {
  const { id } = useParams();
  const { user, isGuru, isAdmin } = useAuth();
  const [debate, setDebate] = useState(null);
  const [governmentPoints, setGovernmentPoints] = useState([]);
  const [oppositionPoints, setOppositionPoints] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinSide, setJoinSide] = useState(null);
  const [joining, setJoining] = useState(false);
  const [showAddPoint, setShowAddPoint] = useState(false);
  const [newPoint, setNewPoint] = useState({ side: '', title: '', content: '' });
  const [addingPoint, setAddingPoint] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [judges, setJudges] = useState([]);
  const [assigningJudges, setAssigningJudges] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winner, setWinner] = useState(null);
  const [finalRemarks, setFinalRemarks] = useState('');
  const [declaring, setDeclaring] = useState(false);

  const fetchDebate = useCallback(async () => {
    try {
      const [debateRes, pointsRes, commentsRes] = await Promise.all([
        api.get(`/debates/${id}`),
        api.get(`/debates/${id}/points`),
        api.get(`/debates/${id}/comments`)
      ]);
      setDebate(debateRes.data);
      setGovernmentPoints(pointsRes.data.governmentPoints);
      setOppositionPoints(pointsRes.data.oppositionPoints);
      setComments(commentsRes.data.comments);
    } catch (error) {
      console.error('Error fetching debate:', error);
      toast.error('Failed to load debate');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchDebate(); }, [fetchDebate]);

  const currentUserSide = debate
    ? (Array.isArray(debate.governmentParticipants)
        ? debate.governmentParticipants : []
      ).some(p => String(p._id || p) === String(user?._id))
      ? 'government'
      : (Array.isArray(debate.oppositionParticipants)
          ? debate.oppositionParticipants : []
        ).some(p => String(p._id || p) === String(user?._id))
        ? 'opposition'
        : null
    : null;
  const isOnGov = currentUserSide === 'government';
  const isOnOpp = currentUserSide === 'opposition';
  const isParticipant = isOnGov || isOnOpp;
  const canJoin = debate?.status === 'open' && !isParticipant && isGuru();
  const isCurrentJudge = debate?.judges?.some(j => String(j._id || j) === String(user?._id));

  const handleJoin = async () => {
    if (!joinSide) return;
    setJoining(true);
    try {
      await api.post(`/debates/${id}/join`, { side: joinSide });
      toast.success(`Joined ${joinSide} side!`);
      await fetchDebate();
      setJoinSide(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join');
    }
    setJoining(false);
  };

  const handleAddPoint = async () => {
    if (!newPoint.content.trim()) return;
    setAddingPoint(true);
    try {
      await api.post(`/debates/${id}/points`, {
        side: newPoint.side || currentUserSide,
        title: newPoint.title.trim(),
        content: newPoint.content.trim()
      });
      toast.success('Point added!');
      setNewPoint({ side: currentUserSide, title: '', content: '' });
      setShowAddPoint(false);
      await fetchDebate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add point');
    }
    setAddingPoint(false);
  };

  const handleReply = async (pointId, content) => {
    try {
      await api.post(`/debates/${id}/points/${pointId}/reply`, { content, references: [] });
      toast.success('Reply submitted!');
      await fetchDebate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reply');
    }
  };

  const handleAssignJudges = async () => {
    const judgeIds = judges.map(j => j._id);
    if (judgeIds.length === 0) return;
    setAssigningJudges(true);
    try {
      await api.post(`/debates/${id}/judges`, { judgeIds });
      toast.success('Judges assigned!');
      setShowJudgeModal(false);
      await fetchDebate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign judges');
    }
    setAssigningJudges(false);
  };

  const handleDeclareWinner = async () => {
    if (!winner) return;
    setDeclaring(true);
    try {
      await api.post(`/debates/${id}/winner`, { winner, finalRemarks: finalRemarks.trim() });
      toast.success(`Winner declared: ${winner} side!`);
      setShowWinnerModal(false);
      await fetchDebate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to declare winner');
    }
    setDeclaring(false);
  };

  const handleAddComment = async (comment) => {
    try {
      await api.post(`/debates/${id}/comments`, { comment });
      toast.success('Comment posted!');
      const res = await api.get(`/debates/${id}/comments`);
      setComments(res.data.comments);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-7 bg-gray-100 dark:bg-[#1C1814] rounded-lg w-1/3" />
          <div className="h-10 bg-gray-100 dark:bg-[#1C1814] rounded-2xl w-2/3" />
          <div className="h-4 bg-gray-100 dark:bg-[#1C1814] rounded w-1/2" />
          <div className="h-32 bg-gray-100 dark:bg-[#1C1814] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 px-4">
        <h1 className="text-[24px] font-bold text-gray-800 dark:text-gray-200 mb-2">Debate not found</h1>
        <Link to="/debates" className="text-brand hover:underline text-[16px]">Browse all debates →</Link>
      </div>
    );
  }

  const canAddPoint = (isOnGov || isOnOpp) && ['open', 'active'].includes(debate.status);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <Link to="/debates" className="inline-flex items-center gap-1.5 text-[16px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group">
        <FiChevronLeft size={13} />
        <span>All Debates</span>
      </Link>

      {/* ── Hero Card ────────────────────────────── */}
      <div className="bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-[#2A2520]/60 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">{debate.title}</h1>
              <StatusBadge status={debate.status} />
            </div>
            <blockquote className="border-l-[3px] border-brand/40 pl-4 italic text-[16px] text-gray-500 dark:text-gray-400 my-3 leading-relaxed">"{debate.motion}"</blockquote>
            {debate.description && <p className="text-[16px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2">{debate.description}</p>}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {canJoin && !joinSide && (
              <div className="flex gap-2">
                <button onClick={() => setJoinSide('government')} className="h-8 px-3.5 bg-blue-600 text-white rounded-[9px] text-[16px] font-medium hover:bg-blue-700 transition-all active:scale-[0.97]">Join Govt</button>
                <button onClick={() => setJoinSide('opposition')} className="h-8 px-3.5 bg-red-600 text-white rounded-[9px] text-[16px] font-medium hover:bg-red-700 transition-all active:scale-[0.97]">Join Opp</button>
              </div>
            )}
            {joinSide && (
              <div className="bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 rounded-xl p-3 text-center">
                <p className="text-[15px] text-blue-800 dark:text-blue-300 mb-2">Join <strong>{joinSide}</strong> side?</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={handleJoin} disabled={joining} className="h-7 px-3 bg-blue-600 text-white text-[15px] rounded-[7px] font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">{joining ? 'Joining...' : 'Confirm'}</button>
                  <button onClick={() => setJoinSide(null)} className="h-7 px-3 bg-gray-100 dark:bg-[#2A2520] text-gray-600 dark:text-gray-400 text-[15px] rounded-[7px] hover:bg-gray-200 dark:hover:bg-[#3A342E] transition-all">Cancel</button>
                </div>
              </div>
            )}
            {isParticipant && canAddPoint && (
              <button onClick={() => setShowAddPoint(!showAddPoint)} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-brand text-white rounded-[9px] text-[16px] font-medium hover:bg-brand-500 transition-all shadow-sm active:scale-[0.97]">
                <FiPlus size={13} />
                {showAddPoint ? 'Cancel' : `Add ${currentUserSide === 'government' ? 'Govt' : 'Opp'} Point`}
              </button>
            )}
          </div>
        </div>

        {/* Participants & Judges */}
        <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-gray-100 dark:border-[#2A2520]/60">
          <div>
            <p className="text-[14px] text-gray-400 dark:text-gray-500 mb-1 font-medium">Proposed by</p>
            <span className="text-[16px] font-medium text-gray-800 dark:text-gray-200">{debate.createdBy?.name || 'Unknown'}</span>
          </div>
          <div>
            <p className="text-[14px] text-blue-600 dark:text-blue-400 mb-1 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Government</p>
            <div className="flex flex-wrap gap-1">
              {debate.governmentParticipants?.length > 0
                ? debate.governmentParticipants.map(p => <span key={p._id || p} className="text-[14px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-[6px] font-medium">{p.name || 'Unknown'}</span>)
                : <span className="text-[14px] text-gray-400 dark:text-gray-500">No participants yet</span>}
            </div>
          </div>
          <div>
            <p className="text-[14px] text-red-600 dark:text-red-400 mb-1 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Opposition</p>
            <div className="flex flex-wrap gap-1">
              {debate.oppositionParticipants?.length > 0
                ? debate.oppositionParticipants.map(p => <span key={p._id || p} className="text-[14px] bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-[6px] font-medium">{p.name || 'Unknown'}</span>)
                : <span className="text-[14px] text-gray-400 dark:text-gray-500">No participants yet</span>}
            </div>
          </div>
          {debate.judges?.length > 0 && (
            <div>
              <p className="text-[14px] text-purple-600 dark:text-purple-400 mb-1 font-medium flex items-center gap-1"><FiShield size={11} /> Judges</p>
              <div className="flex flex-wrap gap-1">
                {debate.judges.map(j => <span key={j._id || j} className="text-[14px] bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-[6px] font-medium">{j.name || 'Unknown'}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Winner Announcement */}
        {debate.status === 'completed' && debate.winner && (
          <div className={`mt-4 p-3 rounded-xl text-center font-semibold text-[16px] ${
            debate.winner === 'government'
              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20'
              : 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 border border-red-200/60 dark:border-red-500/20'
          }`}>
            <FiAward size={14} className="inline mr-1.5" />
            Winner: {debate.winner === 'government' ? 'Government' : 'Opposition'} Side
          </div>
        )}
        {debate.finalRemarks && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-[#2A2520]/40 rounded-xl text-[16px] text-gray-500 dark:text-gray-400 italic border border-gray-100 dark:border-[#2A2520]/60">
            "{debate.finalRemarks}"
          </div>
        )}
      </div>

      {/* ── Add Point Form ─────────────────────────── */}
      {showAddPoint && (
        <div className="bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-xl border border-brand/20 dark:border-brand/10 p-5 shadow-sm">
          <h3 className="text-[17px] font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Add {currentUserSide === 'government' ? 'Government' : 'Opposition'} Point
          </h3>
          <div className="space-y-3">
            <div className="bg-brand/5 border border-brand/10 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <FiInfo size={14} className="text-brand shrink-0 mt-0.5" />
              <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Type <code className="bg-white dark:bg-[#1C1814] px-1.5 py-0.5 rounded-[4px] font-mono text-brand text-[14px]">@BG 3.4</code> to auto-attach Bhagavad Gita verse, or <code className="bg-white dark:bg-[#1C1814] px-1.5 py-0.5 rounded-[4px] font-mono text-brand text-[14px]">@SB 1.2.3</code> for Srimad Bhagavatam.
              </p>
            </div>
            <input
              type="text"
              value={newPoint.title}
              onChange={(e) => setNewPoint(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Point title (optional)"
              className="w-full border border-gray-200 dark:border-[#3A342E] rounded-xl px-4 py-3 text-[16px] text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1C1814] placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
              maxLength={300}
            />
            <ShlokaAutocomplete
              value={newPoint.content}
              onChange={(value) => setNewPoint(prev => ({ ...prev, content: value }))}
              placeholder="Write your argument with scriptural references..."
              rows={5}
            />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowAddPoint(false)} className="h-8 px-3.5 text-[16px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2520]/60 rounded-[9px] transition-all">Cancel</button>
              <button onClick={handleAddPoint} disabled={addingPoint || !newPoint.content.trim()} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-brand text-white rounded-[9px] text-[16px] font-medium hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]">
                <FiSend size={12} />
                {addingPoint ? 'Submitting...' : 'Submit Point'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Actions ─────────────────────────── */}
      {isAdmin() && (
        <div className="bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-[#2A2520]/60 p-4 shadow-sm">
          <h3 className="text-[15px] font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <FiShield size={14} className="text-purple-500" />
            Admin Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            {debate.status === 'pending' && (
              <>
                <button
                  onClick={async () => {
                    try { await api.put(`/debates/${id}/approve`, { approved: true }); toast.success('Debate approved!'); await fetchDebate(); } catch (err) { toast.error('Failed to approve'); }
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-emerald-600 text-white rounded-[9px] text-[15px] font-medium hover:bg-emerald-700 transition-all active:scale-[0.97]"
                >
                  <FiCheck size={12} /> Approve
                </button>
                <button
                  onClick={async () => {
                    try { const reason = prompt('Reason for rejection (optional):'); await api.put(`/debates/${id}/approve`, { approved: false, reason }); toast.success('Debate rejected'); await fetchDebate(); } catch (err) { toast.error('Failed to reject'); }
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-red-600 text-white rounded-[9px] text-[15px] font-medium hover:bg-red-700 transition-all active:scale-[0.97]"
                >
                  <FiX size={12} /> Reject
                </button>
              </>
            )}
            {['active'].includes(debate.status) && (
              <button onClick={() => setShowJudgeModal(true)} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-purple-600 text-white rounded-[9px] text-[15px] font-medium hover:bg-purple-700 transition-all active:scale-[0.97]">
                <FiShield size={12} /> Assign Judges
              </button>
            )}
            {debate.status === 'judging' && (
              <button onClick={() => setShowWinnerModal(true)} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-amber-600 text-white rounded-[9px] text-[15px] font-medium hover:bg-amber-700 transition-all active:scale-[0.97]">
                <FiAward size={12} /> Declare Winner
              </button>
            )}
            {debate.status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-gray-100 dark:bg-[#2A2520] text-gray-500 dark:text-gray-400 rounded-[9px] text-[15px] font-medium">
                <FiLock size={12} /> Debate Locked
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Judge Actions ─────────────────────────── */}
      {!isAdmin() && isCurrentJudge && (
        <div className="bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-xl border border-purple-200/60 dark:border-purple-500/20 p-4 shadow-sm">
          <h3 className="text-[15px] font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
            <FiShield size={14} />
            Judge Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            {debate.status === 'judging' && (
              <button onClick={() => setShowWinnerModal(true)} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-amber-600 text-white rounded-[9px] text-[15px] font-medium hover:bg-amber-700 transition-all active:scale-[0.97]">
                <FiAward size={12} /> Declare Winner
              </button>
            )}
            {debate.status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-gray-100 dark:bg-[#2A2520] text-gray-500 dark:text-gray-400 rounded-[9px] text-[15px] font-medium">
                <FiLock size={12} /> Verdict Submitted
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Points Columns ────────────────────────── */}
      {debate.status !== 'pending' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20" />
              <h2 className="text-[19px] font-bold text-gray-800 dark:text-gray-200">Government</h2>
              <span className="text-[15px] text-gray-400 dark:text-gray-500">({governmentPoints.length} points)</span>
            </div>
            {governmentPoints.length === 0 ? (
              <div className="bg-white/50 dark:bg-[#1C1814]/50 rounded-xl border border-dashed border-gray-200/60 dark:border-[#2A2520]/60 p-8 text-center text-[16px] text-gray-400 dark:text-gray-500">
                {debate.status === 'open' ? 'Waiting for arguments...' : 'No points from Government'}
              </div>
            ) : (
              <div className="space-y-2">
                {governmentPoints.map(point => (
                  <ThreadedPoint key={point._id} point={point} onReply={handleReply} currentUserSide={currentUserSide} canReply={isParticipant} debateStatus={debate.status} />
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
              <h2 className="text-[19px] font-bold text-gray-800 dark:text-gray-200">Opposition</h2>
              <span className="text-[15px] text-gray-400 dark:text-gray-500">({oppositionPoints.length} points)</span>
            </div>
            {oppositionPoints.length === 0 ? (
              <div className="bg-white/50 dark:bg-[#1C1814]/50 rounded-xl border border-dashed border-gray-200/60 dark:border-[#2A2520]/60 p-8 text-center text-[16px] text-gray-400 dark:text-gray-500">
                {debate.status === 'open' ? 'Waiting for arguments...' : 'No points from Opposition'}
              </div>
            ) : (
              <div className="space-y-2">
                {oppositionPoints.map(point => (
                  <ThreadedPoint key={point._id} point={point} onReply={handleReply} currentUserSide={currentUserSide} canReply={isParticipant} debateStatus={debate.status} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Community Comments ─────────────────────── */}
      <CommunityComments debateId={id} comments={comments} onAddComment={handleAddComment} currentUser={user} />

      {/* ── Assign Judges Modal ──────────────────────────────── */}
      <Modal open={showJudgeModal} onClose={() => { setShowJudgeModal(false); setJudges([]); }} title="Assign Judges" icon={FiShield}>
        <div className="px-6 py-4 space-y-4">
          <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200/60 dark:border-purple-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <FiInfo size={14} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[16px] text-purple-800 dark:text-purple-300 leading-relaxed">
              Search and select impartial Gurus as judges. They must not be participants or the debate creator. The debate will move to <strong>Judging</strong> phase.
            </p>
          </div>
          <GuruAutocomplete value={judges} onChange={setJudges} />
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#2A2520]/60">
            <button onClick={() => { setShowJudgeModal(false); setJudges([]); }} className="h-8 px-3.5 text-[16px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2520]/60 rounded-[9px] transition-all">Cancel</button>
            <button onClick={handleAssignJudges} disabled={assigningJudges || judges.length === 0} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-purple-600 text-white rounded-[9px] text-[16px] font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <FiShield size={12} />
              {assigningJudges ? 'Assigning...' : `Assign ${judges.length} Judge${judges.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Declare Winner Modal ─────────────────────────────── */}
      <Modal open={showWinnerModal} onClose={() => setShowWinnerModal(false)} title="Declare Winner" icon={FiAward}>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-2 block">Winning Side</label>
            <div className="flex gap-3">
              <button
                onClick={() => setWinner('government')}
                className={`flex-1 px-4 py-3 rounded-xl text-[16px] font-medium border-2 transition-all ${
                  winner === 'government'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-[#3A342E] text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500/40'
                }`}
              >
                <span className="block text-[20px] mb-1">🏛️</span>
                Government
              </button>
              <button
                onClick={() => setWinner('opposition')}
                className={`flex-1 px-4 py-3 rounded-xl text-[16px] font-medium border-2 transition-all ${
                  winner === 'opposition'
                    ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-[#3A342E] text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-500/40'
                }`}
              >
                <span className="block text-[20px] mb-1">🗣️</span>
                Opposition
              </button>
            </div>
          </div>
          <div>
            <label className="text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Final Remarks <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={finalRemarks}
              onChange={(e) => setFinalRemarks(e.target.value)}
              placeholder="Share concluding thoughts..."
              rows={3}
              className="w-full border border-gray-200 dark:border-[#3A342E] rounded-xl px-4 py-3 text-[16px] text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1C1814] placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 resize-none transition-all"
              maxLength={3000}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#2A2520]/60">
            <button onClick={() => setShowWinnerModal(false)} className="h-8 px-3.5 text-[16px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2520]/60 rounded-[9px] transition-all">Cancel</button>
            <button onClick={handleDeclareWinner} disabled={declaring || !winner} className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-amber-600 text-white rounded-[9px] text-[16px] font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <FiAward size={12} />
              {declaring ? 'Declaring...' : 'Declare Winner'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DebateDetail;
