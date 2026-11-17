import { fail, json } from '../../_lib.js';

export async function onRequestGet(context) {
  const event = await context.env.DB.prepare("SELECT id,title,description,starts_at,ends_at FROM events WHERE status='open' AND starts_at <= CURRENT_TIMESTAMP AND ends_at > CURRENT_TIMESTAMP ORDER BY starts_at DESC LIMIT 1").first();
  return event ? json(event) : fail('ยังไม่มีกิจกรรมที่เปิดอยู่', 404);
}
