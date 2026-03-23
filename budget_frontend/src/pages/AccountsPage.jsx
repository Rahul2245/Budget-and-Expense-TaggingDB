import React, { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'Bank Account',
    balance: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchAccounts();
  }, [navigate]);

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAll();
      setAccounts(response.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await accountsAPI.create({
        account_name: formData.account_name,
        account_type: formData.account_type,
        balance: parseFloat(formData.balance) || 0
      });
      setFormData({ account_name: '', account_type: 'Bank Account', balance: '' });
      setShowForm(false);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }
    try {
      await accountsAPI.delete(id);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting account');
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Accounts</h1>
        <p>Manage your financial accounts</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card">
          <div className="card-icon">🏦</div>
          <div className="card-content">
            <h3>Total Accounts</h3>
            <p className="card-amount">{accounts.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Balance</h3>
            <p className="card-amount">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h2>Your Accounts</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Account'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Add New Account</h3>
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
                  <label htmlFor="account_type">Account Type</label>
                  <select
                    id="account_type"
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    required
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Investment">Investment</option>
                  </select>
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
              </div>
              <button type="submit" className="btn btn-primary">Add Account</button>
            </form>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Account Type</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.account_id}>
                <td>{account.account_name}</td>
                <td>{account.account_type}</td>
                <td className={account.balance < 0 ? 'account-balance negative' : 'account-balance positive'}>
                  ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(account.account_id)}
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

export default AccountsPage;
