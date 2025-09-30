import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/backend/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Profile API response:', data);
          setUserProfile(data.user || data);
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/login');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 991) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
      <div className="custom-container">
        {/* Left - Brand / Home link */}
        <Link className="navbar-brand fw-semibold d-flex align-items-center gap-1" to="/">
          <img src="/aqua-logo.jpg" alt="Aqua Logo" className="navbar-logo" />
          <span>Aqua BluePrint</span>
        </Link>

        {/* Mobile toggle */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <ul className="navbar-nav mx-auto gap-lg-4 gap-2 text-center">
            <li className="nav-item">
              <NavLink className="nav-link custom-link d-flex align-items-center" to="/dashboard">
                <i className="bi bi-speedometer2 fs-4 text-primary me-2" aria-hidden="true"></i>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link custom-link d-flex align-items-center" to="/design-systems/new">
                <i className="bi bi-file-earmark-code fs-4 text-primary me-2" aria-hidden="true"></i>
                Design System
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link custom-link d-flex align-items-center" to="/all-projects">
                <i className="bi bi-briefcase fs-4 text-primary me-2" aria-hidden="true"></i>
                Projects
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link custom-link d-flex align-items-center" to="/reports">
                <i className="bi bi-bar-chart fs-4 text-primary me-2" aria-hidden="true"></i>
                Reports
              </NavLink>
            </li>
          </ul>

          <div className="nav-actions">
            <div className="profile-menu" ref={profileRef}>
              <button 
                className="profile-link" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <i className="bi bi-person-circle"></i>
              </button>
              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <i className="bi bi-person-circle"></i>
                      <div>
                        <h6>
                          {profileLoading ? (
                            <span className="loading-text">Loading...</span>
                          ) : (
                            userProfile?.full_name || userProfile?.username || 'User'
                          )}
                        </h6>
                        <span>
                          {profileLoading ? (
                            <span className="loading-text">Loading...</span>
                          ) : (
                            userProfile?.email || 'No email'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-body">
                    <Link to="/profile" className="dropdown-item">
                      <i className="bi bi-person"></i>
                      Profile Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item text-danger">
                      <i className="bi bi-box-arrow-right"></i>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-overlay" onClick={closeMobileMenu}>
            <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-nav-header">
                <img src="/aqua-logo.jpg" alt="Aqua Logo" className="mobile-nav-logo" />
                <span className="mobile-nav-title">Aqua BluePrint</span>
              </div>
              
              <ul className="mobile-nav-menu">
                <li>
                  <NavLink to="/dashboard" onClick={closeMobileMenu} className="mobile-nav-link">
                    <i className="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/design-systems/new" onClick={closeMobileMenu} className="mobile-nav-link">
                    <i className="bi bi-file-earmark-code"></i>
                    <span>Design System</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/all-projects" onClick={closeMobileMenu} className="mobile-nav-link">
                    <i className="bi bi-briefcase"></i>
                    <span>Projects</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/reports" onClick={closeMobileMenu} className="mobile-nav-link">
                    <i className="bi bi-bar-chart"></i>
                    <span>Reports</span>
                  </NavLink>
                </li>
              </ul>

              <div className="mobile-nav-footer">
                <div className="mobile-user-info">
                  <i className="bi bi-person-circle"></i>
                  <div>
                    <h6>
                      {profileLoading ? (
                        <span className="loading-text">Loading...</span>
                      ) : (
                        userProfile?.full_name || userProfile?.username || 'User'
                      )}
                    </h6>
                    <span>
                      {profileLoading ? (
                        <span className="loading-text">Loading...</span>
                      ) : (
                        userProfile?.email || 'No email'
                      )}
                    </span>
                  </div>
                </div>
                <div className="mobile-nav-actions">
                  <Link to="/profile" onClick={closeMobileMenu} className="mobile-nav-action">
                    <i className="bi bi-person"></i>
                    Profile Settings
                  </Link>
                  <button onClick={handleLogout} className="mobile-nav-action logout">
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
