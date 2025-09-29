// Base API URL
const API_URL = 'http://13.53.148.164:5000/auth';

// Test if the API is accessible
const testApiConnection = async () => {
  try {
    // Test the subscription endpoint with a minimal POST request
    const testUrl = `${API_URL}/subscription`;
    console.log('Testing API connection to:', testUrl);
    
    // Get the token for authentication
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      return {
        ok: false,
        status: 401,
        message: 'No authentication token found. Please log in first.'
      };
    }
    
    // Send a minimal test subscription request
    const testData = {
      payment_amount: 0.01,
      payment_method: "credit_card",
      subscription_type: "30"
    };
    
    console.log('Sending test request with data:', testData);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(testData)
    });

    const responseData = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    console.log('API Test Response:', responseData);

    try {
      const data = await response.json();
      console.log('Response body:', data);
      
      // Return detailed test results
      return {
        ok: response.ok,
        status: response.status,
        message: data.message || data.error || data.details || response.statusText,
        data: data
      };
    } catch (e) {
      return {
        ok: response.ok,
        status: response.status,
        message: `Server responded with status ${response.status} (${response.statusText})`
      };
    }
  } catch (error) {
    console.error('API Connection Test Details:', {
      error: error.message,
      type: error.name,
      stack: error.stack
    });
    
    return {
      ok: false,
      status: 0,
      message: 'Failed to connect to the server. Please check your internet connection.'
    };
  }
};

// Export the test function
export { testApiConnection };

// Get current subscription status
export const getCurrentSubscription = async () => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    console.log('🔍 Debug - Calling real subscription API');
    console.log('🔍 Debug - Token:', token.substring(0, 20) + '...');
    console.log('🔍 Debug - API URL:', `${API_URL}/subscription`);

    const response = await fetch(`${API_URL}/subscription`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      mode: 'cors',
      cache: 'no-cache'
    });

    console.log('🔍 Debug - Response status:', response.status);
    console.log('🔍 Debug - Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Log the response body for debugging
      const responseText = await response.text();
      console.log('🔍 Debug - Error response body:', responseText);
      
      // Gracefully treat 404 (no subscription) and 500 (server issue) as no active subscription
      if (response.status === 404 || response.status === 500) {
        console.log('🔍 Debug - Treating as no subscription due to status:', response.status);
        return null;
      }

      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.details || 'Failed to get subscription';
      } catch (e) {
        errorMessage = `Subscription check failed: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    console.log('🔍 Debug - Success response body:', responseText);
    
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    console.log('🔍 Debug - Creating real subscription via API');
    console.log('🔍 Debug - Subscription data:', subscriptionData);

    // Real API call to create subscription
    const response = await fetch(`${API_URL}/subscription`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(subscriptionData)
    });

    console.log('🔍 Debug - POST Response status:', response.status);
    console.log('🔍 Debug - POST Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Log the response body for debugging
      const responseText = await response.text();
      console.log('🔍 Debug - POST Error response body:', responseText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.details || 'Failed to create subscription';
      } catch (e) {
        errorMessage = `Subscription failed: ${response.statusText}`;
      }

      // Handle specific error cases
      switch (response.status) {
        case 400:
          throw new Error('Invalid subscription details. Please check your payment information.');
        case 401:
          throw new Error('Your session has expired. Please log in again.');
        case 403:
          throw new Error('You do not have permission to access this service.');
        case 404:
          throw new Error('User not found. Please try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(errorMessage);
      }
    }

    const responseText = await response.text();
    console.log('🔍 Debug - POST Success response body:', responseText);
    
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw error;
  }
};
