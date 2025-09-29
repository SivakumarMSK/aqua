const API_URL = 'http://13.53.148.164:5000/species/api';

export const getRecommendedValues = async (speciesName) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log('Fetching recommended values for species:', speciesName);
    const response = await fetch(`${API_URL}/species/${encodeURIComponent(speciesName)}/recommended-values`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    let data;
    try {
      data = await response.json();
      console.log('Raw API response:', data);
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error('Invalid response format from server');
    }
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      }
      if (response.status === 404) {
        throw new Error('Species not found');
      }
      throw new Error(data.error || `Failed to fetch recommended values: ${response.status} ${response.statusText}`);
    }

    // Validate response format
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: empty or invalid data');
    }

    if (!data.species_parameters && !data.common_parameters) {
      throw new Error('Invalid response format: missing required parameters');
    }

    console.log('Validated recommended values:', data);
    return data;
  } catch (error) {
    console.error('Error fetching recommended values:', error);
    throw error;
  }
};

export const getSpecies = async (filters = {}) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (filters.species_type) {
      queryParams.append('species_type', filters.species_type);
    }
    if (filters.search) {
      queryParams.append('search', filters.search);
    }

    const response = await fetch(`${API_URL}/species${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      }
      throw new Error(`Failed to fetch species data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.species || [];
  } catch (error) {
    console.error('Error fetching species:', error);
    throw error;
  }
};