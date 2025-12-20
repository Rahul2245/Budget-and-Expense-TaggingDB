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
      'SELECT account_id, user_id, account_name, account_type, balance FROM Account WHERE user_id = ?',
      [userId]
    );

    const formatted = rows.map((account) => ({
      ...account,
      balance: parseFloat(account.balance)
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get accounts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { account_name, account_type, balance = 0 } = req.body || {};

  if (!account_name || !account_type) {
    return res
      .status(400)
      .json({ error: 'Account name and type are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [maxRows] = await connection.query(
      'SELECT MAX(account_id) AS maxId FROM Account'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query(
      'INSERT INTO Account (account_id, user_id, account_name, account_type, balance) VALUES (?, ?, ?, ?, ?)',
      [nextId, userId, account_name, account_type, balance]
    );

    return res.status(201).json({
      message: 'Account created successfully',
      account_id: nextId
    });
  } catch (error) {
    console.error('Create account error:', error);
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
      'SELECT account_id FROM Account WHERE account_id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await connection.query(
      'DELETE FROM Account WHERE account_id = ? AND user_id = ?',
      [accountId, userId]
    );

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


