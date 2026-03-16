const express = require('express');

const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  let connection;

  try {
    connection = await pool.getConnection();
    const [transactions] = await connection.query(
      `SELECT t.transaction_id, t.user_id, t.account_id, t.savings_acc_id, t.category_id, 
              t.payment_id, t.amount, t.transaction_type, t.date, t.notes,
              a.account_name, c.category_name, pm.method_name
       FROM \`Transaction\` t
       LEFT JOIN Account a ON t.account_id = a.account_id
       LEFT JOIN Category c ON t.category_id = c.category_id
       LEFT JOIN payment_method pm ON t.payment_id = pm.payment_id
       WHERE t.user_id = ?
       ORDER BY t.date DESC`,
      [userId]
    );

    for (const transaction of transactions) {
      const [tagRows] = await connection.query(
        `SELECT tag.tag_id, tag.tag_nameint AS tag_name
         FROM Tag tag
         JOIN Transaction_Tag tt ON tag.tag_id = tt.tag_id
         WHERE tt.transaction_id = ?`,
        [transaction.transaction_id]
      );

      transaction.tags = tagRows.map((tag) => tag.tag_name);
      transaction.amount = parseFloat(transaction.amount);
      transaction.date = transaction.date
        ? new Date(transaction.date).toISOString()
        : null;
    }

    return res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const {
    account_id,
    category_id,
    payment_id = 1,
    amount,
    transaction_type,
    date,
    notes = '',
    tags = []
  } = req.body || {};

  if (!category_id || !amount || !transaction_type || !date) {
    return res
      .status(400)
      .json({ error: 'Category, amount, type, and date are required' });
  }

  if (!['Income', 'Expense'].includes(transaction_type)) {
    return res
      .status(400)
      .json({ error: 'Transaction type must be Income or Expense' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [maxRows] = await connection.query(
      'SELECT MAX(transaction_id) AS maxId FROM `Transaction`'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query(
      `INSERT INTO \`Transaction\` (transaction_id, user_id, account_id, savings_acc_id, category_id, 
                                   payment_id, amount, transaction_type, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        userId,
        account_id || null,
        null,
        category_id,
        payment_id,
        amount,
        transaction_type,
        date,
        notes
      ]
    );

    if (account_id) {
      const balanceSql =
        transaction_type === 'Income'
          ? 'UPDATE Account SET balance = balance + ? WHERE account_id = ?'
          : 'UPDATE Account SET balance = balance - ? WHERE account_id = ?';
      await connection.query(balanceSql, [amount, account_id]);
    }

    for (const tagName of tags) {
      const normalizedTag = (tagName || '').toLowerCase().trim();
      if (!normalizedTag) continue;

      const [tagRows] = await connection.query(
        'SELECT tag_id FROM Tag WHERE tag_nameint = ?',
        [normalizedTag]
      );

      let tagId;
      if (tagRows.length) {
        tagId = tagRows[0].tag_id;
      } else {
        const [tagMaxRows] = await connection.query(
          'SELECT MAX(tag_id) AS maxId FROM Tag'
        );
        tagId = ((tagMaxRows[0] && tagMaxRows[0].maxId) || 0) + 1;
        await connection.query(
          'INSERT INTO Tag (tag_id, tag_nameint) VALUES (?, ?)',
          [tagId, normalizedTag]
        );
      }

      await connection.query(
        'INSERT IGNORE INTO Transaction_Tag (transaction_id, tag_id) VALUES (?, ?)',
        [nextId, tagId]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction_id: nextId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Create transaction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.headers['x-user-id'];
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [transactionRows] = await connection.query(
      `SELECT account_id, amount, transaction_type 
       FROM \`Transaction\`
       WHERE transaction_id = ? AND user_id = ?`,
      [transactionId, userId]
    );

    if (!transactionRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { account_id, amount, transaction_type } = transactionRows[0];

    if (account_id) {
      const balanceSql =
        transaction_type === 'Income'
          ? 'UPDATE Account SET balance = balance - ? WHERE account_id = ?'
          : 'UPDATE Account SET balance = balance + ? WHERE account_id = ?';
      await connection.query(balanceSql, [amount, account_id]);
    }

    await connection.query(
      'DELETE FROM Transaction_Tag WHERE transaction_id = ?',
      [transactionId]
    );

    await connection.query(
      'DELETE FROM `Transaction` WHERE transaction_id = ? AND user_id = ?',
      [transactionId, userId]
    );

    await connection.commit();

    return res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Delete transaction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


