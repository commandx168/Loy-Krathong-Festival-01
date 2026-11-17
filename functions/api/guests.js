import { fail, id, json, limit, sha256, text, token } from '../_lib.js';

export async function onRequestPost(context) {
  if (!(await limit(context, 'guest', 10))) return fail('ลองใหม่พรุ่งนี้', 429);
  const body = await context.request.json().catch(() => ({}));
  const name = text(body.displayName || 'ผู้ไม่ประสงค์ออกนาม', 30);
  if (!name) return fail('ชื่อไม่ถูกต้อง');
  const userId = id();
  const secret = token();
  await context.env.DB.prepare('INSERT INTO users(id,display_name,token_hash) VALUES (?,?,?)')
    .bind(userId, name, await sha256(secret)).run();
  return json({ userId, token: secret }, 201);
}
