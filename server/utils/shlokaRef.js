const mongoose = require('mongoose');

let vedabaseDb;

const AUDIO_BASE_URL = 'https://cdn.jsdelivr.net/gh/nikhilsi/gitavani@main/android/GitaVani/app/src/main/assets/audio';

function getAudioUrl(book, chapter, verse) {
  if (!book || chapter == null || verse == null) return null;
  if (book === 'bg') return `${AUDIO_BASE_URL}/BG${chapter}.${verse}.mp3`;
  return null;
}

async function getVedabaseDB() {
  if (!vedabaseDb) {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      throw new Error('Mongoose not connected');
    }
    vedabaseDb = mongoose.connection.getClient().db('vedabase');
  }
  return vedabaseDb;
}

const BOOK_ALIASES = {
  BG: { book: 'bg', parts: 2, name: 'Bhagavad Gita' },
  BHAGAVADGITA: { book: 'bg', parts: 2, name: 'Bhagavad Gita' },
  GITA: { book: 'bg', parts: 2, name: 'Bhagavad Gita' },
  SB: { book: 'sb', parts: 3, name: 'Srimad Bhagavatam' },
  BHAGAVATAM: { book: 'sb', parts: 3, name: 'Srimad Bhagavatam' },
  BHAGAVATAPURANA: { book: 'sb', parts: 3, name: 'Srimad Bhagavatam' },
  CC: { book: 'cc', parts: 2, name: 'Caitanya-caritamrta' },
  CAITANYA: { book: 'cc', parts: 2, name: 'Caitanya-caritamrta' },
  CARITAMRTA: { book: 'cc', parts: 2, name: 'Caitanya-caritamrta' },
  ISO: { book: 'iso', parts: 1, name: 'Sri Isopanishad' },
  ISOPANISHAD: { book: 'iso', parts: 1, name: 'Sri Isopanishad' },
  NOI: { book: 'noi', parts: 1, name: 'Nectar of Instruction' },
  NECTAR: { book: 'noi', parts: 1, name: 'Nectar of Instruction' },
  NOD: { book: 'nod', parts: 1, name: 'Nectar of Devotion' },
  NECTAROFDEVOTION: { book: 'nod', parts: 1, name: 'Nectar of Devotion' },
};

function parseShlokaReference(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/^@/, '').trim();
  if (!cleaned) return null;
  const ccWord = cleaned.match(/^([A-Za-z]+)\s+(adi|madhya|antya)(?:\s+(\d+)(?:\.(\d+))?)?$/i);
  if (ccWord) {
    const [, alias, part] = ccWord;
    const key = alias.toUpperCase();
    const meta = BOOK_ALIASES[key];
    if (!meta || meta.book !== 'cc') return null;
    const result = { raw, alias, book: 'cc', part: part.toLowerCase() };
    if (ccWord[3] != null) result.chapter = parseInt(ccWord[3], 10);
    if (ccWord[4] != null) result.verse = parseInt(ccWord[4], 10);
    return result;
  }
  const three = cleaned.match(/^([A-Za-z]+)[\s\.]+(\d+)[\.\s]+(\d+)[\.\s]+(\d+)$/);
  if (three) {
    const [, alias, a, b, c] = three;
    const key = alias.toUpperCase();
    const meta = BOOK_ALIASES[key];
    if (!meta) return null;
    if (meta.book === 'sb') return { raw, alias, book: meta.book, canto: parseInt(a, 10), chapter: parseInt(b, 10), verse: parseInt(c, 10) };
    if (meta.book === 'cc') { const partMap = { 1: 'adi', 2: 'madhya', 3: 'antya' }; return { raw, alias, book: 'cc', part: partMap[parseInt(a, 10)] || 'adi', chapter: parseInt(b, 10), verse: parseInt(c, 10) }; }
    return { raw, alias, book: meta.book, chapter: parseInt(a, 10), verse: parseInt(b, 10) };
  }
  const two = cleaned.match(/^([A-Za-z]+)[\s\.]+(\d+)[\.\s]+(\d+)$/);
  if (two) {
    const [, alias, a, b] = two;
    const key = alias.toUpperCase();
    const meta = BOOK_ALIASES[key];
    if (!meta) return null;
    if (meta.book === 'sb') return { raw, alias, book: meta.book, canto: parseInt(a, 10), chapter: parseInt(b, 10) };
    if (meta.book === 'cc') { const partMap = { 1: 'adi', 2: 'madhya', 3: 'antya' }; return { raw, alias, book: 'cc', part: partMap[parseInt(a, 10)] || 'adi', chapter: parseInt(b, 10) }; }
    return { raw, alias, book: meta.book, chapter: parseInt(a, 10), verse: parseInt(b, 10) };
  }
  const one = cleaned.match(/^([A-Za-z]+)[\s\.]+(\d+)$/);
  if (one) {
    const [, alias, a] = one;
    const key = alias.toUpperCase();
    const meta = BOOK_ALIASES[key];
    if (!meta || meta.parts > 1) return null;
    const num = parseInt(a, 10);
    if (meta.book === 'noi') return { raw, alias, book: meta.book, verse: num };
    if (meta.book === 'iso') return { raw, alias, book: meta.book, chapter: num, mantra: num };
    return { raw, alias, book: meta.book, chapter: num };
  }
  return null;
}

function extractShlokaReferences(text) {
  if (!text || typeof text !== 'string') return [];
  const refs = [];
  const re = /@([A-Za-z]{1,20})[\s.]+([A-Za-z0-9]+)(?:[\s.]+(\d+)(?:[\s.]+(\d+))?)?/g;
  let m;
  while ((m = re.exec(text)) !== null) { const ref = parseShlokaReference(m[0]); if (ref) refs.push(ref); }
  return refs;
}

function verseLabel(v) {
  if (v.book === 'bg') return `Bhagavad Gita ${v.chapter}.${v.verse}`;
  if (v.book === 'sb') return `Srimad Bhagavatam ${v.canto}.${v.chapter}.${v.verse}`;
  if (v.book === 'cc') return `Caitanya-caritamrta ${v.part ? v.part.charAt(0).toUpperCase() + v.part.slice(1) : ''} ${v.chapter}.${v.verse}`.trim();
  if (v.book === 'iso') return `Sri Isopanishad Mantra ${v.mantra || v.verse}`;
  if (v.book === 'noi') return `Nectar of Instruction ${v.verse}`;
  if (v.book === 'nod') return `Nectar of Devotion Chapter ${v.chapter}`;
  return v.pageTitle || v.url || 'Verse';
}

async function lookupShloka(ref) {
  if (!ref || !ref.book) return null;
  try {
    const db = await getVedabaseDB();
    const collection = db.collection('verses');
    let query = { book: ref.book };
    const verseStr = ref.verse != null ? String(ref.verse) : null;
    const verseNum = ref.verse != null ? Number(ref.verse) : null;
    if (ref.book === 'sb') {
      query.canto = ref.canto; query.chapter = ref.chapter;
      if (verseStr != null && !Number.isNaN(verseNum)) query.$or = [{ verse: verseStr }, { verse: verseNum }];
    } else if (ref.book === 'cc') {
      if (ref.part) query.part = ref.part; query.chapter = ref.chapter;
      if (verseStr != null && !Number.isNaN(verseNum)) query.$or = [{ verse: verseStr }, { verse: verseNum }];
    } else if (ref.book === 'iso') { query.$or = [{ verse: ref.chapter }, { mantra: ref.chapter }, { mantra: Number(ref.chapter) }]; }
    else {
      if (ref.chapter != null) query.chapter = ref.chapter;
      if (verseStr != null && !Number.isNaN(verseNum)) query.$or = [{ verse: verseStr }, { verse: verseNum }];
    }
    const verse = await collection.findOne(query);
    if (!verse) return null;
    return { raw: ref.raw, book: verse.book, chapter: verse.chapter, verse: verse.verse, canto: verse.canto, part: verse.part, mantra: verse.mantra, sanskrit: verse.sanskrit || '', iast: verse.iast || '', translation: verse.translation || '', purport: verse.purport || '', url: verse.url || '', label: verseLabel(verse), audioUrl: getAudioUrl(verse.book, verse.chapter, verse.verse) };
  } catch (err) { console.error('Shloka lookup error:', err.message); return null; }
}

async function resolveShlokaReferences(text) {
  const refs = extractShlokaReferences(text);
  if (refs.length === 0) return [];
  const seen = new Set();
  const unique = [];
  for (const r of refs) { const k = `${r.book}-${r.canto || ''}-${r.chapter || ''}-${r.verse || ''}-${r.mantra || ''}`; if (seen.has(k)) continue; seen.add(k); unique.push(r); }
  const results = [];
  for (const r of unique) { const v = await lookupShloka(r); if (v) results.push(v); }
  return results;
}

function buildShlokaRegex() {
  const aliases = Object.keys(BOOK_ALIASES).join('|');
  return new RegExp(`@(${aliases})[\\s.]+(\\d+)(?:[\\s.]+(\\d+)(?:[\\s.]+(\\d+))?)?`, 'gi');
}

module.exports = { BOOK_ALIASES, parseShlokaReference, extractShlokaReferences, lookupShloka, resolveShlokaReferences, verseLabel, buildShlokaRegex, getAudioUrl };
