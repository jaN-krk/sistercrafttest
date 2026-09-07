import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createClient } from '@libsql/client';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const compiled = await build({
  entryPoints: ['lib/turso-adapter.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'sql-source', setup(builder) {
    builder.onResolve({ filter: /\.sql\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.slice(0, -4)), namespace: 'sql' }));
    builder.onLoad({ filter: /.*/, namespace: 'sql' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
  } }],
});
const { TursoDatabase } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const client = createClient({ url: ':memory:' });
let checks = 0;
function check(condition, label) { assert(condition, label); checks++; }
try {
  const db = new TursoDatabase(client);
  await Promise.all([db.ready(), db.ready(), db.ready()]);
  check((await db.prepare('SELECT COUNT(*) AS count FROM sistercraft_migrations').first()).count === 4, 'all schema migrations applied once');
  await new TursoDatabase(client).ready();
  check((await db.prepare('SELECT COUNT(*) AS count FROM sistercraft_migrations').first()).count === 4, 'fresh process preserves migration history');
  const value = "quote' and Unicode: tütsü";
  const insert = await db.prepare('INSERT INTO settings VALUES (?, ?)').bind('test', value).run();
  check(insert.success && insert.meta.changes === 1, 'write returns D1-compatible changes');
  check((await db.prepare('SELECT value FROM settings WHERE key=?').bind('test').first()).value === value, 'bound strings survive unchanged');
  check(await db.prepare('SELECT value FROM settings WHERE key=?').bind('test').first('value') === value, 'first(column)');
  check(await db.prepare('SELECT value FROM settings WHERE key=?').bind('missing').first() === null, 'missing row is null');
  const raw = await db.prepare('SELECT key,value FROM settings').raw({ columnNames: true });
  check(raw[0].join(',') === 'key,value' && raw[1][1] === value, 'raw column order');
  await assert.rejects(db.batch([
    db.prepare('INSERT INTO settings VALUES (?, ?)').bind('atomic', 'first'),
    db.prepare('INSERT INTO settings VALUES (?, ?)').bind('test', 'duplicate'),
  ])); checks++;
  check(await db.prepare("SELECT * FROM settings WHERE key='atomic'").first() === null, 'failed batch rolls back every statement');
  await db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?)').bind('p', '{}', 100, 1, 1, Date.now()).run();
  const order = db.prepare('INSERT INTO orders(id,number,session,status,customer,subtotal,shipping,total,consent,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind('o','test-order','session','initializing','{}',200,0,200,'{}',Date.now(),Date.now());
  await assert.rejects(db.batch([order, db.prepare('INSERT INTO order_lines VALUES(?,?,?,?,?)').bind('o','p','Product',2,100)])); checks++;
  check((await db.prepare("SELECT stock FROM products WHERE id='p'").first()).stock === 1, 'stock trigger prevents overselling');
  check(await db.prepare("SELECT id FROM orders WHERE id='o'").first() === null, 'failed reservation creates no order');
  await db.batch([order, db.prepare('INSERT INTO order_lines VALUES(?,?,?,?,?)').bind('o','p','Product',1,100)]);
  check((await db.prepare("SELECT stock FROM products WHERE id='p'").first()).stock === 0, 'successful reservation decrements stock');
  await db.prepare("UPDATE orders SET status='failed' WHERE id='o'").run();
  check((await db.prepare("SELECT stock FROM products WHERE id='p'").first()).stock === 1, 'failed payment releases reserved stock');
  console.log(JSON.stringify({ ok: true, checks, scope: 'Real SQLite via libSQL: migrations, parameters, transactions, stock triggers' }));
} finally {
  client.close();
}
