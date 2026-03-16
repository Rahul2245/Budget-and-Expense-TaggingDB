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
      'SELECT payment_id, method_name FROM payment_method'
    );

    return res.json(rows);
  } catch (error) {
    console.error('Get payment methods error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


