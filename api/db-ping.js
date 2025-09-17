const { query, connectionMeta } = require('./_lib/db');

module.exports = async function handler(req, res) {
  try {
    const meta = connectionMeta && connectionMeta();
    const result = await query('SELECT 1 as ok');
    res.status(200).json({
      success: true,
      ok: result?.rows?.[0]?.ok === 1,
      host: meta?.host || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error?.message || 'database error',
    });
  }
};


