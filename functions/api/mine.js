import { fail, json, owner, publicKrathong } from '../_lib.js';

export async function onRequestGet(context) {
  const user = await owner(context);
  if (!user) return fail('กรุณาเริ่มใช้งานใหม่', 401);
  const rows = await context.env.DB.prepare("SELECT id,display_name,wish_text,base_id,image_media_id,visibility,created_at FROM krathongs WHERE owner_user_id=? AND status='published' AND visibility='private' ORDER BY created_at DESC LIMIT 100").bind(user.id).all();
  return json({ items: rows.results.map(row => ({ ...publicKrathong(row), mine: true })) });
}
