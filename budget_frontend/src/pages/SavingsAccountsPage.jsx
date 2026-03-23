import React, { useState, useEffect } from 'react';
import { savingsAccountsAPI, accountsAPI, categoriesAPI, paymentMethodsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SavingsAccountsPage = () => {
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [topUpInputs, setTopUpInputs] = useState({});
  const [formData, setFormData] = useState({
    account_name: '',
    balance: '',
    interest_rate: '',
    status: 'Active'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchSavingsAccounts();
    fetchMetaData();
  }, [navigate]);

  const fetchSavingsAccounts = async () => {
    try {
      const response = await savingsAccountsAPI.getAll();
      setSavingsAccounts(response.data);
    } catch (err) {
      console.error('Error fetching savings accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await savingsAccountsAPI.create({
        account_name: formData.account_name,
        balance: parseFloat(formData.balance) || 0,
        interest_rate: parseFloat(formData.interest_rate),
        status: formData.status
      });
      setFormData({ account_name: '', balance: '', interest_rate: '', status: 'Active' });
      setShowForm(false);
      fetchSavingsAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating savings account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings account?')) {
      return;
    }
    try {
      await savingsAccountsAPI.delete(id);
      fetchSavingsAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting savings account');
    }
  };

  const fetchMetaData = async () => {
    try {
      const [accountsRes, categoriesRes, paymentRes] = await Promise.all([
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
        paymentMethodsAPI.getAll()
      ]);
      setAccounts(accountsRes.data);
      setCategories(categoriesRes.data);
      setPaymentMethods(paymentRes.data);
    } catch (err) {
      console.error('Error loading savings helpers:', err);
    }
  };

  const expenseCategories = categories.filter((cat) => cat.category_type === 'Expense');
  const defaultCategoryId = expenseCategories[0]?.category_id || '';

  const getTopUpInput = (accountId) =>
    topUpInputs[accountId] || {
      amount: '',
      category_id: defaultCategoryId,
      account_id: ''
    };

  const handleTopUpInputChange = (accountId, field, value) => {
    setTopUpInputs((prev) => {
      const existing = prev[accountId] || {
        amount: '',
        category_id: defaultCategoryId,
        account_id: ''
      };
      return {
        ...prev,
        [accountId]: {
          ...existing,
          [field]: value
        }
      };
    });
  };

  const handleAddAmount = async (account) => {
    const input = getTopUpInput(account.saving_acc_id);
    const parsedAmount = parseFloat(input.amount);
    const categoryId = input.category_id || defaultCategoryId;
    const fundingAccountId = input.account_id ? Number(input.account_id) : null;
    const paymentId = paymentMethods[0]?.payment_id || 1;

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Enter a valid amount to deposit.');
      return;
    }

    if (!categoryId) {
      alert('Please select an expense category to record this deposit.');
      return;
    }

    if (!fundingAccountId) {
      alert('Please select a bank account to fund this savings account.');
      return;
    }

    try {
      await savingsAccountsAPI.update(account.saving_acc_id, {
        amount: parsedAmount,
        category_id: categoryId,
        account_id: fundingAccountId,
        payment_id: paymentId
      });

      setTopUpInputs((prev) => {
        const existing = prev[account.saving_acc_id] || {
          amount: '',
          category_id: defaultCategoryId,
          account_id: ''
        };
        return {
          ...prev,
          [account.saving_acc_id]: {
            ...existing,
            amount: ''
          }
        };
      });

      fetchSavingsAccounts();
      fetchMetaData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error recording savings deposit');
    }
  };

  const calculateAnnualInterest = (balance, rate) => {
    return (balance * rate / 100).toFixed(2);
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  const totalBalance = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalAnnualInterest = savingsAccounts.reduce((sum, acc) => sum + parseFloat(calculateAnnualInterest(acc.balance, acc.interest_rate)), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Savings Accounts</h1>
        <p>Manage your savings accounts with interest tracking</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card">
          <div className="card-icon">🏦</div>
          <div className="card-content">
            <h3>Total Accounts</h3>
            <p className="card-amount">{savingsAccounts.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Balance</h3>
            <p className="card-amount">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Annual Interest</h3>
            <p className="card-amount">${totalAnnualInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {expenseCategories.length === 0 && (
        <div className="helper-text">
          Create at least one expense category to track savings deposits as transactions.
        </div>
      )}
      {accounts.length === 0 && (
        <div className="helper-text">
          Add a bank account before transferring funds into savings.
        </div>
      )}

      <div className="data-table">
        <div className="table-header">
          <h2>Your Savings Accounts</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Savings Account'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Add New Savings Account</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="account_name">Account Name</label>
                  <input
                    type="text"
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="balance">Initial Balance</label>
                  <input
                    type="number"
                    id="balance"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="interest_rate">Interest Rate (%)</label>
                  <input
                    type="number"
                    id="interest_rate"
                    step="0.1"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Account</button>
            </form>
          </div>
        )}

        {savingsAccounts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            No savings accounts created yet. Create your first savings account above!
          </p>
        ) : (
          <div className="card-grid">
            {savingsAccounts.map((account) => {
              const annualInterest = calculateAnnualInterest(account.balance, account.interest_rate);
              return (
                <div key={account.saving_acc_id} className="feature-card">
                  <h3>{account.account_name}</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Balance</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#a8c5b2' }}>
                        ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Interest Rate</span>
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>
                        {account.interest_rate}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Annual Interest</span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#a8c5b2' }}>
                        ${annualInterest}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Status</span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: account.status === 'Active' ? '#a8c5b2' : '#d9534f',
                        color: 'var(--color-background)'
                      }}>
                        {account.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
                      Created: {account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-success btn-small"
                      onClick={() => handleAddAmount(account)}
                      disabled={expenseCategories.length === 0 || accounts.length === 0}
                    >
                      Add Funds
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(account.saving_acc_id)}
                    >
                      Delete
                    </button>
                  </div>
                <div className="inline-contribution">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={getTopUpInput(account.saving_acc_id).amount}
                    onChange={(e) =>
                      handleTopUpInputChange(account.saving_acc_id, 'amount', e.target.value)
                    }
                    placeholder="Amount"
                  />
                  <select
                    value={getTopUpInput(account.saving_acc_id).category_id || ''}
                    onChange={(e) =>
                      handleTopUpInputChange(account.saving_acc_id, 'category_id', e.target.value)
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
                  <select
                    value={getTopUpInput(account.saving_acc_id).account_id || ''}
                    onChange={(e) =>
                      handleTopUpInputChange(account.saving_acc_id, 'account_id', e.target.value)
                    }
                    disabled={accounts.length === 0}
                  >
                    <option value="">Select Bank Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.account_id} value={acc.account_id}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsAccountsPage;
