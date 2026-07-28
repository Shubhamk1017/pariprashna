const { MongoClient } = require('mongodb');

let vedabaseClient;
let vedabaseDb;

/**
 * Shared MongoDB connection pool for the Vedabase database.
 */
async function getVedabaseDB() {
  if (!vedabaseDb) {
    const mongoUri = process.env.VEDABASE_MONGO_URI || process.env.MONGODB_URI;
    vedabaseClient = new MongoClient(mongoUri);
    await vedabaseClient.connect();
    vedabaseDb = vedabaseClient.db('vedabase');
  }
  return vedabaseDb;
}

/**
 * Format verse reference label
 */
function verseLabel(v) {
  if (!v) return '';
  if (v.book === 'bg') return `Bhagavad Gita ${v.chapter}.${v.verse}`;
  if (v.book === 'sb') return `Srimad Bhagavatam ${v.canto}.${v.chapter}.${v.verse}`;
  if (v.book === 'cc') return `Caitanya-caritamrta ${v.part} ${v.chapter}.${v.verse}`;
  if (v.book === 'iso') return `Sri Isopanishad Mantra ${v.mantra || v.verse}`;
  if (v.book === 'noi') return `Nectar of Instruction ${v.verse}`;
  return v.pageTitle || v.url || '';
}

/**
 * Search verses from MongoDB (RAG)
 */
async function searchVerses(query, limit = 5) {
  try {
    const db = await getVedabaseDB();
    const collection = db.collection('verses');

    const results = await collection
      .find(
        { $text: { $search: query } },
        {
          projection: {
            score: { $meta: 'textScore' },
            book: 1, chapter: 1, verse: 1, canto: 1, part: 1,
            translation: 1, purport: 1, sanskrit: 1, iast: 1,
            url: 1, pageTitle: 1, mantra: 1
          },
        }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray();

    if (results.length > 0) return results;

    const regexResults = await collection
      .find({
        $or: [
          { translation: { $regex: query, $options: 'i' } },
          { purport: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(limit)
      .toArray();

    return regexResults;
  } catch (err) {
    console.error('Vedabase search error:', err.message);
    return [];
  }
}

/**
 * Build context block from verses for AI prompting
 */
function buildVerseContext(verses) {
  if (!verses || verses.length === 0) return '';

  return '\n\n---\nRelevant scripture from vedabase.io:\n\n' +
    verses.map((v) => {
      const label = verseLabel(v);
      return [
        `[${label}]`,
        v.sanskrit ? `Sanskrit: ${v.sanskrit}` : '',
        v.iast ? `Transliteration: ${v.iast}` : '',
        v.translation ? `Translation: ${v.translation}` : '',
        v.purport ? `Purport (excerpt): ${v.purport.slice(0, 600)}...` : '',
        `Source: ${v.url}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

module.exports = {
  getVedabaseDB,
  verseLabel,
  searchVerses,
  buildVerseContext
};
