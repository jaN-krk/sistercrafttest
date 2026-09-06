"""Exercise the actual dashboard SQL against isolated SQLite fixtures."""
import sqlite3, pathlib, re, json, datetime
root=pathlib.Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
for file in sorted((root/'drizzle').glob('*.sql')):db.executescript(file.read_text(encoding='utf8'))
source=(root/'lib/admin-extensions.ts').read_text(encoding='utf8')
cte=re.search(r'const salesCte="([^"]+)";',source).group(1)
states=re.search(r'const paidStates="([^"]+)";',source).group(1)
queries=re.findall(r'db\(\)\.prepare\(salesCte\+`([^`]+)`\)',source)
assert len(queries)==3
start=1788814800000
def order(identifier,status,total,created):
 customer=json.dumps({'email':'buyer@example.com','name':'Buyer','surname':'Person','city':'Istanbul'})
 db.execute('INSERT INTO orders(id,number,session,status,customer,subtotal,shipping,total,consent,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',(identifier,identifier,identifier,status,customer,total,0,total,'{}',created,created))
order('paid','paid',10000,start)
order('partial','refund_pending',20000,start+86400000)
order('full','refunded',30000,start+86400000)
order('failed','failed',40000,start+86400000)
order('outside','paid',90000,start-1)
for identifier,amount,status in [('confirmed',5000,'confirmed'),('unknown',10000,'unknown')]:
 db.execute('INSERT INTO refund_actions VALUES(?,?,?,?,?,?,?)',(identifier,'partial',identifier,amount,status,start,start))
def sql(q):return cte+q.replace('${paidStates}',states)
totals=dict(db.execute(sql(queries[0]),(start,)).fetchone())
assert totals=={'orders':4,'gross':60000,'refunded':35000,'paidOrders':3},totals
daily=[dict(r) for r in db.execute(sql(queries[1]),(start,))]
assert sum(d['revenue'] for d in daily)==25000,daily
assert sum(d['orders'] for d in daily)==4,daily
where="WHERE json_extract(customer,'$.email') LIKE ? OR json_extract(customer,'$.name') LIKE ? OR json_extract(customer,'$.surname') LIKE ?"
customers=[dict(r) for r in db.execute(sql(queries[2]).replace('${where}',where),('%','%','%',0))]
assert len(customers)==1 and customers[0]['spent']==115000,customers
# Independent subtree edits must never restore an old checkout switch.
db.execute("INSERT INTO settings VALUES('store',?)",(json.dumps({'checkoutEnabled':True,'exchange':{'tryPerUsd':40},'merchandising':{'heroIds':['a']}}),))
query="INSERT INTO settings(key,value) VALUES('store',?) ON CONFLICT(key) DO UPDATE SET value=json_patch(settings.value,excluded.value)"
db.execute(query,(json.dumps({'checkoutEnabled':False}),))
db.execute(query,(json.dumps({'exchange':{'tryPerUsd':48.3195}}),))
db.execute(query,(json.dumps({'merchandising':{'heroIds':['b']}}),))
settings=json.loads(db.execute("SELECT value FROM settings WHERE key='store'").fetchone()[0])
assert settings['checkoutEnabled'] is False and settings['exchange']['tryPerUsd']==48.3195 and settings['merchandising']['heroIds']==['b']
# Verify both mutations in source use the same atomic patch, not replacement.
route=(root/'app/api/[...path]/route.ts').read_text(encoding='utf8')
assert source.count('value=json_patch(settings.value,excluded.value)')==2
assert 'value=json_patch(settings.value,excluded.value)' in route
print(json.dumps({'ok':True,'checks':8,'scope':'partial refunds, period cutoff, customer totals, independent settings patches'}))

