import { fail, id, json, limit, owner } from '../_lib.js';

export async function onRequestPost(context) {
  const user = await owner(context);
  if (!user) return fail('กรุณาเริ่มใช้งานใหม่', 401);
  if (!(await limit(context, 'media', 20))) return fail('อัปโหลดเกินจำนวนวันนี้', 429);
  const type = context.request.headers.get('Content-Type') || '';
  if (type !== 'image/webp' && type !== 'image/png') return fail('รองรับเฉพาะ WebP หรือ PNG');
  const bytes = new Uint8Array(await context.request.arrayBuffer());
  if (!bytes.length || bytes.length > 250000) return fail('รูปภาพต้องไม่เกิน 250 KB');
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const png = bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [137,80,78,71,13,10,26,10][i]);
  if ((type === 'image/webp' && !webp) || (type === 'image/png' && !png)) return fail('ไฟล์รูปภาพไม่ถูกต้อง');
  const mediaId = id();
  await context.env.DB.prepare('INSERT INTO media(id,owner_user_id,storage_key,data,kind,mime_type,byte_size,width,height) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(mediaId, user.id, `d1/${mediaId}`, bytes, 'krathong', type, bytes.length, 480, 360).run();
  return json({ id: mediaId, url: `/api/media/${mediaId}` }, 201);
}
