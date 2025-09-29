import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

        const response = await fetch('http://13.53.148.164:5000/auth/profile', {
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
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
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Center Links - Top-level links without icons for minimal Apple-like design */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-lg-4 gap-2 text-center">
            {/* Dashboard Section */}
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

            {/* Projects Section */}
            <li className="nav-item">
              <NavLink className="nav-link custom-link d-flex align-items-center" to="/all-projects">
                <i className="bi bi-briefcase fs-4 text-primary me-2" aria-hidden="true"></i>
                Projects
              </NavLink>
            </li>

            {/* Reports Section */}
            <li className="nav-item">
              <NavLink className="nav-link custom-link d-flex align-items-center" to="/reports">
                <i className="bi bi-bar-chart fs-4 text-primary me-2" aria-hidden="true"></i>
                Reports
              </NavLink>
            </li>
          </ul>

          {/* Right - Actions */}
          <div className="nav-actions">
            {/* Upgrade Plan Button */}
           {/*  <Link to="/plans" className="upgrade-btn">
              <i className="bi bi-star-fill me-1"></i>
              Upgrade Plan
            </Link> */}
            
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
      </div>
    </nav>
  );
};

export default Navbar;
