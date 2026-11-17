import assert from 'node:assert/strict';

const root = process.env.TEST_URL || 'http://127.0.0.1:8788';
const request = async (path, method = 'GET', body, token, type = 'application/json') => {
  const response = await fetch(root + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': type } : {}) },
    body: body && type === 'application/json' ? JSON.stringify(body) : body
  });
  const data = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : await response.arrayBuffer();
  return { status: response.status, data };
};

const event = await request('/api/events/current');
assert.equal(event.status, 200);
const first = await request('/api/guests', 'POST', { displayName: 'ทดสอบ A' });
const second = await request('/api/guests', 'POST', { displayName: 'ทดสอบ B' });
assert.equal(first.status, 201);
assert.equal(second.status, 201);
const ownerToken = first.data.token;
const otherToken = second.data.token;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR3sAAAAASUVORK5CYII=', 'base64');
const media = await request('/api/media', 'POST', png, ownerToken, 'image/png');
assert.equal(media.status, 201, JSON.stringify(media.data));
assert.equal((await request(media.data.url)).status, 403);
const created = await request('/api/krathongs', 'POST', {
  name: '<script>alert(1)</script>', wish: 'ขอให้มีความสุข', baseId: 'base_banana_leaf', imageMediaId: media.data.id, visibility: 'anonymous'
}, ownerToken);
assert.equal(created.status, 201, JSON.stringify(created.data));
const id = created.data.item.id;
assert.equal(created.data.item.name, 'ผู้ไม่ประสงค์ออกนาม');
assert.equal((await request(media.data.url)).status, 200);
const list = await request('/api/krathongs');
assert.equal(list.status, 200);
assert(list.data.items.some(item => item.id === id && item.name === 'ผู้ไม่ประสงค์ออกนาม'));
assert.equal((await request(`/api/krathongs/${id}`, 'DELETE', undefined, otherToken)).status, 403);
const privatePost = await request('/api/krathongs', 'POST', {
  name: 'ส่วนตัว', wish: 'ข้อความส่วนตัว', baseId: 'base_banana_leaf', visibility: 'private'
}, ownerToken);
assert.equal(privatePost.status, 201);
assert.equal((await request(`/api/krathongs/${privatePost.data.item.id}`)).status, 403);
assert((await request('/api/mine', 'GET', undefined, ownerToken)).data.items.some(item => item.id === privatePost.data.item.id));
assert.equal((await request(`/api/krathongs/${id}`, 'DELETE', undefined, ownerToken)).status, 200);
assert.equal((await request(media.data.url)).status, 404);
console.log('Cloudflare API smoke checks passed');
