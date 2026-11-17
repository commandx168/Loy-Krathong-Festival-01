import { fail, id, json, limit, owner, text } from '../../../_lib.js';

export async function onRequestGet(context) {
  const k = await context.env.DB.prepare("SELECT id FROM krathongs WHERE id=? AND status='published' AND visibility!='private'").bind(context.params.id).first();
  if (!k) return fail('ไม่พบกระทง', 404);
  const rows = await context.env.DB.prepare("SELECT m.id,m.body,m.created_at,u.display_name FROM messages m JOIN users u ON u.id=m.author_user_id WHERE m.krathong_id=? AND m.status='published' ORDER BY m.created_at DESC LIMIT 50").bind(k.id).all();
  return json({ items: rows.results });
}

export async function onRequestPost(context) {
  const user = await owner(context);
  if (!user) return fail('กรุณาเริ่มใช้งานใหม่', 401);
  if (!(await limit(context, 'message', 10))) return fail('ส่งข้อความเกินจำนวนวันนี้', 429);
  const k = await context.env.DB.prepare("SELECT id FROM krathongs WHERE id=? AND status='published' AND visibility!='private'").bind(context.params.id).first();
  if (!k) return fail('ไม่พบกระทง', 404);
  const body = await context.request.json().catch(() => ({}));
  const message = text(body.message, 500);
  if (!message) return fail('ข้อความไม่ถูกต้อง');
  await context.env.DB.prepare("INSERT INTO messages(id,krathong_id,author_user_id,body,status) VALUES (?,?,?,?,'pending')")
    .bind(id(), k.id, user.id, message).run();
  return json({ ok: true, status: 'pending' }, 201);
}
