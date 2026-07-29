import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBookOpen, FiClock, FiExternalLink, FiX, FiPlay, FiPause, FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';

const BOOKS_META = [
  { id: 'bg', name: 'Bhagavad Gita', tag: 'bhagavad-gita', aliases: ['BG', 'GITA', 'BHAGAVADGITA'], expectedVerses: 700, refFormat: '@BG chapter.verse', refExample: '@BG 2.47', description: 'The timeless dialogue between Lord Krishna and Arjuna on the battlefield of Kurukshetra, covering dharma, yoga, and the path to liberation.' },
  { id: 'sb', name: 'Śrīmad Bhāgavatam', tag: 'srimad-bhagavatam', aliases: ['SB', 'BHAGAVATAM', 'BHAGAVATAPURANA'], expectedVerses: 18000, refFormat: '@SB canto.chapter.verse', refExample: '@SB 1.2.6', description: 'The crown jewel of Vedic literature, comprising 12 cantos that describe the pastimes of Lord Krishna and the path of devotion.' },
  { id: 'cc', name: 'Caitanya-caritāmṛta', tag: 'caitanya-caritamrta', aliases: ['CC', 'CAITANYA', 'CARITAMRTA'], expectedVerses: 11555, refFormat: '@CC part chapter.verse', refExample: '@CC adi 1.1', description: 'The biography of Śrī Caitanya Mahāprabhu, written by Śrīla Kṛṣṇadāsa Kavirāja Gosvāmī.' },
  { id: 'iso', name: 'Śrī Īśopaniṣad', tag: 'isopanishad', aliases: ['ISO', 'ISOPANISHAD'], expectedVerses: 18, refFormat: '@ISO mantra', refExample: '@ISO 1', description: 'One of the principal Upaniṣads, presenting the philosophy of the Supreme Personal Godhead in concise mantras.' },
  { id: 'noi', name: 'Nectar of Instruction', tag: 'nectar-of-instruction', aliases: ['NOI', 'NECTAR'], expectedVerses: 11, refFormat: '@NOI verse', refExample: '@NOI 1', description: 'Śrīla Rūpa Gosvāmīs Upadeśāmṛta, eleven essential instructions for advancing in Kṛṣṇa consciousness.' },
  { id: 'nod', name: 'The Nectar of Devotion', tag: 'nectar-of-devotion', aliases: ['NOD', 'NECTAROFDEVOTION'], expectedVerses: 51, refFormat: '@NOD chapter', refExample: '@NOD 1', description: 'A summary study of Śrīla Rūpa Gosvāmīśrī Bhakti-rasāmṛta-sindhu — the complete science of bhakti-yoga.' },
  { id: 'mr', name: 'Mundaka Upanishad', aliases: ['MU', 'MUNDAKA'], expectedVerses: 64, refFormat: '@MU chapter.verse', refExample: '@MU 1.1', description: 'A major Upaniṣad distinguishing higher and lower knowledge.', future: true },
  { id: 'kv', name: 'Katha Upanishad', aliases: ['KU', 'KATHA'], expectedVerses: 119, refFormat: '@KU chapter.verse', refExample: '@KU 1.1', description: 'The story of Nachiketa and Yama, exploring the nature of the soul.', future: true },
  { id: 'rv', name: 'Rig Veda', aliases: ['RV', 'RIGVEDA'], expectedVerses: 10600, refFormat: '@RV mandala.sukta.verse', refExample: '@RV 1.1.1', description: 'The oldest of the four Vedas.', future: true },
];

function normalizeShlokaRef(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^@[A-Za-z]/.test(trimmed)) return trimmed;
  const ccRef = trimmed.match(/^([A-Za-z]{1,20})[\s.]+(adi|madhya|antya)[\s.]+(\d+)(?:[\s.]+(\d+))?$/i);
  if (ccRef) { let ref = '@' + ccRef[1].toUpperCase() + ' ' + ccRef[2].toLowerCase() + ' ' + ccRef[3]; if (ccRef[4]) ref += '.' + ccRef[4]; return ref; }
  const single = trimmed.match(/^([A-Za-z]{1,20})[\s.]+(\d+)$/);
  if (single) return '@' + single[1].toUpperCase() + ' ' + single[2];
  const multi = trimmed.match(/^([A-Za-z]{1,20})[\s.]+(\d+)[\s.]+(\d+)(?:[\s.]+(\d+))?$/);
  if (multi) { let ref = '@' + multi[1].toUpperCase() + ' ' + multi[2] + '.' + multi[3]; if (multi[4]) ref += '.' + multi[4]; return ref; }
  return null;
}

const ShlokaPreview = ({ shloka, onClose }) => {
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);
  if (!shloka) return null;
  const togglePlay = () => {
    if (!shloka.audioUrl) return;
    if (!audioRef.current) { audioRef.current = new Audio(shloka.audioUrl); audioRef.current.onended = () => { setPlaying(false); setAudioLoading(false); }; audioRef.current.onpause = () => setPlaying(false); audioRef.current.onplay = () => setPlaying(true); audioRef.current.onwaiting = () => setAudioLoading(true); audioRef.current.oncanplay = () => setAudioLoading(false); audioRef.current.onerror = () => { setPlaying(false); setAudioLoading(false); }; }
    if (audioRef.current.paused) { audioRef.current.play().catch(() => { setPlaying(false); setAudioLoading(false); }); } else { audioRef.current.pause(); }
  };
  return (<div className="bg-white rounded-xl border-2 border-orange-300 shadow-lg mb-8"><div className="bg-orange-600 text-white px-5 py-3 flex items-center justify-between"><div className="flex items-center gap-2">{shloka.audioUrl && (<button onClick={togglePlay} disabled={audioLoading} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 text-white transition-all" title={playing ? 'Pause' : 'Play'}>{audioLoading ? (<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>) : playing ? <FiPause size={16} /> : <FiPlay size={16} className="ml-0.5" />}</button>)}<FiBookOpen className="text-orange-200" /><span className="font-semibold">{shloka.label}</span></div><div className="flex items-center gap-3">{shloka.url && <a href={shloka.url} target="_blank" rel="noopener noreferrer" className="text-orange-200 hover:text-white text-sm flex items-center gap-1">Vedabase <FiExternalLink size={14} /></a>}<button onClick={onClose} className="text-orange-200 hover:text-white"><FiX size={18} /></button></div></div><div className="p-5 space-y-4">{shloka.sanskrit && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sanskrit</h4><p className="text-lg text-gray-800 font-serif leading-relaxed">{shloka.sanskrit}</p></div>}{shloka.iast && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Transliteration</h4><p className="text-base text-gray-700 italic">{shloka.iast}</p></div>}{shloka.translation && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Translation</h4><p className="text-base text-gray-700 leading-relaxed">{shloka.translation}</p></div>}{shloka.purport && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Purport</h4><p className="text-sm text-gray-600 leading-relaxed">{shloka.purport}</p></div>}</div></div>);
};

const BOOK_STATS_LABELS = { bg: { n: 'Bhagavad Gita', v: 700 }, sb: { n: 'Śrīmad Bhāgavatam', v: 18000 }, cc: { n: 'Caitanya-caritāmṛta', v: 11555 }, iso: { n: 'Śrī Īśopaniṣad', v: 18 }, noi: { n: 'Nectar of Instruction', v: 11 }, nod: { n: 'Nectar of Devotion', v: 51 }, mr: { n: 'Mundaka Upaniṣad', v: 64 }, kv: { n: 'Katha Upaniṣad', v: 119 }, rv: { n: 'Rig Veda', v: 10600 } };

const Scriptures = () => {
  const [search, setSearch] = useState('');
  const [shlokaResult, setShlokaResult] = useState(null);
  const [shlokaLoading, setShlokaLoading] = useState(false);
  const [shlokaError, setShlokaError] = useState('');
  const [stats, setStats] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/shlokas/stats');
        const data = res.data;
        if (!cancelled) { setStats(data.stats || {}); }
      } catch (err) { if (!cancelled) { setStats({}); } }
    })();
    return () => { cancelled = true; };
  }, []);

  const booksPresent = Object.keys(stats).length;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setShlokaResult(null); setShlokaError('');
    const ref = normalizeShlokaRef(search);
    if (!ref) { setShlokaLoading(false); return; }
    setShlokaLoading(true);
    debounceRef.current = setTimeout(async () => {
      try { const res = await api.get(`/shlokas/parse?ref=${encodeURIComponent(ref)}`); const data = res.data; if (data.matches && data.matches.length > 0) setShlokaResult(data.matches[0]); else setShlokaError('Verse not found'); } catch (err) { setShlokaError('Could not look up verse'); } setShlokaLoading(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const isShlokaSearch = normalizeShlokaRef(search) !== null;
  const filtered = BOOKS_META.filter((book) => { if (!search.trim() || isShlokaSearch) return true; const q = search.toLowerCase(); return book.name.toLowerCase().includes(q) || book.aliases.some((a) => a.toLowerCase().includes(q)) || book.description.toLowerCase().includes(q); });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10"><h1 className="text-4xl font-bold text-gray-800 mb-3">📜 Scriptures</h1><p className="text-gray-600 text-lg max-w-2xl mx-auto">Browse the Vedic scriptures and look up verses instantly. Type a verse reference like <code className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-sm font-mono">BG 3.4</code> to see the shloka.</p></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2 text-gray-700"><FiBookOpen className="text-orange-500" /><span className="font-semibold">{booksPresent || BOOKS_META.length}</span><span className="text-gray-500">Scriptures Loaded</span></div>
      </div>
      <div className="relative mb-6"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search or look up a verse — e.g. "BG 3.4", "Bhagavad Gita"...' className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-lg" />{search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>}</div>
      {isShlokaSearch && (<div className="mb-6">{shlokaLoading && <div className="animate-pulse bg-orange-50 border border-orange-200 rounded-xl p-5 text-center text-gray-500"><div className="h-4 w-48 bg-orange-200 rounded mx-auto mb-2"></div><p className="text-sm">Looking up verse...</p></div>}{shlokaError && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center text-yellow-700 text-sm">{shlokaError}</div>}{shlokaResult && <ShlokaPreview shloka={shlokaResult} onClose={() => { setSearch(''); setShlokaResult(null); }} />}</div>)}
      <div className="grid gap-6 md:grid-cols-2">{filtered.map((book) => {
        const isLoaded = stats[book.id] > 0;
        const isFuture = book.future === true;
        return (
          <div key={book.id} className={`rounded-xl border shadow-sm transition-all duration-200 ${isLoaded ? 'bg-white border-green-300 border-solid hover:shadow-md hover:border-green-400' : 'bg-gray-50 border-dashed border-gray-300'}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{book.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">{book.aliases.map((a) => (
                    <span key={a} className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${isLoaded ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{a}</span>
                  ))}</div>
                </div>
                {isLoaded ? null : isFuture ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-200 text-gray-500"><FiClock /> Coming Soon</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700"><FiClock /> Not loaded</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{book.description}</p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-500 mb-1 font-medium">Usage</div>
                <code className="text-sm text-orange-700 font-mono bg-orange-50 px-2 py-1 rounded">{book.refFormat}</code>
                <span className="text-gray-400 text-sm mx-2">→</span>
                <code className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">{book.refExample}</code>
              </div>
              {isLoaded && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <FiCheckCircle size={12} />
                  <span>Ready to search — use the search bar above</span>
                </div>
              )}
            </div>
          </div>
        );
      })}</div>
    </div>
  );
};

export default Scriptures;
