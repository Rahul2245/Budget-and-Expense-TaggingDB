import React, { useState, useEffect } from 'react';
import { transactionsAPI, accountsAPI, categoriesAPI, tagsAPI, paymentMethodsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    category_id: '',
    payment_id: '',
    amount: '',
    transaction_type: 'Expense',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
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
      const [transRes, accRes, catRes, tagRes, pmRes] = await Promise.all([
        transactionsAPI.getAll(),
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
        tagsAPI.getAll(),
        paymentMethodsAPI.getAll()
      ]);
      setTransactions(transRes.data);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      setTags(tagRes.data);
      setPaymentMethods(pmRes.data);
      console.log('Categories loaded:', catRes.data);
      if (pmRes.data.length > 0 && !formData.payment_id) {
        setFormData(prev => ({ ...prev, payment_id: pmRes.data[0].payment_id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.create({
        account_id: formData.account_id || null,
        category_id: formData.category_id,
        payment_id: formData.payment_id || paymentMethods[0]?.payment_id || 1,
        amount: parseFloat(formData.amount),
        transaction_type: formData.transaction_type,
        date: formData.date,
        notes: formData.notes || '',
        tags: formData.tags
      });
      setFormData({ 
        account_id: '', 
        category_id: '', 
        payment_id: paymentMethods[0]?.payment_id || '',
        amount: '', 
        transaction_type: 'Expense', 
        date: new Date().toISOString().split('T')[0],
        notes: '',
        tags: []
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating transaction');
    }
  };

  const handleTagToggle = (tagName) => {
    if (formData.tags.includes(tagName)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagName) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tagName] });
    }
  };

  const addNewTag = async () => {
    if (newTag && !tags.some(t => t.tag_name === newTag.toLowerCase())) {
      try {
        await tagsAPI.create({ tag_name: newTag });
        setFormData({ ...formData, tags: [...formData.tags, newTag.toLowerCase()] });
        setNewTag('');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Error creating tag');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    try {
      await transactionsAPI.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting transaction');
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  const totalIncome = transactions
    .filter(t => t.transaction_type === 'Income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalExpense = transactions
    .filter(t => t.transaction_type === 'Expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Track your income and expenses with tags</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card income-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Income</h3>
            <p className="card-amount">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="summary-card expense-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="card-amount">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h2>All Transactions</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Add New Transaction</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transaction_type">Type</label>
                  <select
                    id="transaction_type"
                    value={formData.transaction_type}
                    onChange={(e) => {
                      // Reset category when type changes
                      setFormData({ ...formData, transaction_type: e.target.value, category_id: '' });
                    }}
                    required
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="account_id">Account (Optional)</label>
                  <select
                    id="account_id"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="category_id">Category</label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    disabled={categories.filter(cat => cat.category_type === formData.transaction_type).length === 0}
                  >
                    <option value="">
                      {categories.filter(cat => cat.category_type === formData.transaction_type).length === 0
                        ? `No ${formData.transaction_type} categories available`
                        : 'Select Category'}
                    </option>
                    {categories
                      .filter(cat => cat.category_type === formData.transaction_type)
                      .map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                      ))}
                  </select>
                  {categories.filter(cat => cat.category_type === formData.transaction_type).length === 0 && (
                    <small style={{ color: 'orange', display: 'block', marginTop: '4px' }}>
                      Please create a {formData.transaction_type} category first
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <input
                    type="text"
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <div className="tag-list" style={{ marginBottom: '12px' }}>
                  {tags.map(tag => (
                    <span
                      key={tag.tag_id}
                      className={`tag-item ${formData.tags.includes(tag.tag_name) ? 'active' : ''}`}
                      onClick={() => handleTagToggle(tag.tag_name)}
                      style={{ cursor: 'pointer', opacity: formData.tags.includes(tag.tag_name) ? 1 : 0.6 }}
                    >
                      {tag.tag_name}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add new tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                  />
                  <button type="button" className="btn btn-secondary btn-small" onClick={addNewTag}>
                    Add Tag
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Transaction</button>
            </form>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Notes</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.transaction_id}>
                <td>{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                <td>{transaction.account_name || 'N/A'}</td>
                <td>{transaction.category_name || 'N/A'}</td>
                <td className={transaction.amount < 0 ? 'account-balance negative' : 'account-balance positive'}>
                  ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td>{transaction.transaction_type}</td>
                <td>{transaction.notes || '-'}</td>
                <td>
                  <div className="tag-list">
                    {transaction.tags && transaction.tags.map(tag => (
                      <span key={tag} className="tag-item">{tag}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(transaction.transaction_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsPage;
