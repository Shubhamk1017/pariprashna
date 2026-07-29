import React, { useState, useRef, useEffect } from 'react';

const ShlokaCard = ({ shloka }) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const audioUrl = shloka?.audioUrl;

  if (!shloka) return null;

  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; } }; }, [audioUrl]);

  const togglePlay = () => {
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
    <div className="my-4 border-l-4 border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-r-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {shloka.audioUrl && (<button onClick={togglePlay} disabled={loading} className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer shadow-sm ${playing ? 'bg-orange-700 hover:bg-orange-800 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`} title={playing ? 'Pause recitation' : 'Play Sanskrit recitation'}>
            {loading ? (<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>) : playing ? (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>) : (<svg className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>)}
          </button>)}
          <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">📖 {shloka.label || shloka.raw}</div>
        </div>
        {shloka.url && <a href={shloka.url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:text-orange-800 underline flex-shrink-0 ml-2">vedabase.io ↗</a>}
      </div>
      {shloka.sanskrit && <div className="mb-2"><div className="text-xs text-gray-500 mb-1">Sanskrit</div><div className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'serif' }}>{shloka.sanskrit}</div></div>}
      {shloka.iast && <div className="mb-2"><div className="text-xs text-gray-500 mb-1">Transliteration</div><div className="text-sm italic text-gray-700 leading-relaxed whitespace-pre-wrap">{shloka.iast}</div></div>}
      {shloka.translation && <div className="mb-2"><div className="text-xs text-gray-500 mb-1">Translation</div><div className="text-sm text-gray-800 leading-relaxed">{shloka.translation}</div></div>}
      {shloka.purport && <details className="mt-2"><summary className="text-xs text-orange-700 cursor-pointer hover:text-orange-900 font-semibold">View purport</summary><div className="text-xs text-gray-700 leading-relaxed mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap">{shloka.purport}</div></details>}
    </div>
  );
};

export default ShlokaCard;
