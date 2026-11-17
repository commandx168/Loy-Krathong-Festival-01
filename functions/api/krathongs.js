import { fail, id, json, limit, owner, publicKrathong, text } from '../_lib.js';

export async function onRequestGet(context) {
  const event = await context.env.DB.prepare("SELECT id FROM events WHERE status='open' AND starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP ORDER BY starts_at DESC LIMIT 1").first();
  if (!event) return json({ items: [], count: 0 });
  const rows = await context.env.DB.prepare("SELECT id,owner_user_id,display_name,wish_text,base_id,image_media_id,visibility,created_at FROM krathongs WHERE event_id=? AND status='published' AND visibility!='private' ORDER BY created_at DESC LIMIT 100")
    .bind(event.id).all();
  const count = await context.env.DB.prepare("SELECT COUNT(*) AS n FROM krathongs WHERE event_id=? AND status='published' AND visibility!='private'").bind(event.id).first();
  const user = await owner(context);
  return json({ items: rows.results.map(row => ({ ...publicKrathong(row), mine: row.owner_user_id === user?.id })), count: count.n });
}

export async function onRequestPost(context) {
  const user = await owner(context);
  if (!user) return fail('กรุณาเริ่มใช้งานใหม่', 401);
  if (!(await limit(context, 'krathong', 100))) return fail('ลอยกระทงเกินจำนวนวันนี้', 429);
  const ownCount = await context.env.DB.prepare("SELECT COUNT(*) AS n FROM krathongs WHERE owner_user_id=? AND created_at >= datetime('now','-1 day')").bind(user.id).first();
  if (ownCount.n >= 5) return fail('ผู้ใช้นี้ลอยกระทงครบ 5 ใบใน 24 ชั่วโมงแล้ว', 429);
  const event = await context.env.DB.prepare("SELECT id FROM events WHERE status='open' AND starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP ORDER BY starts_at DESC LIMIT 1").first();
  if (!event) return fail('ยังไม่มีกิจกรรมที่เปิดอยู่', 409);
  const body = await context.request.json().catch(() => ({}));
  const name = text(body.name || 'ผู้ไม่ประสงค์ออกนาม', 30);
  const wish = text(body.wish, 1000);
  const base = text(body.baseId, 100);
  const visibility = ['public', 'anonymous', 'private'].includes(body.visibility) ? body.visibility : null;
  if (!name || !wish || !base || !visibility) return fail('ข้อมูลกระทงไม่ครบ');
  let mediaId = null;
  if (body.imageMediaId) {
    const media = await context.env.DB.prepare('SELECT id FROM media WHERE id=? AND owner_user_id=? AND kind=?').bind(body.imageMediaId, user.id, 'krathong').first();
    if (!media) return fail('รูปภาพไม่ถูกต้อง', 403);
    const used = await context.env.DB.prepare('SELECT id FROM krathongs WHERE image_media_id=? LIMIT 1').bind(media.id).first();
    if (used) return fail('รูปภาพนี้ถูกใช้แล้ว', 409);
    mediaId = media.id;
  }
  const krathongId = id();
  await context.env.DB.prepare("INSERT INTO krathongs(id,event_id,owner_user_id,display_name,wish_text,base_id,image_media_id,decorations_json,visibility,status) VALUES (?,?,?,?,?,?,?,?,?,'published')")
    .bind(krathongId, event.id, user.id, name, wish, base, mediaId, '[]', visibility).run();
  const row = await context.env.DB.prepare('SELECT id,display_name,wish_text,base_id,image_media_id,visibility,created_at FROM krathongs WHERE id=?').bind(krathongId).first();
  return json({ item: { ...publicKrathong(row), mine: true } }, 201);
}
