/**
 * RAG storage layer: writes documents/chunks to Postgres (pgvector) and
 * retrieves the chunks most similar to a question.
 */
const db = require('../../config/db');
const { embed } = require('../geminiProvider');
const { chunkText } = require('./chunker');

const EMBED_BATCH_SIZE = 50;

/** pgvector accepts vectors as the text literal '[0.1,0.2,...]'. */
const toVectorLiteral = (vec) => `[${vec.join(',')}]`;

/**
 * Chunk, embed and store a document. Re-ingesting the same `source`
 * replaces the previous version, so generated documents can be refreshed safely.
 *
 * @param {object} doc
 * @param {string} doc.title
 * @param {string} doc.source     Stable identifier, e.g. 'curriculum:12'
 * @param {number|null} [doc.programId]  null = visible to every program
 * @param {string} doc.text
 * @returns {Promise<{documentId: number, chunks: number}>}
 */
async function ingestDocument({ title, source, programId = null, text }) {
  if (!source) throw new Error('ingestDocument: "source" is required.');

  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error('ingestDocument: document has no text.');

  // Embed before opening the transaction so no DB connection is held during network calls.
  const vectors = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    vectors.push(...(await embed(batch, 'RETRIEVAL_DOCUMENT')));
  }

  const client = db.getClient ? await db.getClient() : db;
  const isDedicatedClient = Boolean(db.getClient);

  try {
    if (isDedicatedClient) await client.query('BEGIN');

    await client.query('DELETE FROM kb_documents WHERE source = $1', [source]);

    const docRes = await client.query(
      `INSERT INTO kb_documents (title, source, program_id)
       VALUES ($1, $2, $3) RETURNING document_id`,
      [title, source, programId]
    );
    const documentId = docRes.rows[0].document_id;

    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO kb_chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [documentId, i, chunks[i], toVectorLiteral(vectors[i])]
      );
    }

    if (isDedicatedClient) await client.query('COMMIT');
    return { documentId, chunks: chunks.length };
  } catch (error) {
    if (isDedicatedClient) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (isDedicatedClient && client.release) client.release();
  }
}

/**
 * Find the chunks most similar to a question.
 * Only global documents (program_id IS NULL) and documents belonging to
 * `programIds` are searched. The default of [] means global-only, so
 * forgetting to pass a scope can never leak another program's data.
 *
 * @param {string} question
 * @param {{programIds?: number[], k?: number}} [opts]
 * @returns {Promise<Array<{chunk_id:number, content:string, title:string, source:string, distance:number}>>}
 */
async function retrieve(question, { programIds = [], k = 5 } = {}) {
  const [queryVec] = await embed([question], 'RETRIEVAL_QUERY');

  const res = await db.query(
    `SELECT c.chunk_id, c.content, d.title, d.source,
            c.embedding <=> $1::vector AS distance
     FROM kb_chunks c
     JOIN kb_documents d ON d.document_id = c.document_id
     WHERE d.program_id IS NULL OR d.program_id = ANY($2::int[])
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    [toVectorLiteral(queryVec), programIds, k]
  );
  return res.rows;
}

module.exports = { ingestDocument, retrieve };