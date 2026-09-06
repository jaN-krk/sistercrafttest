"""Behavioral tests against the exact shipped SQLite migrations, in memory only."""
import sqlite3,unittest,json
from pathlib import Path
class CommerceDatabaseTests(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:',isolation_level=None)
  for f in sorted(Path('drizzle').glob('*.sql')):self.db.executescript(f.read_text(encoding='utf-8'))
  self.db.execute("INSERT INTO products VALUES('p','{}',50000,5,1,1)")
  self.db.execute("INSERT INTO products VALUES('q','{}',10000,1,1,1)")
 def order(self,id='o',session='s',lines=(('p',1,50000),)):
  self.db.execute('BEGIN')
  try:
   self.db.execute('INSERT INTO orders(id,number,session,status,customer,subtotal,shipping,total,consent,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',(id,id,session,'initializing','{}',50000,0,50000,'{}',1,1))
   for pid,qty,price in lines:self.db.execute('INSERT INTO order_lines VALUES(?,?,?,?,?)',(id,pid,pid,qty,price))
   self.db.execute('COMMIT')
  except: self.db.execute('ROLLBACK');raise
 def stock(self,id='p'):return self.db.execute('SELECT stock FROM products WHERE id=?',(id,)).fetchone()[0]
 def test_reservation_and_one_time_release(self):
  self.order();self.assertEqual(self.stock(),4);self.db.execute("UPDATE orders SET status='failed' WHERE id='o'");self.assertEqual(self.stock(),5);self.db.execute("UPDATE orders SET status='failed' WHERE id='o'");self.assertEqual(self.stock(),5)
 def test_no_oversell(self):
  self.order('a','a',(('p',5,50000),));self.assertEqual(self.stock(),0)
  with self.assertRaises(sqlite3.IntegrityError):self.order('b','b')
  self.assertEqual(self.stock(),0);self.assertEqual(self.db.execute('SELECT COUNT(*) FROM orders').fetchone()[0],1)
 def test_failed_second_line_rolls_back_first(self):
  with self.assertRaises(sqlite3.IntegrityError):self.order(lines=(('p',1,50000),('q',2,10000)))
  self.assertEqual(self.stock(),5);self.assertEqual(self.db.execute('SELECT COUNT(*) FROM orders').fetchone()[0],0)
 def test_price_changed_between_read_and_reserve(self):
  with self.assertRaises(sqlite3.IntegrityError):self.order(lines=(('p',1,1),))
  self.assertEqual(self.stock(),5)
 def test_one_open_checkout_per_cart(self):
  self.order()
  with self.assertRaises(sqlite3.IntegrityError):self.order('other','s')
  self.assertEqual(self.stock(),4)
 def test_rejected_manual_close_releases_once(self):
  self.order();self.db.execute("UPDATE orders SET status='rejected' WHERE id='o'");self.assertEqual(self.stock(),4);self.db.execute("UPDATE orders SET status='failed' WHERE id='o'");self.assertEqual(self.stock(),5)
 def test_paid_does_not_release_and_queues_receipt_once(self):
  self.order();self.db.execute("INSERT INTO cart_items VALUES('s','p',1)");self.db.execute("UPDATE orders SET status='paid' WHERE id='o'");self.assertEqual(self.stock(),4);self.assertEqual(self.db.execute('SELECT COUNT(*) FROM cart_items').fetchone()[0],0);self.db.execute("UPDATE orders SET status='paid' WHERE id='o'");self.assertEqual(self.db.execute('SELECT COUNT(*) FROM mail_outbox').fetchone()[0],1)
 def test_admin_delta_preserves_concurrent_reservation(self):
  self.order();self.db.execute("UPDATE products SET stock=stock+2 WHERE id='p'");self.assertEqual(self.stock(),6)
 def test_refund_claim_is_once(self):
  self.order();self.db.execute("UPDATE orders SET status='paid' WHERE id='o'");self.db.execute("INSERT INTO refund_actions VALUES('r','o','tx',50000,'ready',1,1)")
  stmt="UPDATE refund_actions SET status='sending' WHERE id='r' AND status='ready' RETURNING id"
  self.assertEqual(self.db.execute(stmt).fetchone()[0],'r');self.assertIsNone(self.db.execute(stmt).fetchone())
 def test_shipping_and_refund_email_events(self):
  self.order();self.db.execute("UPDATE orders SET status='paid' WHERE id='o'");self.db.execute("UPDATE orders SET status='shipped' WHERE id='o'");self.db.execute("UPDATE orders SET status='refunded' WHERE id='o'");self.assertEqual(self.db.execute('SELECT COUNT(*) FROM mail_outbox').fetchone()[0],3)
if __name__=='__main__':unittest.main(verbosity=2)
