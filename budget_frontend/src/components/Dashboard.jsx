import React from 'react';

// In a real app, you'd import icons (e.g., from react-icons)
// For this demo, we'll use simple text/emoji.

const Dashboard = () => {
  return (
    <div className="dashboard-grid">
      {/* Total Expenses (from Transaction table) */}
      <div className="widget expenses-widget">
        <p>Total Expenses</p>
        <h3>$ 1,220.00</h3>
        <div className="widget-footer">
          <span>-12%</span>
          <p>This month</p>
        </div>
      </div>

      {/* Analytics Chart (visualizing Transaction data) */}
      <div className="widget analytics-widget">
        <div className="analytics-header">
          <h4>Analytics</h4>
          {/* You would add tabs here */}
        </div>
        {/* This is a simple placeholder for a bar chart */}
        <div className="chart-placeholder">
          <div className="bar-group">
            <div className="bar bar-revenue" style={{ height: '60%' }}></div>
            <div className="bar bar-expense" style={{ height: '40%' }}></div>
          </div>
          <div className="bar-group">
            <div className="bar bar-revenue" style={{ height: '80%' }}></div>
            <div className="bar bar-expense" style={{ height: '50%' }}></div>
          </div>
          <div className="bar-group">
            <div className="bar bar-revenue" style={{ height: '70%' }}></div>
            <div className="bar bar-expense" style={{ height: '30%' }}></div>
          </div>
          <div className="bar-group">
            <div className="bar bar-revenue" style={{ height: '90%' }}></div>
            <div className="bar bar-expense" style={{ height: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* Total Revenue (from Transaction table) */}
      <div className="widget revenue-widget">
        <p>Total Revenue</p>
        <h3>$ 8,675.00</h3>
        <div className="widget-footer">
          <span>+14%</span>
          <p>This month</p>
        </div>
      </div>

      {/* Account/Card (from Account table) */}
      <div className="widget card-widget">
        <div className="card-header">
          <span>VISA</span>
          <span>... 7402</span>
        </div>
        <div className="card-footer">
          <p>Cardholder name</p>
          <p>John Doe</p>
        </div>
      </div>

      {/* Latest Transactions (from Transaction table) */}
      <div className="widget transactions-widget">
        <h4>Latest Transactions</h4>
        <ul>
          <li>
            <div className="txn-icon success">
              <span>&#10003;</span>
            </div>
            <div className="txn-details">
              <p>Income Salary Oct</p>
              <span>Successfull</span>
            </div>
            <div className="txn-amount">+$5000</div>
          </li>
          <li>
            <div className="txn-icon expense">
              <span>&#10007;</span>
            </div>
            <div className="txn-details">
              <p>Electric Bill</p>
              <span>Successfull</span>
            </div>
            <div className="txn-amount">-$1480</div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;