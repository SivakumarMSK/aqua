import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiBriefcase, FiHome, FiMapPin } from 'react-icons/fi';
import 'animate.css';
import '../styles/SignupPage.css';

const countryPhoneRules = {
  AU: { code: '+61', digits: 9, name: 'Australia' },
  US: { code: '+1', digits: 10, name: 'United States' },
  UK: { code: '+44', digits: 10, name: 'United Kingdom' },
  IN: { code: '+91', digits: 10, name: 'India' },
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    country: 'AU',
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
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked,
    });
    // Clear error when user interacts with form
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const { email, phone, password, confirmPassword, termsAccepted, country, postalCode } = formData;

    // Validate postal code - must be exactly 4 digits
    const postalCodeRegex = /^\d{4}$/;
    if (!postalCodeRegex.test(postalCode)) {
      return 'Postal code must be exactly 4 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';

    const countryRule = countryPhoneRules[country];
    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length !== countryRule.digits) {
      return `Phone number should contain ${countryRule.digits} digits (excluding the country code).`;
    }
    const fullPhone = `${countryRule.code}${sanitizedPhone}`;
    const escapedCode = countryRule.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phoneRegex = new RegExp(`^${escapedCode}\\d{${countryRule.digits}}$`);

    if (!phoneRegex.test(fullPhone)) {
      return `Please enter a valid phone number for ${countryRule.name} (${countryRule.code} followed by ${countryRule.digits} digits).`;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password))
      return 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.';

    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!termsAccepted) return 'You must agree to the Terms and Privacy Policy.';

    return '';
  };

  // Function to scroll to error message smoothly
  const scrollToError = () => {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
      errorElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add a subtle highlight effect
      errorElement.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        errorElement.style.animation = '';
      }, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      // Scroll to error message after a brief delay to ensure it's rendered
      setTimeout(() => {
        scrollToError();
      }, 100);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch("/backend/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: (formData.email || '').trim().toLowerCase()
        }), // ✅ normalized email
      });

      const data = await response.json();
      
      // Debug: Log the response to understand the structure
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
          // Clear any existing data before storing new user profile
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem("userProfile", JSON.stringify({
            ...formData,
            email: (formData.email || '').trim().toLowerCase()
          }));
          navigate('/login');
        });
      } else {
        // Extract the actual error message from the response
        let errorMessage = 'Something went wrong. Please try again.';
        
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors) {
          // Handle validation errors array
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join(', ');
          } else if (typeof data.errors === 'object') {
            errorMessage = Object.values(data.errors).join(', ');
          } else {
            errorMessage = data.errors;
          }
        } else if (data.details) {
          errorMessage = data.details;
        }
        
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
          // Center the modal and make it more prominent
          position: 'center',
          allowOutsideClick: false,
          allowEscapeKey: true,
          // Auto focus on the confirm button
          focusConfirm: true,
          // Make it scrollable if content is long
          scrollbarPadding: false,
        });
      }
    } catch (err) {
      let errorMessage = 'Failed to connect to the server. Please try again later.';
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
            <input
              type="text"
              className="login-input"
              placeholder="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              className="login-input"
              placeholder="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group phone-group">
            {/* <FiPhone className="input-icon" /> */}
            <select
              className="form-control country-select"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
            >
              {Object.entries(countryPhoneRules).map(([code, rule]) => (
                <option key={code} value={code}>
                  {rule.name} ({rule.code})
                </option>
              ))}
            </select>
            <input
              type="text"
              className="form-control phone-input"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="login-input"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <FiBriefcase className="input-icon" />
            <input
              type="text"
              className="login-input"
              placeholder="Company Name (optional)"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <FiHome className="input-icon" />
            <input
              type="text"
              className="login-input"
              placeholder="Address Line 1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FiHome className="input-icon" />
            <input
              type="text"
              className="login-input"
              placeholder="Address Line 2 (optional)"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <FiMapPin className="input-icon" />
            <input
              type="text"
              className="login-input"
              placeholder="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FiMapPin className="input-icon" />
            <select
              className="login-input"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            >
              <option value="">Select State</option>
              <option value="NSW">New South Wales</option>
              <option value="VIC">Victoria</option>
              <option value="QLD">Queensland</option>
            </select>
          </div>

          <div className="input-group">
            <FiMapPin className="input-icon" />
            <input
              type="text"
              className="login-input"
              placeholder="Postal Code (4 digits)"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              pattern="\d{4}"
              maxLength={4}
              title="Please enter exactly 4 digits"
              required
            />
          </div>

          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleCheckboxChange}
              required
            />
            <label className="form-check-label">
              I agree to the <a href="/terms">Terms & Conditions</a> and{' '}
              <a href="/privacy">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary signup-btn"
            disabled={isSubmitting}
          >
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
