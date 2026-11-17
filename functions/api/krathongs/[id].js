import { fail, json, owner, publicKrathong, sha256 } from '../../_lib.js';

export async function onRequestGet(context) {
  const row = await context.env.DB.prepare('SELECT id,owner_user_id,display_name,wish_text,base_id,image_media_id,visibility,status,created_at FROM krathongs WHERE id=?').bind(context.params.id).first();
  if (!row || row.status !== 'published') return fail('ไม่พบกระทง', 404);
  const user = await owner(context);
  if (row.visibility === 'private' && row.owner_user_id !== user?.id) return fail('ไม่มีสิทธิ์ดู', 403);
  return json({ item: publicKrathong(row) });
}

export async function onRequestDelete(context) {
  const suppliedCode = context.request.headers.get('X-Delete-Admin') || '';
  const expectedCode = context.env.DELETE_ADMIN_TOKEN || '';
  const admin = suppliedCode && expectedCode && suppliedCode.length === expectedCode.length
    && await sha256(suppliedCode) === await sha256(expectedCode);
  const user = admin ? null : await owner(context);
  if (!admin && !user) return fail('กรุณาเข้าสู่ระบบหรือใส่รหัสแอดมิน', 401);
  const row = await context.env.DB.prepare('SELECT id,owner_user_id,image_media_id FROM krathongs WHERE id=? AND status=?').bind(context.params.id, 'published').first();
  if (!row) return fail('ไม่พบกระทง', 404);
  if (!admin && row.owner_user_id !== user.id) return fail('ไม่มีสิทธิ์ลบ', 403);
  await context.env.DB.prepare("UPDATE krathongs SET status='deleted',image_media_id=NULL,deleted_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run();
  if (row.image_media_id) await context.env.DB.prepare('DELETE FROM media WHERE id=?').bind(row.image_media_id).run();
  return json({ ok: true });
}
