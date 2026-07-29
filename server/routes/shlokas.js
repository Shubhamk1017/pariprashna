const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { BOOK_ALIASES, getAudioUrl } = require('../utils/shlokaRef');
const hardcodedShlokas = require('../utils/shlokas');

let db;
let mongoClient;

async function getDB() {
  if (!db) {
    if (!process.env.VEDABASE_MONGO_URI) {
      throw new Error('VEDABASE_MONGO_URI environment variable is not defined');
    }
    const { MongoClient } = require('mongodb');
    mongoClient = new MongoClient(process.env.VEDABASE_MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db('vedabase');
  }
  return db;
}

function normalizeBookKey(raw) {
  return (raw || '').toUpperCase().replace(/[^A-Z]/g, '');
}

function parsePartialRef(text) {
  if (!text) return null;
  const ccWordMatch = text.match(/^([A-Za-z]+)[\s]+(adi|madhya|antya)(?:[\s]+(\d+)(?:\.(\d+))?)?$/i);
  if (ccWordMatch) {
    const bookKey = normalizeBookKey(ccWordMatch[1]);
    const meta = BOOK_ALIASES[bookKey];
    if (!meta || meta.book !== 'cc') return null;
    const out = { book: 'cc', raw: text, alias: ccWordMatch[1].toUpperCase(), part: ccWordMatch[2].toLowerCase() };
    if (ccWordMatch[3] != null) out.chapter = parseInt(ccWordMatch[3], 10);
    if (ccWordMatch[4] != null) out.verse = ccWordMatch[4];
    return out;
  }
  const m = text.match(/^([A-Za-z]+)[\s]+([^\s]+)$/);
  if (!m) return null;
  const bookKey = normalizeBookKey(m[1]);
  const meta = BOOK_ALIASES[bookKey];
  if (!meta) return null;
  const rest = m[2].trim();
  const parts = rest.split('.').map(p => p.trim()).filter(Boolean);
  const out = { book: meta.book, raw: text, alias: m[1].toUpperCase() };
  if (meta.book === 'sb') {
    if (parts.length >= 1) out.canto = parseInt(parts[0], 10);
    if (parts.length >= 2) out.chapter = parseInt(parts[1], 10);
    if (parts.length >= 3) out.verse = parts[2];
  } else if (meta.book === 'cc') {
    if (parts.length >= 1) { const partMap = { '1': 'adi', '2': 'madhya', '3': 'antya' }; out.part = partMap[parts[0].toLowerCase()] || parts[0].toLowerCase(); }
    if (parts.length >= 2) out.chapter = parseInt(parts[1], 10);
    if (parts.length >= 3) out.verse = parts[2];
  } else if (meta.book === 'iso') { if (parts.length >= 1) out.mantra = parseInt(parts[0], 10); }
  else if (meta.book === 'noi') { if (parts.length >= 1) out.verse = parseInt(parts[0], 10); }
  else if (meta.book === 'nod') { if (parts.length >= 1) out.chapter = parseInt(parts[0], 10); }
  else {
    if (parts.length >= 1) out.chapter = parseInt(parts[0], 10);
    if (parts.length >= 2) out.verse = parts[1];
  }
  return out;
}

/** Clean label prefixes the scraper accidentally captured (e.g. "Devanagari...", "Translation...") */
function cleanField(val) {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/^(Devanagari|Transliteration|Translation|Synonyms|Purport|IAST)\s*/i, '').trim();
}

function shapeVerse(v, alias) {
  if (!v) return null;
  let label;
  if (v.book === 'bg') label = `Bhagavad Gita ${v.chapter}.${v.verse}`;
  else if (v.book === 'sb') label = `Srimad Bhagavatam ${v.canto}.${v.chapter}.${v.verse}`;
  else if (v.book === 'cc') label = `Caitanya-caritamrta ${v.part ? v.part.charAt(0).toUpperCase() + v.part.slice(1) : ''} ${v.chapter}.${v.verse}`.trim();
  else if (v.book === 'iso') label = `Sri Isopanishad Mantra ${v.mantra || v.verse}`;
  else if (v.book === 'noi') label = `Nectar of Instruction ${v.verse}`;
  else if (v.book === 'nod') label = `Nectar of Devotion Chapter ${v.chapter}`;
  else label = v.pageTitle || v.url || 'Verse';
  return { book: v.book, canto: v.canto, chapter: v.chapter, verse: v.verse, part: v.part, mantra: v.mantra, sanskrit: cleanField(v.sanskrit), iast: cleanField(v.iast), translation: cleanField(v.translation), url: v.url || '', label, alias: alias || '', audioUrl: getAudioUrl(v.book, v.chapter, v.verse) };
}

router.get('/lookup', async (req, res) => {
  try {
    const { book, canto, chapter, verse, part, mantra } = req.query;
    if (!book) return res.status(400).json({ message: 'book is required' });
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const query = { book };
    if (book === 'sb') {
      if (canto) query.canto = parseInt(canto, 10);
      if (chapter) query.chapter = parseInt(chapter, 10);
      if (verse != null && verse !== '') { const num = Number(verse); query.$or = isNaN(num) ? [{ verse: String(verse) }] : [{ verse: String(verse) }, { verse: num }]; }
    } else if (book === 'cc') {
      if (part) query.part = part;
      if (chapter) query.chapter = parseInt(chapter, 10);
      if (verse != null && verse !== '') { const num = Number(verse); query.$or = isNaN(num) ? [{ verse: String(verse) }] : [{ verse: String(verse) }, { verse: num }]; }
    } else if (book === 'iso') { if (mantra) { const n = parseInt(mantra, 10); query.$or = [{ verse: String(mantra) }, { mantra: n }]; } }
    else if (book === 'nod') { if (chapter) query.chapter = parseInt(chapter, 10); }
    else {
      if (chapter) query.chapter = parseInt(chapter, 10);
      if (verse != null && verse !== '') { const num = Number(verse); query.$or = isNaN(num) ? [{ verse: String(verse) }] : [{ verse: String(verse) }, { verse: num }]; }
    }
    const v = await collection.findOne(query);
    if (!v) return res.status(404).json({ message: 'Verse not found' });
    res.json(shapeVerse(v));
  } catch (err) { console.error('Shloka lookup error:', err.message); res.status(500).json({ message: 'Lookup failed' }); }
});

router.get('/chapter', async (req, res) => {
  try {
    const { book, canto, chapter, part } = req.query;
    if (!book || !chapter) return res.status(400).json({ message: 'book and chapter are required' });
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const query = { book, chapter: parseInt(chapter, 10) };
    if (book === 'sb' && canto) query.canto = parseInt(canto, 10);
    if (book === 'cc' && part) query.part = part;
    const verses = await collection.find(query, { projection: { book: 1, canto: 1, chapter: 1, verse: 1, part: 1, mantra: 1, translation: 1, sanskrit: 1, url: 1 } }).sort({ verse: 1 }).limit(50).toArray();
    res.json(verses.map(v => shapeVerse(v)));
  } catch (err) { console.error('Shloka chapter list error:', err.message); res.status(500).json({ message: 'List failed' }); }
});

// ─── Hardcoded shloka fallback ──────────────────────────────
// Maps internal book codes to the book_name strings used in utils/shlokas.js
const BOOK_CODE_TO_HARDCODED_NAMES = {
  'bg':  ['Bhagavad Gita'],
  'iso': ['Īśopaniṣad', 'Isopanishad', 'Śrī Īśopaniṣad'],
  'cc':  ['Caitanya-caritāmṛta', 'Caitanya-caritamrta'],
};

/**
 * Try to find a matching verse in the curated hardcoded shloka data.
 * Returns a verse-like object compatible with shapeVerse(), or null.
 */
function lookupHardcoded(ref) {
  const names = BOOK_CODE_TO_HARDCODED_NAMES[ref.book];
  if (!names) return null;

  for (const s of hardcodedShlokas) {
    if (!names.includes(s.book)) continue;

    // ── CC: chapter field holds the part name (Adi / Madhya / Antya),
    //    verse field is a float encoding chapter.verse (e.g. 22.54)
    if (ref.book === 'cc') {
      const partName = ref.part ? ref.part.charAt(0).toUpperCase() + ref.part.slice(1) : '';
      if (s.chapter !== partName && s.chapter.toLowerCase() !== (ref.part || '').toLowerCase()) continue;

      // Decode the float verse field
      const verStr = String(s.verse);
      const dotIdx = verStr.indexOf('.');
      if (dotIdx === -1) continue;
      const hChapter = parseInt(verStr.substring(0, dotIdx), 10);
      const hVerse   = parseInt(verStr.substring(dotIdx + 1), 10);

      if (ref.chapter != null && hChapter !== ref.chapter) continue;
      if (ref.verse != null && hVerse !== Number(ref.verse)) continue;

      return {
        book:     ref.book,
        chapter:  hChapter,
        verse:    String(hVerse),
        part:     (s.chapter || '').toLowerCase(),
        sanskrit: s.devanagari || '',
        iast:     s.transliteration || '',
        translation: s.translation || '',
        url:      s.source || '',
      };
    }

    // ── ISO: match by mantra number ────────────────────────────
    if (ref.book === 'iso') {
      if (ref.mantra != null && s.verse !== ref.mantra) continue;

      return {
        book:     'iso',
        mantra:   (typeof s.verse === 'number' ? s.verse : Number(s.verse)),
        verse:    String(s.verse),
        sanskrit: s.devanagari || '',
        iast:     s.transliteration || '',
        translation: s.translation || '',
        url:      s.source || '',
      };
    }

    // ── BG / others: match chapter + verse ────────────────────
    if (ref.chapter != null && s.chapter !== ref.chapter) continue;
    if (ref.verse != null) {
      const vNum = Number(ref.verse);
      if (s.verse !== vNum && String(s.verse) !== ref.verse) continue;
    }

    return {
      book:     ref.book,
      chapter:  typeof s.chapter === 'number' ? s.chapter : undefined,
      verse:    typeof s.verse === 'number' ? String(Math.trunc(s.verse)) : String(s.verse),
      sanskrit: s.devanagari || '',
      iast:     s.transliteration || '',
      translation: s.translation || '',
      url:      s.source || '',
    };
  }

  return null;
}

router.get('/parse', async (req, res) => {
  try {
    const raw = (req.query.ref || '').toString();
    const ref = parsePartialRef(raw.replace(/^@/, '').trim());
    if (!ref) return res.json({ matches: [], partial: true });

    // Attempt database lookup first
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const query = { book: ref.book };
    if (ref.book === 'sb') { if (ref.canto != null) query.canto = ref.canto; if (ref.chapter != null) query.chapter = ref.chapter; }
    else if (ref.book === 'cc') { if (ref.part) query.part = ref.part; if (ref.chapter != null) query.chapter = ref.chapter; }
    else if (ref.book === 'iso') { if (ref.mantra != null) query.$or = [{ verse: String(ref.mantra) }, { mantra: ref.mantra }]; }
    else { if (ref.chapter != null) query.chapter = ref.chapter; }
    if (ref.book !== 'iso' && ref.verse != null) { const num = Number(ref.verse); query.$or = isNaN(num) ? [{ verse: String(ref.verse) }] : [{ verse: String(ref.verse) }, { verse: num }]; }

    const isPartial = ref.verse == null && ref.mantra == null;

    if (isPartial) {
      const list = await collection.find(query, { projection: { book: 1, canto: 1, chapter: 1, verse: 1, part: 1, mantra: 1, translation: 1, sanskrit: 1, url: 1 } }).sort({ verse: 1 }).limit(50).toArray();
      // If database has results, return them
      if (list.length > 0) return res.json({ matches: list.map(v => shapeVerse(v, ref.alias)), partial: true });
      // Fallback: return empty for partial lookups with no DB data
      return res.json({ matches: [], partial: true });
    }

    // Exact verse lookup — try DB first
    const v = await collection.findOne(query);
    if (v) return res.json({ matches: [shapeVerse(v, ref.alias)], partial: false });

    // ── DB miss — try hardcoded fallback ──────────────────────
    const hc = lookupHardcoded(ref);
    if (hc) {
      return res.json({ matches: [shapeVerse(hc, ref.alias)], partial: false });
    }

    res.json({ matches: [], partial: false });
  } catch (err) { console.error('Shloka parse error:', err.message); res.status(500).json({ message: 'Parse failed' }); }
});

router.get('/books', (req, res) => {
  res.json(Object.entries(BOOK_ALIASES).map(([alias, meta]) => ({ alias, book: meta.book, name: meta.name })));
});

router.get('/stats', async (req, res) => {
  try {
    let stats = {};
    let totalVerses = 0;
    try {
      const vedabase = await getDB();
      const collection = vedabase.collection('verses');
      const counts = await collection.aggregate([{ $group: { _id: '$book', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray();
      for (const c of counts) { stats[c._id] = c.count; totalVerses += c.count; }
    } catch (innerErr) {
      // Vedabase database may not be loaded yet — return empty stats gracefully
      console.log('Vedabase stats not available yet:', innerErr.message);
    }

    // If the database has no verses, report the hardcoded shlokas as available
    if (totalVerses === 0) {
      const hcCounts = { bg: 0, cc: 0, iso: 0 };
      for (const s of hardcodedShlokas) {
        const code = BOOK_CODE_TO_HARDCODED_NAMES['bg'].includes(s.book) ? 'bg'
                   : BOOK_CODE_TO_HARDCODED_NAMES['cc'].includes(s.book) ? 'cc'
                   : BOOK_CODE_TO_HARDCODED_NAMES['iso'].includes(s.book) ? 'iso'
                   : null;
        if (code) { hcCounts[code] = (hcCounts[code] || 0) + 1; totalVerses++; }
      }
      // Only override if we found hardcoded verses
      if (totalVerses > 0) stats = hcCounts;
    }

    res.json({ stats, totalVerses });
  } catch (err) { console.error('Shloka stats error:', err.message); res.status(500).json({ message: 'Stats failed' }); }
});

module.exports = router;
