import { fail, owner } from '../../_lib.js';

export async function onRequestGet(context) {
  const mediaId = context.params.id;
  const row = await context.env.DB.prepare('SELECT id,owner_user_id,data,mime_type FROM media WHERE id=?').bind(mediaId).first();
  if (!row) return fail('ไม่พบรูปภาพ', 404);
  const visible = await context.env.DB.prepare("SELECT id FROM krathongs WHERE image_media_id=? AND status='published' AND visibility!='private' LIMIT 1").bind(mediaId).first();
  const user = await owner(context);
  if (!visible && row.owner_user_id !== user?.id) return fail('ไม่มีสิทธิ์ดูรูปภาพ', 403);
  return new Response(new Uint8Array(row.data), { headers: { 'Content-Type': row.mime_type, 'Cache-Control': visible ? 'public, max-age=3600' : 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
