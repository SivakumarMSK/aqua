import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WelcomePage.css';

const WelcomePage = () => {
    const navigate = useNavigate();
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-heading">Welcome to Aqua</h1>
        <p className="welcome-description">
          We are thrilled to have you on board. Get started by signing in or creating an account.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-primary1 welcome-btn" onClick={() => navigate('/login')} >Login</button>
          <button className="btn btn-secondary1 welcome-btn" onClick={() => navigate('/signup')}  >Signup</button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

