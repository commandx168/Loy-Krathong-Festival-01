export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function fail(message, status = 400) {
  return json({ error: message }, status);
}

export function id() {
  return crypto.randomUUID();
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function owner(context) {
  const bearer = context.request.headers.get('Authorization') || '';
  if (!bearer.startsWith('Bearer ')) return null;
  const token = bearer.slice(7);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return context.env.DB.prepare('SELECT id, display_name FROM users WHERE token_hash = ? AND disabled_at IS NULL')
    .bind(await sha256(token)).first();
}

export function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}

export function text(value, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : null;
}

export async function limit(context, action, max) {
  const ip = context.request.headers.get('CF-Connecting-IP') || 'local';
  const day = new Date().toISOString().slice(0, 10);
  const fingerprint = await sha256(`${day}:${ip}`);
  const db = context.env.DB;
  await db.prepare('INSERT INTO daily_limits (fingerprint,day,action,count) VALUES (?,?,?,1) ON CONFLICT(fingerprint,day,action) DO UPDATE SET count=count+1')
    .bind(fingerprint, day, action).run();
  const row = await db.prepare('SELECT count FROM daily_limits WHERE fingerprint=? AND day=? AND action=?')
    .bind(fingerprint, day, action).first();
  return row.count <= max;
}

export function publicKrathong(row) {
  return {
    id: row.id,
    name: row.visibility === 'anonymous' ? 'ผู้ไม่ประสงค์ออกนาม' : row.display_name,
    wish: row.wish_text,
    baseId: row.base_id,
    timestamp: Date.parse(row.created_at.replace(' ', 'T') + 'Z'),
    imageData: row.image_media_id ? `/api/media/${row.image_media_id}` : null,
    visibility: row.visibility
  };
}
