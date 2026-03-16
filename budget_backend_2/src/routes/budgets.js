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
      `SELECT b.budget_id, b.user_id, b.category_id, b.limit_amount, b.start_date, b.end_date,
              c.category_name,
              COALESCE(SUM(CASE WHEN t.transaction_type = 'Expense' THEN t.amount ELSE 0 END), 0) AS spent
       FROM Budget b
       JOIN Category c ON b.category_id = c.category_id
       LEFT JOIN \`Transaction\` t ON t.category_id = b.category_id 
            AND t.user_id = b.user_id
            AND t.date >= b.start_date 
            AND t.date <= b.end_date
       WHERE b.user_id = ?
       GROUP BY b.budget_id, b.user_id, b.category_id, b.limit_amount, b.start_date, b.end_date, c.category_name`,
      [userId]
    );

    const formatted = rows.map((budget) => ({
      ...budget,
      limit_amount: parseFloat(budget.limit_amount),
      spent: parseFloat(budget.spent || 0),
      start_date: budget.start_date ? new Date(budget.start_date).toISOString() : null,
      end_date: budget.end_date ? new Date(budget.end_date).toISOString() : null
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get budgets error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { category_id, limit_amount, start_date, end_date } = req.body || {};

  if (!category_id || !limit_amount || !start_date || !end_date) {
    return res.status(400).json({
      error: 'Category, limit amount, start date, and end date are required'
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [maxRows] = await connection.query(
      'SELECT MAX(budget_id) AS maxId FROM Budget'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query(
      `INSERT INTO Budget (budget_id, user_id, category_id, limit_amount, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nextId, userId, category_id, limit_amount, start_date, end_date]
    );

    return res.status(201).json({
      message: 'Budget created successfully',
      budget_id: nextId
    });
  } catch (error) {
    console.error('Create budget error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:budgetId', async (req, res) => {
  const { budgetId } = req.params;
  const userId = req.headers['x-user-id'];

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT budget_id FROM Budget WHERE budget_id = ? AND user_id = ?',
      [budgetId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await connection.query(
      'DELETE FROM Budget WHERE budget_id = ? AND user_id = ?',
      [budgetId, userId]
    );

    return res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


