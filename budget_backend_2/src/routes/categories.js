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
      'SELECT category_id, user_id, category_name, category_type FROM Category WHERE user_id = ?',
      [userId]
    );
    return res.json(rows);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { category_name, category_type } = req.body || {};

  if (!category_name || !category_type) {
    return res
      .status(400)
      .json({ error: 'Category name and type are required' });
  }

  if (!['Income', 'Expense'].includes(category_type)) {
    return res
      .status(400)
      .json({ error: 'Category type must be Income or Expense' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [maxRows] = await connection.query(
      'SELECT MAX(category_id) AS maxId FROM Category'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query(
      'INSERT INTO Category (category_id, user_id, category_name, category_type) VALUES (?, ?, ?, ?)',
      [nextId, userId, category_name, category_type]
    );

    return res.status(201).json({
      message: 'Category created successfully',
      category_id: nextId
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  const userId = req.headers['x-user-id'];

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT category_id FROM Category WHERE category_id = ? AND user_id = ?',
      [categoryId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await connection.query(
      'DELETE FROM Category WHERE category_id = ? AND user_id = ?',
      [categoryId, userId]
    );

    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


