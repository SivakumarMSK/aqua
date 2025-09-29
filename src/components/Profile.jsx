import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { changePassword } from '../services/authService';
import Toast from './Toast';
import '../styles/Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserProfile();
      setProfile(userData);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const handleEditClick = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedProfile(null);
    setIsEditing(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({
        show: true,
        message: 'New passwords do not match',
        type: 'error'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setToast({
        show: true,
        message: 'New password must be at least 6 characters long',
        type: 'error'
      });
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Close modal
      setShowPasswordModal(false);
      
      // Show success message
      setToast({
        show: true,
        message: 'Password changed successfully',
        type: 'success'
      });
    } catch (error) {
      setToast({
        show: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile = await updateUserProfile({
        full_name: editedProfile.full_name,
        email: editedProfile.email,
        phone: editedProfile.phone,
        company_name: editedProfile.company_name,
        address: editedProfile.address,
        postal_code: editedProfile.postal_code,
        country: editedProfile.country
      });
      
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditedProfile(null);
      setToast({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });
    } catch (err) {
      setToast({
        show: true,
        message: err.message,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="container">
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="container">
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container">
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
        <div className="container">
          <div className="profile-header">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h1>My Profile</h1>
              <button 
                className="btn btn-outline-danger ms-auto"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/login';
                }}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <>
                  <button className="edit-button primary" onClick={handleEditClick}>
                    <i className="bi bi-pencil me-2"></i>
                    Edit Profile
                  </button>
                  <button 
                    className="edit-button secondary"
                    onClick={() => {
                      setToast({
                        show: true,
                        message: 'Password change functionality is currently pending implementation. Please try again later.',
                        type: 'info'
                      });
                    }}
                  >
                    <i className="bi bi-key me-2"></i>
                    Change Password
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="edit-button primary" 
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    <i className="bi bi-check2 me-2"></i>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    className="edit-button secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <i className="bi bi-x me-2"></i>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-grid">
            {/* Personal Information */}
            <div className="profile-section">
              <h2>Personal Information</h2>
              <div className="profile-field">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={editedProfile?.full_name || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p>{profile?.full_name || 'Not provided'}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editedProfile?.email || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p>{profile?.email}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editedProfile?.phone || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p>{profile?.phone || 'Not provided'}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company_name"
                    value={editedProfile?.company_name || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your company name"
                  />
                ) : (
                  <p>{profile?.company_name || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="profile-section">
              <h2>Address Information</h2>
              <div className="profile-field">
                <label>Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={editedProfile?.address || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your address"
                  />
                ) : (
                  <p>{profile?.address || 'Not provided'}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Postal Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="postal_code"
                    value={editedProfile?.postal_code || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your postal code"
                  />
                ) : (
                  <p>{profile?.postal_code || 'Not provided'}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="country"
                    value={editedProfile?.country || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your country"
                  />
                ) : (
                  <p>{profile?.country || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Subscription Information */}
            <div className="profile-section">
              <h2>Subscription Details</h2>
              <div className="profile-field">
                <label>Status</label>
                <p>
                  <span className={`subscription-status ${getSubscriptionStatusClass(profile?.subscription_status)}`}>
                    {profile?.subscription_status || 'No subscription'}
                  </span>
                </p>
              </div>
              <div className="profile-field">
                <label>Type</label>
                <p>{profile?.subscription_type || 'N/A'}</p>
              </div>
              <div className="profile-field">
                <label>Start Date</label>
                <p>{formatDate(profile?.subscription_start_date)}</p>
              </div>
              <div className="profile-field">
                <label>End Date</label>
                <p>{formatDate(profile?.subscription_end_date)}</p>
              </div>
            </div>
          </form>

          {/* Password Change Modal */}
          {showPasswordModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Change Password</h3>
                  <button 
                    className="close-button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={changingPassword}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group mb-3">
                    <label>Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      required
                      disabled={changingPassword}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      required
                      disabled={changingPassword}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group mb-4">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      required
                      disabled={changingPassword}
                      minLength={6}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowPasswordModal(false)}
                      disabled={changingPassword}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={changingPassword}
                    >
                      {changingPassword ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;