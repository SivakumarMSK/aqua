const API_URL = 'http://13.53.148.164:5000/auth';

export const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error('Unauthorized access. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Profile not found.');
      }
      if (response.status === 400) {
        throw new Error(errorData.details || 'Invalid profile data.');
      }
      throw new Error('Failed to update profile.');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized access. Please login again.');
      }
      if (response.status === 404) {
        throw new Error('Profile not found.');
      }
      throw new Error('Failed to fetch profile data.');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    throw error;
  }
};
