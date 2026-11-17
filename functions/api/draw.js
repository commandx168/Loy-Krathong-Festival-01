import { fail, id, json } from '../_lib.js';

export async function onRequestGet(context) {
  const rows = await context.env.DB.prepare('SELECT display_name,drawn_at FROM draw_winners ORDER BY drawn_at DESC LIMIT 20').all();
  return json({ winners: rows.results });
}

export async function onRequestPost(context) {
  const provided = context.request.headers.get('X-Draw-Admin') || '';
  if (!context.env.DRAW_ADMIN_TOKEN || provided !== context.env.DRAW_ADMIN_TOKEN) return fail('รหัสผู้บริหารไม่ถูกต้อง', 403);
  const event = await context.env.DB.prepare("SELECT id FROM events WHERE status='open' AND starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP ORDER BY starts_at DESC LIMIT 1").first();
  if (!event) return fail('ยังไม่มีกิจกรรมที่เปิดอยู่', 409);
  const candidates = await context.env.DB.prepare("SELECT k.owner_user_id,MAX(k.display_name) AS display_name FROM krathongs k WHERE k.event_id=? AND k.status='published' AND k.visibility='public' AND NOT EXISTS (SELECT 1 FROM draw_winners w WHERE w.event_id=k.event_id AND w.owner_user_id=k.owner_user_id) GROUP BY k.owner_user_id").bind(event.id).all();
  if (!candidates.results.length) return fail('ยังไม่มีรายชื่อที่มีสิทธิ์ หรือสุ่มครบแล้ว', 409);
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const winner = candidates.results[bytes[0] % candidates.results.length];
  await context.env.DB.prepare('INSERT INTO draw_winners(id,event_id,owner_user_id,display_name) VALUES (?,?,?,?)').bind(id(), event.id, winner.owner_user_id, winner.display_name).run();
  return json({ winner: winner.display_name, remaining: candidates.results.length - 1 });
}
