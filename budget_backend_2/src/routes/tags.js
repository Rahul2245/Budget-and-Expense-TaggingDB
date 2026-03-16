const express = require('express');

const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT tag_id, tag_nameint AS tag_name FROM Tag'
    );
    return res.json(rows);
  } catch (error) {
    console.error('Get tags error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const tagName = (req.body?.tag_name || '').toLowerCase().trim();

  if (!tagName) {
    return res.status(400).json({ error: 'Tag name is required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT tag_id FROM Tag WHERE tag_nameint = ?',
      [tagName]
    );
    if (existing.length) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    const [maxRows] = await connection.query(
      'SELECT MAX(tag_id) AS maxId FROM Tag'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query('INSERT INTO Tag (tag_id, tag_nameint) VALUES (?, ?)', [
      nextId,
      tagName
    ]);

    return res.status(201).json({
      message: 'Tag created successfully',
      tag_id: nextId
    });
  } catch (error) {
    console.error('Create tag error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:tagId', async (req, res) => {
  const { tagId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT tag_id FROM Tag WHERE tag_id = ?',
      [tagId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await connection.query(
      'DELETE FROM Transaction_Tag WHERE tag_id = ?',
      [tagId]
    );
    await connection.query('DELETE FROM Tag WHERE tag_id = ?', [tagId]);

    return res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


