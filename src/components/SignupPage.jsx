import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiBriefcase, FiHome, FiMapPin } from 'react-icons/fi';
import 'animate.css';
import '../styles/SignupPage.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    termsAccepted: false,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked,
    });
    if (error) setError('');
  };

  const validateForm = () => {
    const { email, phone, password, confirmPassword, termsAccepted, postalCode } = formData;

    // AU postal code: exactly 4 digits
    const postalCodeRegex = /^\d{4}$/;
    if (!postalCodeRegex.test(postalCode)) return 'Postal code must be exactly 4 digits.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';

    // Temporary relaxed Australia phone validation (backend will enforce formatting later):
    // Accept any spacing/characters, validate digits only: 10 digits and starts with 04 (mobile)
    // or 02/03/07/08 (landline)
    const digits = (phone || '').replace(/\D/g, '');
    const isTenDigits = digits.length === 10;
    const hasValidPrefix = /^04/.test(digits) || /^(02|03|07|08)/.test(digits);
    if (!(isTenDigits && hasValidPrefix)) {
      return 'Please enter a valid Australian phone number (10 digits starting with 04, 02, 03, 07 or 08).';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) return 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.';

    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!termsAccepted) return 'You must agree to the Terms and Privacy Policy.';

    return '';
  };

  const scrollToError = () => {
    const el = document.querySelector('.error-message');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => { el.style.animation = ''; }, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setTimeout(scrollToError, 100);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch("/backend/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: (formData.email || '').trim().toLowerCase(),
          // Hardcode country while backend transitions away from it
          country: 'AU'
        }),
      });

      const data = await response.json();
      console.log('Signup response:', { status: response.status, data });

      if (response.ok) {
        Swal.fire({
          title: 'Account Created!',
          text: data.message || 'Your account has been created successfully. Please check your email to verify.',
          icon: 'success',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#0059FF',
          background: '#f0f9ff',
          color: '#333',
          showClass: { popup: 'animate__animated animate__fadeInDown' },
          hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        }).then(() => {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem("userProfile", JSON.stringify({
            ...formData,
            email: (formData.email || '').trim().toLowerCase()
          }));
          navigate('/login');
        });
      } else {
        let errorMessage = 'Something went wrong. Please try again.';
        if (data.message) errorMessage = data.message;
        else if (data.error) errorMessage = data.error;
        else if (data.errors) {
          if (Array.isArray(data.errors)) errorMessage = data.errors.join(', ');
          else if (typeof data.errors === 'object') errorMessage = Object.values(data.errors).join(', ');
          else errorMessage = data.errors;
        } else if (data.details) errorMessage = data.details;

        Swal.fire({
          title: 'Signup Failed',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
          background: '#f8f9fa',
          color: '#333',
          showClass: { popup: 'animate__animated animate__fadeInDown' },
          hideClass: { popup: 'animate__animated animate__fadeOutUp' },
          position: 'center',
          allowOutsideClick: false,
          allowEscapeKey: true,
          focusConfirm: true,
          scrollbarPadding: false,
        });
      }
    } catch (err) {
      let errorMessage = 'Failed to connect to the server. Please try again later.';
      if (err.name === 'TypeError' && err.message.includes('fetch')) errorMessage = 'Network error. Please check your internet connection and try again.';
      else if (err.message) errorMessage = err.message;

      Swal.fire({
        title: 'Connection Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545',
        background: '#f8f9fa',
        color: '#333',
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        position: 'center',
        allowOutsideClick: false,
        allowEscapeKey: true,
        focusConfirm: true,
        scrollbarPadding: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <img src="/aqua-logo.jpg" alt="Aqua Logo" className="signup-logo" />
          <h1 className="signup-heading">Create Your Account</h1>
          <p className="signup-subtitle">Join Aqua and start managing your aquaculture projects</p>
        </div>
        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            <strong>⚠️ {error}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input type="text" className="login-input" placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" className="login-input" placeholder="Email Address" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <FiPhone className="input-icon" />
            <input type="text" className="login-input" name="phone" placeholder="Mobile or landline number" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input type={showPassword ? "text" : "password"} className="login-input" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input type={showConfirmPassword ? "text" : "password"} className="login-input" placeholder="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <FiBriefcase className="input-icon" />
            <input type="text" className="login-input" placeholder="Company Name (optional)" name="companyName" value={formData.companyName} onChange={handleChange} />
          </div>

          <div className="input-group">
            <FiHome className="input-icon" />
            <input type="text" className="login-input" placeholder="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <FiHome className="input-icon" />
            <input type="text" className="login-input" placeholder="Address Line 2 (optional)" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
          </div>

          <div className="input-group">
            <FiMapPin className="input-icon" />
            <input type="text" className="login-input" placeholder="City" name="city" value={formData.city} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <FiMapPin className="input-icon" />
            <select className="login-input" name="state" value={formData.state} onChange={handleChange} required>
              <option value="">Select State/Territory</option>
              <option value="NSW">New South Wales</option>
              <option value="VIC">Victoria</option>
              <option value="QLD">Queensland</option>
              <option value="WA">Western Australia</option>
              <option value="SA">South Australia</option>
              <option value="TAS">Tasmania</option>
              <option value="ACT">Australian Capital Territory</option>
              <option value="NT">Northern Territory</option>
            </select>
          </div>

          <div className="input-group">
            <FiMapPin className="input-icon" />
            <input type="text" className="login-input" placeholder="Postal Code (4 digits)" name="postalCode" value={formData.postalCode} onChange={handleChange} pattern="\d{4}" maxLength={4} title="Please enter exactly 4 digits" required />
          </div>

          <div className="form-check mb-2">
            <input type="checkbox" className="form-check-input" name="termsAccepted" checked={formData.termsAccepted} onChange={handleCheckboxChange} required />
            <label className="form-check-label">
              I agree to the <a href="/terms">Terms & Conditions</a> and{' '}<a href="/privacy">Privacy Policy</a>
            </label>
          </div>

          <button type="submit" className="btn btn-primary signup-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="login-link-row" style={{ marginTop: 8, gap: 8 }}>
          <span>Already have an account?</span>
          <a href="/login" className="login-link" onClick={() => navigate('/login')}>
            Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
