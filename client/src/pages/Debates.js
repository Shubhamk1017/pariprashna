import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiChevronRight, FiBookOpen, FiUsers, FiShield, FiFilter, FiMessageCircle } from 'react-icons/fi';

const STATUS_MAP = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200/50', dot: 'bg-amber-500' },
  open: { label: 'Open', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', dot: 'bg-emerald-500' },
  active: { label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-200/50', dot: 'bg-blue-500' },
  judging: { label: 'Judging', color: 'bg-purple-50 text-purple-700 border-purple-200/50', dot: 'bg-purple-500' },
  completed: { label: 'Completed', color: 'bg-gray-50 text-gray-600 border-gray-200/50', dot: 'bg-gray-400' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200/50', dot: 'bg-red-400' }
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200/50', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[14px] font-medium px-2.5 py-1 rounded-full border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
    </span>
  );
};

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-[9px] text-[16px] font-medium transition-all duration-200 ${
      active
        ? 'bg-white dark:bg-[#2A2520] text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/80 dark:border-[#3A342E]/80'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`}
  >
    {label}
  </button>
);

const Debates = () => {
  const { isGuru } = useAuth();
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => { fetchDebates(); }, [statusFilter, sort]);

  const fetchDebates = async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/debates', { params });
      setDebates(res.data.debates);
    } catch (error) { console.error('Error fetching debates:', error); }
    setLoading(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-brand to-brand-500 flex items-center justify-center shadow-sm shadow-brand/10">
              <FiBookOpen className="text-white" size={18} />
            </div>
            <h1 className="font-serif text-[32px] sm:text-[36px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Śāstrārtha
            </h1>
          </div>
          <p className="text-[16px] text-gray-500 dark:text-gray-400 ml-[52px]">
            Structured scriptural debates between Gurus
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isGuru() && (
            <Link
              to="/debates/create"
              className="inline-flex items-center gap-2 h-9 px-4 bg-brand text-white rounded-[9px] text-[16px] font-medium hover:bg-brand-500 transition-all duration-200 shadow-sm shadow-brand/10 hover:shadow-brand/20 active:scale-[0.97]"
            >
              <FiPlus size={14} />
              Propose Debate
            </Link>
          )}
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────── */}
      <div className="bg-white/70 dark:bg-[#1C1814]/60 backdrop-blur-xl border border-gray-200/60 dark:border-[#2A2520]/60 rounded-2xl px-4 py-2.5 mb-6 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mr-1">
          <FiFilter size={14} />
        </div>
        <FilterPill label="All" active={!statusFilter} onClick={() => setStatusFilter('')} />
        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <FilterPill key={key} label={val.label} active={statusFilter === key} onClick={() => setStatusFilter(key)} />
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-[16px] text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-[#2A2520]/60 rounded-[7px] px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand/30 appearance-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* ── Loading ──────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[88px] bg-gray-100/60 dark:bg-[#1C1814]/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : debates.length === 0 ? (
        /* ── Empty State ─────────────────────────── */
        <div className="text-center py-16 px-6">
          <div className="w-20 h-20 mx-auto mb-5 rounded-[20px] bg-gray-50 dark:bg-[#1C1814] border border-gray-200/60 dark:border-[#2A2520]/60 flex items-center justify-center">
            <FiMessageCircle className="text-gray-300 dark:text-gray-500" size={32} />
          </div>
          <h2 className="text-[22px] font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No debates yet
          </h2>
          <p className="text-[16px] text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Śāstrārtha is a formal, point-by-point scriptural debate between qualified Gurus.
          </p>
          {isGuru() ? (
            <Link
              to="/debates/create"
              className="inline-flex items-center gap-2 h-9 px-4 bg-brand text-white rounded-[9px] text-[16px] font-medium hover:bg-brand-500 transition-all duration-200 shadow-sm shadow-brand/10 active:scale-[0.97]"
            >
              <FiPlus size={14} />
              Propose the First Debate
            </Link>
          ) : (
            <p className="text-[16px] text-gray-400 dark:text-gray-500">Only Gurus can propose debates</p>
          )}
        </div>
      ) : (
        /* ── Debate Cards ───────────────────────── */
        <div className="space-y-3">
          {debates.map(debate => (
            <Link
              key={debate._id}
              to={`/debates/${debate._id}`}
              className="group block bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#2A2520]/60 hover:border-brand/30 dark:hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition-all duration-300 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand transition-colors duration-200 truncate">
                      {debate.title}
                    </h2>
                    <StatusBadge status={debate.status} />
                  </div>
                  <p className="text-[16px] text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                    "{debate.motion}"
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[15px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <FiBookOpen size={11} />
                      {debate.createdBy?.name || 'Unknown'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="flex items-center gap-1.5">
                      <FiUsers size={11} />
                      Gov: {debate.governmentParticipants?.length || 0}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="flex items-center gap-1.5">
                      <FiUsers size={11} />
                      Opp: {debate.oppositionParticipants?.length || 0}
                    </span>
                    {debate.judges?.length > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="flex items-center gap-1.5">
                          <FiShield size={11} />
                          {debate.judges.length}
                        </span>
                      </>
                    )}
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{new Date(debate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-[#2A2520]/60 group-hover:bg-brand-50 dark:group-hover:bg-brand/10 transition-all duration-200 shrink-0 mt-0.5">
                  <FiChevronRight size={15} className="text-gray-300 dark:text-gray-500 group-hover:text-brand transition-colors duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Info Card ────────────────────────────── */}
      <div className="mt-10 bg-gradient-to-br from-brand/5 via-transparent to-brand/5 rounded-2xl border border-brand/10 dark:border-brand/5 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-brand/10 flex items-center justify-center shrink-0">
            <span className="text-[20px]">🏛️</span>
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-gray-800 dark:text-gray-200 mb-1">
              What is Śāstrārtha?
            </h3>
            <p className="text-[16px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
              A formal, structured point-by-point scriptural debate between qualified Gurus.
              Unlike public forums, debates follow a strict format with Government and Opposition sides,
              recursive counterpoints, and judging by impartial Gurus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debates;
