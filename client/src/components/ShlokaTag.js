import React, { useState, useRef, useEffect } from 'react';

const ShlokaTag = ({ shloka }) => {
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const audioUrl = shloka?.audioUrl;

  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; } }; }, [audioUrl]);

  if (!shloka) return null;

  const toggle = () => setExpanded(prev => !prev);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!shloka.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(shloka.audioUrl);
      audioRef.current.onended = () => { setPlaying(false); setLoading(false); };
      audioRef.current.onpause = () => setPlaying(false);
      audioRef.current.onplay = () => setPlaying(true);
      audioRef.current.onwaiting = () => setLoading(true);
      audioRef.current.oncanplay = () => setLoading(false);
      audioRef.current.onerror = () => { setPlaying(false); setLoading(false); };
    }
    if (audioRef.current.paused) { audioRef.current.play().catch(() => { setPlaying(false); setLoading(false); }); }
    else { audioRef.current.pause(); }
  };

  return (
    <span className="inline-flex flex-col align-middle mx-0.5">
      <span className="inline-flex items-center">
        {shloka.audioUrl && (<button onClick={togglePlay} disabled={loading} className="inline-flex items-center justify-center w-7 h-7 bg-orange-700 hover:bg-orange-800 active:bg-orange-900 text-white rounded-l-lg transition-all duration-150 cursor-pointer shadow-sm flex-shrink-0" title={playing ? 'Pause recitation' : 'Play Sanskrit recitation'}>
          {loading ? (<svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>) : playing ? (<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>) : (<svg className="h-3.5 w-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>)}
        </button>)}
        <button onClick={toggle} className={`inline-flex items-center px-3 py-1 text-white text-xs font-medium transition-all duration-150 cursor-pointer select-none shadow-sm ${shloka.audioUrl ? 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-r-lg' : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-lg'}`} title={expanded ? 'Click to collapse' : 'Click to expand'}>{shloka.label}</button>
      </span>
      {expanded && (
        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm text-left">
          {shloka.sanskrit && <div className="mb-2"><div className="text-[10px] text-orange-700 mb-0.5 uppercase tracking-wider font-semibold">Sanskrit</div><div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'serif' }}>{shloka.sanskrit}</div></div>}
          {shloka.iast && <div className="mb-2"><div className="text-[10px] text-orange-700 mb-0.5 uppercase tracking-wider font-semibold">Transliteration</div><div className="text-xs italic text-gray-700 leading-relaxed whitespace-pre-wrap">{shloka.iast}</div></div>}
          {shloka.translation && <div className="mb-1"><div className="text-[10px] text-orange-700 mb-0.5 uppercase tracking-wider font-semibold">Translation</div><div className="text-xs text-gray-800 leading-relaxed">{shloka.translation}</div></div>}
          {shloka.purport && <details className="mt-1.5"><summary className="text-[11px] text-orange-700 cursor-pointer hover:text-orange-900 font-semibold select-none">View purport</summary><div className="text-xs text-gray-700 leading-relaxed mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">{shloka.purport}</div></details>}
        </div>
      )}
    </span>
  );
};

export default ShlokaTag;
