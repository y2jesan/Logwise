import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Initialize theme from localStorage before rendering
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.classList.remove('light', 'dark');
document.documentElement.classList.add(savedTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

