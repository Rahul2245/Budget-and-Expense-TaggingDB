import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await userAPI.getDashboard(userId);
        setDashboardData(response.data);
        setUserData(response.data.user);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return <div className="dashboard-page">Loading...</div>;
  }

  if (!dashboardData) {
    return <div className="dashboard-page">Error loading dashboard data</div>;
  }

  // Sample monthly data (you can enhance this to fetch real monthly data)
  const monthlyData = [
    { month: 'Jan', income: 0, expense: 0, savings: 0 },
    { month: 'Feb', income: 0, expense: 0, savings: 0 },
    { month: 'Mar', income: 0, expense: 0, savings: 0 },
    { month: 'Apr', income: 0, expense: 0, savings: 0 },
    { month: 'May', income: 0, expense: 0, savings: 0 },
    { month: 'Jun', income: dashboardData.summary.total_income, expense: dashboardData.summary.total_expense, savings: dashboardData.summary.total_savings },
  ];

  // Category data from transactions (simplified - you can enhance this)
  const categoryData = [
    { name: 'Income', value: dashboardData.summary.total_income, color: '#a8c5b2' },
    { name: 'Expense', value: dashboardData.summary.total_expense, color: '#f4a28b' },
  ];

  const accountData = dashboardData.accounts.map(acc => ({
    name: acc.account_name,
    balance: acc.balance,
    type: acc.account_type
  }));

  const budgetData = dashboardData.budgets.map(budget => ({
    category: budget.category_name,
    budget: budget.limit_amount,
    spent: budget.spent,
    percentage: budget.limit_amount > 0 ? Math.min((budget.spent / budget.limit_amount) * 100, 100) : 0
  }));

  const totalIncome = dashboardData.summary.total_income;
  const totalExpense = dashboardData.summary.total_expense;
  const totalSavings = dashboardData.summary.total_savings;
  const totalBalance = dashboardData.summary.total_balance;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {userData?.name || 'User'}!</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Income</h3>
            <p className="card-amount">${totalIncome.toLocaleString()}</p>
            <span className="card-change positive">Current period</span>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="card-amount">${totalExpense.toLocaleString()}</p>
            <span className="card-change negative">Current period</span>
          </div>
        </div>

        <div className="summary-card savings-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Total Savings</h3>
            <p className="card-amount">${totalSavings.toLocaleString()}</p>
            <span className="card-change positive">Current period</span>
          </div>
        </div>

        <div className="summary-card balance-card">
          <div className="card-icon">🏦</div>
          <div className="card-content">
            <h3>Total Balance</h3>
            <p className="card-amount">${totalBalance.toLocaleString()}</p>
            <span className="card-change">Across all accounts</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Monthly Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#a8c5b2" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#f4a28b" strokeWidth={2} />
              <Line type="monotone" dataKey="savings" stroke="#8b9dc3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accounts and Budgets Section */}
      <div className="accounts-budgets-section">
        <div className="accounts-container">
          <h3>Your Accounts</h3>
          <div className="accounts-list">
            {accountData.map((account, index) => (
              <div key={index} className="account-item">
                <div className="account-info">
                  <h4>{account.name}</h4>
                  <p>{account.type}</p>
                </div>
                <div className={`account-balance ${account.balance < 0 ? 'negative' : 'positive'}`}>
                  ${account.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="budgets-container">
          <h3>Budget Overview</h3>
          <div className="budgets-list">
            {budgetData.map((budget, index) => (
              <div key={index} className="budget-item">
                <div className="budget-header">
                  <span className="budget-category">{budget.category}</span>
                  <span className="budget-amount">${budget.spent} / ${budget.budget}</span>
                </div>
                <div className="budget-progress">
                  <div 
                    className="budget-progress-bar" 
                    style={{ width: `${budget.percentage}%` }}
                  ></div>
                </div>
                <div className="budget-percentage">{budget.percentage.toFixed(1)}% used</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="user-info-section">
        <h3>Account Information</h3>
        <div className="user-info-card">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{userData?.name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{userData?.email || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone:</span>
            <span className="info-value">{userData?.phonenumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">{userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
