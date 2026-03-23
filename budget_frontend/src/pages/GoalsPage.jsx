import React, { useState, useEffect } from 'react';
import { goalsAPI, categoriesAPI, paymentMethodsAPI, savingsAccountsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [goalContributions, setGoalContributions] = useState({});
  const [formData, setFormData] = useState({
    goal_name: '',
    target_amount: '',
    deadline: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchGoals();
    fetchMetaData();
  }, [navigate]);

  const fetchGoals = async () => {
    try {
      const response = await goalsAPI.getAll();
      setGoals(response.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await goalsAPI.create({
        goal_name: formData.goal_name,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline
      });
      setFormData({ goal_name: '', target_amount: '', deadline: '' });
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating goal');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }
    try {
      await goalsAPI.delete(id);
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting goal');
    }
  };

  const fetchMetaData = async () => {
    try {
      const [categoriesRes, paymentRes, savingsRes] = await Promise.all([
        categoriesAPI.getAll(),
        paymentMethodsAPI.getAll(),
        savingsAccountsAPI.getAll()
      ]);
      setCategories(categoriesRes.data);
      setPaymentMethods(paymentRes.data);
      setSavingsAccounts(savingsRes.data);
    } catch (err) {
      console.error('Error loading goal helpers:', err);
    }
  };

  const expenseCategories = categories.filter((cat) => cat.category_type === 'Expense');
  const defaultCategoryId = expenseCategories[0]?.category_id || '';

  const getGoalContribution = (goalId) =>
    goalContributions[goalId] || {
      amount: '',
      category_id: defaultCategoryId,
      saving_acc_id: ''
    };

  const handleContributionChange = (goalId, field, value) => {
    setGoalContributions((prev) => {
      const existing = prev[goalId] || {
        amount: '',
        category_id: defaultCategoryId,
        account_id: ''
      };
      return {
        ...prev,
        [goalId]: {
          ...existing,
          [field]: value
        }
      };
    });
  };

  const handleAddAmount = async (goal) => {
    const input = getGoalContribution(goal.goal_id);
    const parsedAmount = parseFloat(input.amount);
    const categoryId = input.category_id || defaultCategoryId;
    const savingAccId = input.saving_acc_id ? Number(input.saving_acc_id) : null;
    const paymentId = paymentMethods[0]?.payment_id || 1;

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Enter a valid amount to add to this goal.');
      return;
    }

    if (!categoryId) {
      alert('Please select an expense category to record this contribution.');
      return;
    }

    if (!savingAccId) {
      alert('Please choose a savings account to fund this goal.');
      return;
    }

    try {
      await goalsAPI.update(goal.goal_id, {
        amount: parsedAmount,
        category_id: categoryId,
        saving_acc_id: savingAccId,
        payment_id: paymentId
      });

      setGoalContributions((prev) => {
        const existing = prev[goal.goal_id] || {
          amount: '',
          category_id: defaultCategoryId,
          saving_acc_id: ''
        };
        return {
          ...prev,
          [goal.goal_id]: {
            ...existing,
            amount: ''
          }
        };
      });

      fetchGoals();
      setSavingsAccounts((await savingsAccountsAPI.getAll()).data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error recording goal contribution');
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  const getPercentage = (saved, target) => {
    if (target === 0) return 0;
    return Math.min((saved / target) * 100, 100);
  };

  const activeGoals = goals.filter(g => g.status === 'In Progress');
  const completedGoals = goals.filter(g => g.status === 'Achieved');
  const failedGoals = goals.filter(g => g.status === 'Failed');
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.saved_amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Savings Goals</h1>
        <p>Track your financial goals and progress</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Active Goals</h3>
            <p className="card-amount">{activeGoals.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Target</h3>
            <p className="card-amount">${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Total Saved</h3>
            <p className="card-amount">${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Progress</h3>
            <p className="card-amount">{totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
      </div>

      {expenseCategories.length === 0 && (
        <div className="helper-text">
          Create at least one expense category to log goal contributions as transactions.
        </div>
      )}
      {savingsAccounts.length === 0 && (
        <div className="helper-text">
          Create a savings account to transfer funds into your goals.
        </div>
      )}

      <div className="data-table">
        <div className="table-header">
          <h2>Your Goals</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Goal'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Create New Goal</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="goal_name">Goal Name</label>
                  <input
                    type="text"
                    id="goal_name"
                    value={formData.goal_name}
                    onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="target_amount">Target Amount</label>
                  <input
                    type="number"
                    id="target_amount"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Create Goal</button>
            </form>
          </div>
        )}

        {activeGoals.length > 0 && (
          <>
            <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Active Goals</h3>
            <div className="card-grid">
              {activeGoals.map((goal) => {
                const percentage = getPercentage(goal.saved_amount, goal.target_amount);
                return (
                  <div key={goal.goal_id} className="feature-card">
                    <h3>{goal.goal_name}</h3>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Saved</span>
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>
                          ${goal.saved_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="budget-progress">
                        <div 
                          className="budget-progress-bar" 
                          style={{ width: `${percentage}%`, backgroundColor: '#a8c5b2' }}
                        ></div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                        {percentage.toFixed(1)}% complete
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                      Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'N/A'}
                    </p>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-success btn-small"
                        onClick={() => handleAddAmount(goal)}
                        disabled={expenseCategories.length === 0 || savingsAccounts.length === 0}
                      >
                        Add Funds
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(goal.goal_id)}
                      >
                        Delete
                      </button>
                    </div>
                  <div className="inline-contribution">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={getGoalContribution(goal.goal_id).amount}
                      onChange={(e) =>
                        handleContributionChange(goal.goal_id, 'amount', e.target.value)
                      }
                      placeholder="Amount"
                    />
                    <select
                      value={getGoalContribution(goal.goal_id).saving_acc_id || ''}
                      onChange={(e) =>
                        handleContributionChange(goal.goal_id, 'saving_acc_id', e.target.value)
                      }
                      disabled={savingsAccounts.length === 0}
                    >
                      <option value="">Select Savings Account</option>
                      {savingsAccounts.map((account) => (
                        <option key={account.saving_acc_id} value={account.saving_acc_id}>
                          {account.account_name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={getGoalContribution(goal.goal_id).category_id || ''}
                      onChange={(e) =>
                        handleContributionChange(goal.goal_id, 'category_id', e.target.value)
                      }
                      disabled={expenseCategories.length === 0}
                    >
                      <option value="">Select Category</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {completedGoals.length > 0 && (
          <>
            <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Completed Goals</h3>
            <div className="card-grid">
              {completedGoals.map((goal) => (
                <div key={goal.goal_id} className="feature-card" style={{ opacity: 0.7 }}>
                  <h3>{goal.goal_name} ✓</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    Target: ${goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    Completed: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {failedGoals.length > 0 && (
          <>
            <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Failed Goals</h3>
            <div className="card-grid">
              {failedGoals.map((goal) => (
                <div key={goal.goal_id} className="feature-card" style={{ opacity: 0.7 }}>
                  <h3>{goal.goal_name} ✗</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    Target: ${goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {goals.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            No goals created yet. Create your first goal above!
          </p>
        )}
      </div>
    </div>
  );
};

export default GoalsPage;
