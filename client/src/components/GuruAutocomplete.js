import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiShield } from 'react-icons/fi';
import api from '../utils/api';

const GuruAutocomplete = ({ value = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allGurus, setAllGurus] = useState([]);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchGurus = async () => {
      try { const res = await api.get('/guru/list'); setAllGurus(res.data); }
      catch (err) { console.error('Failed to fetch gurus:', err); }
    };
    fetchGurus();
  }, []);

  const filterGurus = useCallback((query) => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const q = query.toLowerCase().trim();
    const filtered = allGurus.filter(guru => { const name = (guru.name || '').toLowerCase(); const email = (guru.email || '').toLowerCase(); return name.includes(q) || email.includes(q); });
    setResults(filtered.slice(0, 10));
    setSelectedIndex(0);
    setOpen(filtered.length > 0);
  }, [allGurus]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => filterGurus(val), 200);
  };

  const handleFocus = () => { if (inputValue.trim() && results.length > 0) setOpen(true); };

  const selectGuru = (guru) => {
    if (value.some(v => v._id === guru._id)) return;
    onChange([...value, { _id: guru._id, name: guru.name, avatar: guru.avatar, email: guru.email }]);
    setInputValue('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeGuru = (guruId) => onChange(value.filter(v => v._id !== guruId));

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(s => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); selectGuru(results[selectedIndex]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Backspace' && !inputValue && value.length > 0) removeGuru(value[value.length - 1]._id);
  };

  useEffect(() => {
    const handleClickOutside = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((guru) => (
            <span key={guru._id} className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1.5 rounded-full">
              {guru.avatar ? <img src={guru.avatar} alt="" className="w-4 h-4 rounded-full" /> : <div className="w-4 h-4 bg-purple-300 rounded-full flex items-center justify-center text-[9px] font-bold text-purple-700">{(guru.name || '?').charAt(0).toUpperCase()}</div>}
              <FiShield size={10} className="text-purple-600" />
              <span>{guru.name}</span>
              <button type="button" onClick={() => removeGuru(guru._id)} className="text-purple-400 hover:text-purple-700 ml-0.5"><FiX size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input ref={inputRef} type="text" value={inputValue} onChange={handleInputChange} onFocus={handleFocus} onKeyDown={handleKeyDown} placeholder={value.length === 0 ? "Search gurus by name (e.g. 'prab')..." : "Add another guru..."} className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {results.map((guru, i) => {
            const isSelected = value.some(v => v._id === guru._id);
            return (<button key={guru._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => !isSelected && selectGuru(guru)} disabled={isSelected} className={`w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors ${i === selectedIndex ? 'bg-purple-50' : isSelected ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
              {guru.avatar ? <img src={guru.avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">{(guru.name || '?').charAt(0).toUpperCase()}</div>}
              <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-800 truncate flex items-center gap-1.5"><FiShield size={11} className="text-purple-600 flex-shrink-0" />{guru.name}</div><div className="text-xs text-gray-500 truncate">{guru.email}</div></div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${guru.role === 'acharya' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>{guru.role === 'acharya' ? 'Āchārya' : 'Guru'}</span>
              {isSelected && <FiX size={14} className="text-green-500 flex-shrink-0" />}
            </button>);
          })}
        </div>
      )}
      {open && inputValue.trim() && results.length === 0 && (<div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center"><p className="text-sm text-gray-500">No gurus found matching "{inputValue}"</p></div>)}
      <p className="text-[11px] text-gray-400 mt-1.5">Search by name or email · {value.length} guru{value.length !== 1 ? 's' : ''} selected</p>
    </div>
  );
};

export default GuruAutocomplete;
