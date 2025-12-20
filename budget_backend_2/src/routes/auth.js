const express = require('express');

const pool = require('../config/db');
const { hashPassword } = require('../utils/password');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password, phonenumber } = req.body || {};

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Name, email, and password are required' });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT user_id FROM USER WHERE email = ?',
      [email]
    );

    if (existing.length) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const [maxRows] = await connection.query(
      'SELECT MAX(user_id) as maxId FROM USER'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    const hashedPassword = hashPassword(password);
    const createdAt = new Date();

    await connection.query(
      'INSERT INTO USER (user_id, name, email, password, phonenumber, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [nextId, name, email, hashedPassword, phonenumber || null, createdAt]
    );

    return res.status(201).json({
      message: 'User created successfully',
      user_id: nextId
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    const hashedPassword = hashPassword(password);

    const [rows] = await connection.query(
      'SELECT user_id, name, email, phonenumber, created_at FROM USER WHERE email = ? AND password = ?',
      [email, hashedPassword]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    return res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phonenumber: user.phonenumber,
        created_at: user.created_at
          ? new Date(user.created_at).toISOString()
          : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


