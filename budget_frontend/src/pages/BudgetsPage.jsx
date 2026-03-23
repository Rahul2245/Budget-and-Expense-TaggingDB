import React, { useState, useEffect } from 'react';
import { budgetsAPI, categoriesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    limit_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        budgetsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data.filter(c => c.category_type === 'Expense'));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await budgetsAPI.create({
        category_id: formData.category_id,
        limit_amount: parseFloat(formData.limit_amount),
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      setFormData({ category_id: '', limit_amount: '', start_date: new Date().toISOString().split('T')[0], end_date: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }
    try {
      await budgetsAPI.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting budget');
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  const getPercentage = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getStatus = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Budgets</h1>
        <p>Set and track your spending limits</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Active Budgets</h3>
            <p className="card-amount">{budgets.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Total Budget</h3>
            <p className="card-amount">${budgets.reduce((sum, b) => sum + b.limit_amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Total Spent</h3>
            <p className="card-amount">${budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h2>Your Budgets</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Budget'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Create New Budget</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_id">Category</label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="limit_amount">Limit Amount</label>
                  <input
                    type="number"
                    id="limit_amount"
                    step="0.01"
                    value={formData.limit_amount}
                    onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="start_date">Start Date</label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">End Date</label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Create Budget</button>
            </form>
          </div>
        )}

        <div className="budgets-list">
          {budgets.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
              No budgets created yet. Create your first budget above!
            </p>
          ) : (
            budgets.map((budget) => {
              const percentage = getPercentage(budget.spent, budget.limit_amount);
              const status = getStatus(budget.spent, budget.limit_amount);
              return (
                <div key={budget.budget_id} className="budget-item">
                  <div className="budget-header">
                    <span className="budget-category">{budget.category_name}</span>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span className="budget-amount">
                        ${budget.spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${budget.limit_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(budget.budget_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="budget-progress">
                    <div 
                      className="budget-progress-bar" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: status === 'exceeded' ? '#d9534f' : status === 'warning' ? '#f4a28b' : '#a8c5b2'
                      }}
                    ></div>
                  </div>
                  <div className="budget-percentage">
                    {percentage.toFixed(1)}% used
                    <span style={{ marginLeft: '8px', color: status === 'exceeded' ? '#d9534f' : status === 'warning' ? '#f4a28b' : '#a8c5b2' }}>
                      ({status === 'exceeded' ? 'Exceeded' : status === 'warning' ? 'Warning' : 'On Track'})
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    Period: {budget.start_date ? new Date(budget.start_date).toLocaleDateString() : 'N/A'} - {budget.end_date ? new Date(budget.end_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;
