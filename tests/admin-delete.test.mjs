import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequestDelete } from '../functions/api/krathongs/[id].js';

function context(code, expected = 'correct-admin-code') {
  const queries = [];
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.startsWith('SELECT id,owner_user_id')) return { id: 'wish-1', owner_user_id: 'owner-1', image_media_id: 'image-1' };
              return null;
            },
            async run() { queries.push({ sql, args }); }
          };
        }
      };
    }
  };
  return {
    queries,
    env: { DB: db, DELETE_ADMIN_TOKEN: expected },
    params: { id: 'wish-1' },
    request: new Request('https://example.test/api/krathongs/wish-1', {
      method: 'DELETE', headers: code ? { 'X-Delete-Admin': code } : {}
    })
  };
}

test('missing or incorrect admin code cannot delete another user’s wish', async () => {
  for (const code of [null, 'wrong-admin-code']) {
    const ctx = context(code);
    assert.equal((await onRequestDelete(ctx)).status, 401);
    assert.equal(ctx.queries.length, 0);
  }
});

test('admin code has no effect when server secret is unset', async () => {
  const ctx = context('correct-admin-code', '');
  assert.equal((await onRequestDelete(ctx)).status, 401);
  assert.equal(ctx.queries.length, 0);
});

test('correct admin code deletes the record and its image', async () => {
  const ctx = context('correct-admin-code');
  assert.equal((await onRequestDelete(ctx)).status, 200);
  assert.equal(ctx.queries.length, 2);
  assert.match(ctx.queries[0].sql, /status='deleted'/);
  assert.match(ctx.queries[1].sql, /DELETE FROM media/);
});
