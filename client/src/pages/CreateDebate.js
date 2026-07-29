import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiChevronLeft, FiSend, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateDebate = () => {
  const { isGuru } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', motion: '', description: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { if (!isGuru()) navigate('/debates'); }, [isGuru, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.motion.trim()) errs.motion = 'Motion is required';
    if (form.title.length > 200) errs.title = 'Title must be under 200 characters';
    if (form.motion.length > 500) errs.motion = 'Motion must be under 500 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/debates', form);
      toast.success('Debate proposal submitted for admin approval!');
      navigate(`/debates/${res.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create debate');
    }
    setSubmitting(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const inputClass = (field) =>
    `w-full border ${errors[field] ? 'border-red-300 dark:border-red-400/50' : 'border-gray-200 dark:border-[#3A342E]'} rounded-xl px-4 py-3 text-[17px] text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1C1814] placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all`;

  return (
    <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ── Back Link ──────────────────────────── */}
      <Link
        to="/debates"
        className="inline-flex items-center gap-1.5 text-[16px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 group"
      >
        <FiChevronLeft size={13} />
        <span>Back to Debates</span>
      </Link>

      <div className="bg-white/90 dark:bg-[#1C1814]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#2A2520]/60 overflow-hidden shadow-sm">
        {/* ── Header ────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#2A2520]/60">
          <h1 className="text-[24px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Propose a Śāstrārtha Debate
          </h1>
          <p className="text-[16px] text-gray-500 dark:text-gray-400 mt-1">
            Create a formal debate motion for Guru discussion
          </p>
        </div>

        {/* ── Info Banner ────────────────────────── */}
        <div className="mx-6 mt-4 bg-brand/5 border border-brand/10 rounded-xl px-4 py-3 flex items-start gap-3">
          <FiInfo size={15} className="text-brand shrink-0 mt-0.5" />
          <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-relaxed">
            Your proposal will be reviewed by an admin. Once approved, other Gurus can join as Government or Opposition.
          </p>
        </div>

        {/* ── Form ───────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Debate Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., The Role of Idol Worship in Moksha"
              className={inputClass('title')}
              maxLength={200}
            />
            <div className="flex justify-between mt-1.5">
              {errors.title && <p className="text-red-500 text-[16px]">{errors.title}</p>}
              <p className="text-gray-400 dark:text-gray-500 text-[15px] ml-auto">{form.title.length}/200</p>
            </div>
          </div>

          {/* Motion */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Motion <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.motion}
              onChange={(e) => handleChange('motion', e.target.value)}
              placeholder="e.g., Is idol worship essential for attaining moksha?"
              rows={2}
              className={inputClass('motion')}
              maxLength={500}
            />
            <div className="flex justify-between mt-1.5">
              {errors.motion && <p className="text-red-500 text-[16px]">{errors.motion}</p>}
              <p className="text-gray-400 dark:text-gray-500 text-[15px] ml-auto">{form.motion.length}/500</p>
            </div>
            <p className="text-[16px] text-gray-400 dark:text-gray-500 mt-1">
              A single, clear sentence defining the exact statement being debated.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Provide context, background, and scope..."
              rows={4}
              className={inputClass('description')}
              maxLength={2000}
            />
            <p className="text-gray-400 dark:text-gray-500 text-[15px] mt-1.5 text-right">{form.description.length}/2000</p>
          </div>

          {/* Private Notes */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Private Notes <span className="text-gray-400 font-normal">(for admin review)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes for the admin..."
              rows={2}
              className={inputClass('notes')}
              maxLength={2000}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2A2520]/60">
            <Link
              to="/debates"
              className="h-9 px-4 text-[16px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2520]/60 rounded-[9px] inline-flex items-center transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 h-9 px-4 bg-brand text-white rounded-[9px] text-[16px] font-medium hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-brand/10 active:scale-[0.97]"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <><FiSend size={14} /> Submit for Approval</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDebate;
