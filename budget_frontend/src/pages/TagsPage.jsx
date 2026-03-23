import React, { useState, useEffect } from 'react';
import { tagsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TagsPage = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tag_name: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchTags();
  }, [navigate]);

  const fetchTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tagsAPI.create({
        tag_name: formData.tag_name.toLowerCase().trim()
      });
      setFormData({ tag_name: '' });
      setShowForm(false);
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating tag');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) {
      return;
    }
    try {
      await tagsAPI.delete(id);
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting tag');
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tags</h1>
        <p>Manage tags for organizing your transactions</p>
      </div>

      <div className="summary-cards" style={{ marginBottom: '40px' }}>
        <div className="summary-card">
          <div className="card-icon">🏷️</div>
          <div className="card-content">
            <h3>Total Tags</h3>
            <p className="card-amount">{tags.length}</p>
          </div>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h2>Your Tags</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Tag'}
          </button>
        </div>

        {showForm && (
          <div className="form-section">
            <h3>Add New Tag</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tag_name">Tag Name</label>
                  <input
                    type="text"
                    id="tag_name"
                    value={formData.tag_name}
                    onChange={(e) => setFormData({ ...formData, tag_name: e.target.value })}
                    placeholder="e.g., groceries, bills, salary"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Tag</button>
            </form>
          </div>
        )}

        {tags.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            No tags created yet. Create your first tag above!
          </p>
        ) : (
          <>
            <div style={{ marginTop: '24px' }}>
              <div className="tag-list" style={{ gap: '12px' }}>
                {tags.map((tag) => (
                  <div key={tag.tag_id} className="tag-item" style={{ fontSize: '14px', padding: '10px 16px' }}>
                    <span>{tag.tag_name}</span>
                    <button 
                      onClick={() => handleDelete(tag.tag_id)}
                      style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 style={{ marginBottom: '16px' }}>All Tags</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tag ID</th>
                    <th>Tag Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.tag_id}>
                      <td>{tag.tag_id}</td>
                      <td>
                        <span className="tag-item">{tag.tag_name}</span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(tag.tag_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TagsPage;
