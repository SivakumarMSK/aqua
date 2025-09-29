import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { hasUserChosenPlan, hasActivePaidSubscriptionSync, getCurrentPlan } from '../utils/subscriptionUtils';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load remembered email and checkbox state on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedState = localStorage.getItem('rememberMe') === 'true';
    if (rememberedEmail && rememberedState) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const response = await fetch("/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok && data.access_token) {
        // ✅ Store JWT and remember email if selected
        if (rememberMe) {
          localStorage.setItem("authToken", data.access_token);
          localStorage.setItem("rememberedEmail", normalizedEmail);
          localStorage.setItem("rememberMe", "true");
        } else {
          sessionStorage.setItem("authToken", data.access_token);
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberMe");
        }

        // Show success toast and navigate
        setToast({
          show: true,
          message: "Login successful! Welcome back.",
          type: "success"
        });

        // Navigate after a short delay
        setTimeout(async () => {
          try {
            // Get the actual current plan from API
            const actualPlan = await getCurrentPlan();
            localStorage.setItem("currentPlan", actualPlan);
            
            // Check if user has already chosen a plan OR has an active paid subscription
            if (hasUserChosenPlan() || hasActivePaidSubscriptionSync()) {
              // Returning user or paid user - go directly to dashboard
              navigate("/dashboard");
            } else {
              // New user with no plan chosen - go to plans page to choose plan
              navigate("/plans");
            }
          } catch (error) {
            console.error('Error checking plan status:', error);
            // Fallback: if user has chosen plan before, go to dashboard, otherwise plans
            if (hasUserChosenPlan()) {
              navigate("/dashboard");
            } else {
              navigate("/plans");
            }
          }
        }, 500);
      } else {
        const errorMessage = data.message || "Invalid credentials";
        setError(errorMessage);
        setToast({
          show: true,
          message: errorMessage,
          type: "error"
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = "Server error, please try again later.";
      setError(errorMessage);
      setToast({
        show: true,
        message: errorMessage,
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={7000} // Longer duration for login messages
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="login-card">
        <div className="login-header">
          <img src="/aqua-logo.jpg" alt="Aqua Logo" className="login-logo" />
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue to Aqua</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              className="login-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="login-row-between">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            <a href="#!" className="forgot-password">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-signup-text">
          Don't have an account?{" "}
          <a
            href="#!"
            className="signup-link"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
