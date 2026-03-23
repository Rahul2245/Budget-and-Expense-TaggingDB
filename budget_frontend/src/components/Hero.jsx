import React from 'react';
import Dashboard from './Dashboard';

const Hero = () => {
  return (
    <main className="hero-section">
      <div className="hero-text">
        <h1>Manage Your Expenses Easily With Xpenso</h1>
        <p>
          Lorem ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary">Let's Talk</button>
          <button className="btn btn-secondary">View Demo</button>
        </div>
      </div>
      <div className="hero-dashboard">
        <Dashboard />
      </div>
    </main>
  );
};

export default Hero;