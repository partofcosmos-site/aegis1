/**
 * @file api/sync.ts
 * @description
 * High-Speed Universal Cloud Sync Relay for Savantix (Aegis).
 * Enables instant multi-device cross-synchronization across Phone & PC
 * without permission-denied errors or popup blockers.
 */

// In-memory global store for edge instances
const syncStore: Record<string, { payload: any; updatedAt: string }> = {};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cleanKey = (key: string) => (key || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  // Handle GET /api/sync?canonicalId=...
  if (req.method === 'GET') {
    const rawId = (req.query?.canonicalId || req.query?.key || req.query?.email || '') as string;
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'canonicalId parameter is required' });
    }
    const id = cleanKey(rawId);
    const item = syncStore[id];

    return res.status(200).json({
      success: true,
      exists: Boolean(item),
      canonicalId: id,
      payload: item ? item.payload : null,
      updatedAt: item ? item.updatedAt : null,
      timestamp: new Date().toISOString()
    });
  }

  // Handle POST /api/sync
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const rawId = body?.canonicalId || body?.key || body?.email || '';
      if (!rawId) {
        return res.status(400).json({ success: false, message: 'canonicalId is required in body' });
      }

      const id = cleanKey(rawId);
      const payload = body.snapshot || body.payload || body.data || body;

      syncStore[id] = {
        payload,
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        canonicalId: id,
        timestamp: new Date().toISOString(),
        logsCount: Array.isArray(payload.logs) ? payload.logs.length : 0,
        goalsCount: Array.isArray(payload.goals) ? payload.goals.length : 0
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Sync write failed' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
