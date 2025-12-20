const express = require('express');

const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  let connection;

  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT user_id, name, email, phonenumber, created_at FROM USER WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      ...user,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/:userId/dashboard', async (req, res) => {
  const { userId } = req.params;

  let connection;

  try {
    connection = await pool.getConnection();

    const [userRows] = await connection.query(
      'SELECT name, email, phonenumber, created_at FROM USER WHERE user_id = ?',
      [userId]
    );
    const user = userRows[0] || null;
    if (user && user.created_at) {
      user.created_at = new Date(user.created_at).toISOString();
    }

    const [totalRows] = await connection.query(
      `SELECT 
        SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END) AS total_expense
      FROM \`Transaction\`
      WHERE user_id = ?`,
      [userId]
    );
    const totals = totalRows[0] || {};

    const [accountBalanceRows] = await connection.query(
      'SELECT SUM(balance) AS total_balance FROM Account WHERE user_id = ?',
      [userId]
    );
    const [savingsBalanceRows] = await connection.query(
      "SELECT SUM(balance) AS total_savings FROM Savings_account WHERE user_id = ? AND status = 'Active'",
      [userId]
    );

    const [accountRows] = await connection.query(
      'SELECT account_id, account_name, account_type, balance FROM Account WHERE user_id = ?',
      [userId]
    );

    const [budgetRows] = await connection.query(
      `SELECT b.budget_id, c.category_name, b.limit_amount, b.start_date, b.end_date,
              COALESCE(SUM(CASE WHEN t.transaction_type = 'Expense' THEN t.amount ELSE 0 END), 0) AS spent
       FROM Budget b
       JOIN Category c ON b.category_id = c.category_id
       LEFT JOIN \`Transaction\` t ON t.category_id = b.category_id 
            AND t.user_id = b.user_id
            AND t.date >= b.start_date 
            AND t.date <= b.end_date
       WHERE b.user_id = ?
       GROUP BY b.budget_id, c.category_name, b.limit_amount, b.start_date, b.end_date`,
      [userId]
    );

    const totalIncome = parseFloat(totals.total_income || 0);
    const totalExpense = parseFloat(totals.total_expense || 0);
    const totalBalance =
      parseFloat(accountBalanceRows[0].total_balance || 0) +
      parseFloat(savingsBalanceRows[0].total_savings || 0);

    const formattedBudgets = budgetRows.map((budget) => ({
      ...budget,
      limit_amount: parseFloat(budget.limit_amount),
      spent: parseFloat(budget.spent || 0),
      start_date: budget.start_date ? new Date(budget.start_date).toISOString() : null,
      end_date: budget.end_date ? new Date(budget.end_date).toISOString() : null
    }));

    const formattedAccounts = accountRows.map((account) => ({
      ...account,
      balance: parseFloat(account.balance)
    }));

    return res.json({
      user,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        total_savings: totalIncome - totalExpense,
        total_balance: totalBalance
      },
      accounts: formattedAccounts,
      budgets: formattedBudgets
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


