const API_URL = 'http://13.53.148.164:5000/new_design/api';

export const createWaterQualityParameters = async (waterQualityData) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Get project_id from localStorage
    const projectId = localStorage.getItem('currentProjectId');
    if (!projectId) {
      throw new Error('Project ID not found. Please create a design system first.');
    }

    console.log('Creating water quality parameters for project:', projectId);
    const response = await fetch(`${API_URL}/projects/${projectId}/water-quality-parameters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        TAN_max: parseFloat(waterQualityData.maxTAN),
        TSS_max: parseFloat(waterQualityData.minTSS),
        dissolved_CO2_max: parseFloat(waterQualityData.maxCO2),
        dissolved_O2_min: parseFloat(waterQualityData.minDO),
        elevation_m: parseFloat(waterQualityData.siteElevation || 0),
        ph: parseFloat(waterQualityData.ph),
        salinity: parseFloat(waterQualityData.salinity),
        species: waterQualityData.targetSpecies,
        temperature: parseFloat(waterQualityData.waterTemp),
        use_recommended: waterQualityData.useRecommendedValues
      })
    });

    let data;
    try {
      data = await response.json();
      console.log('API Response:', data);
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      // Log the full error details
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      // Handle different error cases
      const errorMessage = data.error || data.details || response.statusText;

      switch (response.status) {
        case 403:
          throw new Error(`Access denied: ${errorMessage}`);
        case 404:
          throw new Error(`Project not found: ${errorMessage}`);
        default:
          throw new Error(`Error (${response.status}): ${errorMessage}`);
      }
    }

    // Successful response (200)
    if (!data.project_id) {
      console.warn('Response missing project_id:', data);
    }

    // Log the water quality parameters that were set
    if (data.water_quality_params) {
      console.log('Water quality parameters set:', data.water_quality_params);
    }

    return data;
  } catch (error) {
    console.error('Error creating water quality parameters:', error);
    throw error;
  }
};

export const getAllDesignSystems = async (onCachedData) => {
  // Get authentication token first
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (!token) {
    console.warn('No auth token found');
    return [];
  }

  let controller;
  let timeoutId;

  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(`${API_URL}/designs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch designs: ${response.status}`);
    }

    const data = await response.json();
    console.log('Design systems API response:', data);

    if (data && Array.isArray(data.designs)) {
      // Remove duplicates by comparing all fields
      const uniqueDesigns = data.designs.reduce((acc, current) => {
        const isDuplicate = acc.some(item => 
          (item.id === current.id) || 
          (item.design_system_name === current.design_system_name && 
           item.project_name === current.project_name)
        );
        
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Sort by created_at in descending order (newest first)
      return uniqueDesigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      console.error('Invalid API response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching design systems:', error);
    return [];
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (controller) controller.abort();
  }
};

export const createDesignSystem = async (designData) => {
  try {
    // Get authentication token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Log token details (first 20 chars only for security)
    console.log('Token found:', token.substring(0, 20) + '...');
    console.log('Token length:', token.length);

    // Validate required fields
    if (!designData.designSystemName || !designData.projectName) {
      throw new Error('Design system name and project name are required');
    }

    // Create request body exactly matching API spec
    const timestamp = new Date().toISOString();
    const designId = Date.now().toString();
    
    // Map camelCase form fields to snake_case API fields
    const requestBody = {
      id: designId,
      created_at: timestamp,
      design_id: designId,
      designSystemName: designData.designSystemName.trim(),
      projectName: designData.projectName.trim(),
      systemPurpose: (designData.systemPurpose || 'Commercial aquaculture production (monoculture)').trim(),
      systemType: (designData.systemType || 'RAS').trim(),
      targetSpecies: (designData.targetSpecies || '').trim(),
      useRecommendedValues: Boolean(designData.useRecommendedValues),
      projects: [{
        id: designId,
        created_at: timestamp,
        name: designData.projectName.trim(),
        description: `Project for ${designData.designSystemName.trim()}`,
        species_names: designData.targetSpecies || ''
      }]
    };

    console.log('Creating design system with:', requestBody);
  
    const response = await fetch(`${API_URL}/designs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Failed to create design system: ${response.status} ${response.statusText}`);
      }
      throw e;
    }

    // Log the full response for debugging
    console.log('API Response:', responseData);

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error(responseData.error || 'Missing required fields');
        case 500:
          throw new Error(responseData.error || 'Internal server error');
        default:
          throw new Error(responseData.error || `Failed to create design system: ${response.status}`);
      }
    }

    // If successful (201), the response should include design_id, project_id, and recommended values
    if (response.status === 201) {
      if (!responseData.design_id || !responseData.project_id) {
        throw new Error('Invalid response: missing design_id or project_id');
      }

      // Store the design_id and project_id for later use
      localStorage.setItem('currentDesignId', responseData.design_id);
      localStorage.setItem('currentProjectId', responseData.project_id);

      // If we have recommended values, store them too
      if (responseData.recommended_values) {
        localStorage.setItem('recommendedValues', JSON.stringify(responseData.recommended_values));
      }


      return responseData;
    }

    throw new Error('Unexpected response from server');
  } catch (error) {
    console.error('Error creating design system:', error);
    throw error;
  }
};