// Authentication service functions

export const logout = () => {
  // Clear all auth-related data
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('rememberedEmail');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('currentPlan');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('currentDesignId');
  localStorage.removeItem('currentProjectId');
  localStorage.removeItem('recommendedValues');
};

export const isAuthenticated = () => {
  return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch('http://13.53.148.164:5000/auth/profile/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error cases
      switch (response.status) {
        case 401:
          throw new Error(data.error || 'Unauthorized - Please log in again');
        case 501:
          throw new Error('Password change functionality is not available yet. Please try again later.');
        default:
          throw new Error(data.error || 'Failed to change password');
      }
    }

    return data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};