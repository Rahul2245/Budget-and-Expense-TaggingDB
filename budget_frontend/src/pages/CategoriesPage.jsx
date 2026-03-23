import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_name: '',
    category_type: 'Expense'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await categoriesAPI.create({
        category_name: formData.category_name,
        category_type: formData.category_type
      });
      setFormData({ category_name: '', category_type: 'Expense' });
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    try {
      await categoriesAPI.delete(id);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting category');
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  const expenseCategories = categories.filter(c => c.category_type === 'Expense');
  const incomeCategories = categories.filter(c => c.category_type === 'Income');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Categories</h1>
        <p>Manage your income and expense categories</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card">
          <div className="card-icon">📁</div>
          <div className="card-content">
            <h3>Total Categories</h3>
            <p className="card-amount">{categories.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Expense Categories</h3>
            <p className="card-amount">{expenseCategories.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Income Categories</h3>
            <p className="card-amount">{incomeCategories.length}</p>
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h2>Your Categories</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Category'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Add New Category</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_name">Category Name</label>
                  <input
                    type="text"
                    id="category_name"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="category_type">Category Type</label>
                  <select
                    id="category_type"
                    value={formData.category_type}
                    onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    required
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Category</button>
            </form>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>Expense Categories</h3>
          <div className="card-grid">
            {expenseCategories.map((category) => (
              <div key={category.category_id} className="feature-card">
                <h3>{category.category_name}</h3>
                <p>Type: {category.category_type}</p>
                <div className="action-buttons">
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(category.category_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>Income Categories</h3>
          <div className="card-grid">
            {incomeCategories.map((category) => (
              <div key={category.category_id} className="feature-card">
                <h3>{category.category_name}</h3>
                <p>Type: {category.category_type}</p>
                <div className="action-buttons">
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(category.category_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
