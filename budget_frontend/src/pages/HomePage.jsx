import React from 'react';
import Hero from '../components/Hero'; // Note: '../' to go up one level

const HomePage = () => {
  return (
    // The Header and Footer will be handled by the layout in App.jsx
    <Hero />
  );
};

export default HomePage;