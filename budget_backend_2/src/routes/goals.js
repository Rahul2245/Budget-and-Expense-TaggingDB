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
      `SELECT goal_id, user_id, goal_name, target_amount, saved_amount, deadline, status
       FROM Goal
       WHERE user_id = ?
       ORDER BY deadline ASC`,
      [userId]
    );

    const formatted = rows.map((goal) => ({
      ...goal,
      target_amount: parseFloat(goal.target_amount),
      saved_amount: parseFloat(goal.saved_amount),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { goal_name, target_amount, deadline, status = 'In Progress' } =
    req.body || {};

  if (!goal_name || !target_amount || !deadline) {
    return res.status(400).json({
      error: 'Goal name, target amount, and deadline are required'
    });
  }

  const normalizedStatus = ['In Progress', 'Achieved', 'Failed'].includes(status)
    ? status
    : 'In Progress';

  let connection;
  try {
    connection = await pool.getConnection();
    const [maxRows] = await connection.query(
      'SELECT MAX(goal_id) AS maxId FROM Goal'
    );
    const nextId = ((maxRows[0] && maxRows[0].maxId) || 0) + 1;

    await connection.query(
      `INSERT INTO Goal (goal_id, user_id, goal_name, target_amount, saved_amount, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nextId, userId, goal_name, target_amount, 0, deadline, normalizedStatus]
    );

    return res.status(201).json({
      message: 'Goal created successfully',
      goal_id: nextId
    });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const userId = req.headers['x-user-id'];
  const {
    amount = 0,
    saving_acc_id: savingAccId,
    category_id: categoryId,
    payment_id: paymentId = 1,
    notes = ''
  } = req.body || {};

  if (!savingAccId) {
    return res.status(400).json({ error: 'Savings account is required' });
  }
  if (!categoryId) {
    return res.status(400).json({ error: 'Category is required' });
  }
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [goalRows] = await connection.query(
      'SELECT goal_name, saved_amount, target_amount, deadline FROM Goal WHERE goal_id = ? AND user_id = ?',
      [goalId, userId]
    );

    if (!goalRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalRows[0];
    const savedAmount = parseFloat(goal.saved_amount) || 0;
    const targetAmount = parseFloat(goal.target_amount) || 0;
    const remainingNeeded = targetAmount - savedAmount;
    if (remainingNeeded <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Goal already achieved' });
    }

    const contributionAmount = Math.min(parseFloat(amount), remainingNeeded);

    const [savingRows] = await connection.query(
      'SELECT balance FROM Savings_account WHERE saving_acc_id = ? AND user_id = ?',
      [savingAccId, userId]
    );
    if (!savingRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Savings account not found' });
    }
    if (parseFloat(savingRows[0].balance) < contributionAmount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient savings account balance' });
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
    const txNotes = notes || `Goal contribution: ${goal.goal_name}`;

    await connection.query(
      `INSERT INTO \`Transaction\` (
        transaction_id, user_id, account_id, savings_acc_id, category_id,
        payment_id, amount, transaction_type, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextTransactionId,
        userId,
        null,
        savingAccId,
        categoryId,
        paymentId,
        contributionAmount,
        'Expense',
        txDate,
        txNotes
      ]
    );

    await connection.query(
      'UPDATE Savings_account SET balance = balance - ? WHERE saving_acc_id = ? AND user_id = ?',
      [contributionAmount, savingAccId, userId]
    );

    const [savingTableRows] = await connection.query(
      'SELECT MAX(saving_id) AS maxId FROM saving'
    );
    const nextSavingId = ((savingTableRows[0] && savingTableRows[0].maxId) || 0) + 1;

    await connection.query(
      `INSERT INTO saving (saving_id, goal_id, user_id, saving_acc_id, transaction_id, amount, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nextSavingId,
        goalId,
        userId,
        savingAccId,
        nextTransactionId,
        contributionAmount,
        txDate
      ]
    );

    const newSavedAmount = savedAmount + contributionAmount;

    let newStatus = 'In Progress';
    if (newSavedAmount >= targetAmount) {
      newStatus = 'Achieved';
    } else if (goal.deadline) {
      const deadlineDate = new Date(goal.deadline);
      if (new Date().setHours(0, 0, 0, 0) > deadlineDate.setHours(0, 0, 0, 0)) {
        newStatus = 'Failed';
      }
    }

    await connection.query(
      'UPDATE Goal SET saved_amount = ?, status = ? WHERE goal_id = ? AND user_id = ?',
      [newSavedAmount, newStatus, goalId, userId]
    );

    await connection.commit();

    return res.json({
      message: 'Goal funded successfully',
      saved_amount: newSavedAmount,
      status: newStatus
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Update goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const userId = req.headers['x-user-id'];

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT goal_id FROM Goal WHERE goal_id = ? AND user_id = ?',
      [goalId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await connection.query(
      'DELETE FROM Goal WHERE goal_id = ? AND user_id = ?',
      [goalId, userId]
    );

    return res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

