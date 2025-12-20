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
    const [rows] = await connection.query(
      `SELECT saving_acc_id, user_id, account_name, balance, interest_rate, created_at, status
       FROM Savings_account
       WHERE user_id = ?`,
      [userId]
    );

    const formatted = rows.map((account) => ({
      ...account,
      balance: parseFloat(account.balance),
      interest_rate: parseFloat(account.interest_rate),
      created_at: account.created_at ? new Date(account.created_at).toISOString() : null
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get savings accounts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const {
    account_name,
    balance = 0,
    interest_rate,
    status = 'Active'
  } = req.body || {};

  if (!account_name || interest_rate === undefined) {
    return res
      .status(400)
      .json({ error: 'Account name and interest rate are required' });
  }

  if (!['Active', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Active or Closed' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [maxRows] = await connection.query(
      'SELECT MAX(saving_acc_id) AS maxId FROM Savings_account'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query(
      `INSERT INTO Savings_account (saving_acc_id, user_id, account_name, balance, interest_rate, created_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nextId, userId, account_name, balance, interest_rate, new Date(), status]
    );

    return res.status(201).json({
      message: 'Savings account created successfully',
      saving_acc_id: nextId
    });
  } catch (error) {
    console.error('Create savings account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const userId = req.headers['x-user-id'];
  const {
    amount = 0,
    account_id: sourceAccountId,
    category_id: categoryId,
    payment_id: paymentId = 1,
    notes = ''
  } = req.body || {};

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }
  if (!sourceAccountId) {
    return res.status(400).json({ error: 'Source account is required' });
  }
  if (!categoryId) {
    return res.status(400).json({ error: 'Category is required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [savingRows] = await connection.query(
      'SELECT balance, account_name FROM Savings_account WHERE saving_acc_id = ? AND user_id = ?',
      [accountId, userId]
    );
    if (!savingRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Savings account not found' });
    }

    const [accountRows] = await connection.query(
      'SELECT balance, account_name FROM Account WHERE account_id = ? AND user_id = ?',
      [sourceAccountId, userId]
    );
    if (!accountRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Source account not found' });
    }

    if (parseFloat(accountRows[0].balance) < amount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient account balance' });
    }

    const [categoryRows] = await connection.query(
      'SELECT category_id FROM Category WHERE category_id = ? AND user_id = ?',
      [categoryId, userId]
    );
    if (!categoryRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Category not found' });
    }

    const [txRows] = await connection.query(
      'SELECT MAX(transaction_id) AS maxId FROM `Transaction`'
    );
    const nextTransactionId = ((txRows[0] && txRows[0].maxId) || 0) + 1;
    const txDate = new Date();
    const txNotes = notes || `Transfer to savings: ${savingRows[0].account_name}`;

    await connection.query(
      `INSERT INTO \`Transaction\` (
        transaction_id, user_id, account_id, savings_acc_id, category_id,
        payment_id, amount, transaction_type, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextTransactionId,
        userId,
        sourceAccountId,
        accountId,
        categoryId,
        paymentId,
        amount,
        'Expense',
        txDate,
        txNotes
      ]
    );

    await connection.query(
      'UPDATE Account SET balance = balance - ? WHERE account_id = ? AND user_id = ?',
      [amount, sourceAccountId, userId]
    );

    await connection.query(
      'UPDATE Savings_account SET balance = balance + ? WHERE saving_acc_id = ? AND user_id = ?',
      [amount, accountId, userId]
    );

    await connection.commit();

    return res.json({
      message: 'Savings account funded successfully',
      balance: parseFloat(savingRows[0].balance) + amount
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Update savings account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const userId = req.headers['x-user-id'];
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT saving_acc_id FROM Savings_account WHERE saving_acc_id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    await connection.query(
      'DELETE FROM Savings_account WHERE saving_acc_id = ? AND user_id = ?',
      [accountId, userId]
    );

    return res.json({ message: 'Savings account deleted successfully' });
  } catch (error) {
    console.error('Delete savings account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

