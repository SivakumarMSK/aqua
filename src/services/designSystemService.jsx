const API_URL = '/backend/new_design/api';
const FORMULAS_API_URL = '/backend/formulas/api';

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
        use_recommended: Boolean(waterQualityData.useRecommendedValues),
        // type is driven by caller ('advanced' for advanced flow, otherwise defaults to 'basic')
        type: waterQualityData.type || 'basic',
        // Include production parameters required before GET calculations
        number_of_tanks: Number(waterQualityData.numTanks || 0),
        tanks_volume_each: parseFloat(waterQualityData.tankVolume || 0),
        target_feed_rate: parseFloat(waterQualityData.feedRate || 0),
        target_market_fish_size: parseFloat(waterQualityData.targetFishWeight || 0),
        target_max_stocking_density: Number(waterQualityData.targetNumFish || 0),
        feed_protein_percent: parseFloat(waterQualityData.feedProtein || 0),
        feed_conversion_ratio: parseFloat(waterQualityData.feedConversionRatio || 0),
        // Include efficiency parameters
        oxygen_injection_efficiency: parseFloat(waterQualityData.o2Absorption || 0),
        co2_removal_efficiency: parseFloat(waterQualityData.co2Removal || 0),
        tan_removal_efficiency: parseFloat(waterQualityData.tanRemoval || 0),
        tss_removal_efficiency: parseFloat(waterQualityData.tssRemoval || 0),
        supplement_pure_o2: Boolean(waterQualityData.supplementPureO2)
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

// Live production calculations (short-polling friendly)
// Allows passing an AbortSignal to cancel stale requests
export const postLiveProductionCalculations = async (projectId, payload, signal) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    if (!projectId) {
      projectId = localStorage.getItem('currentProjectId');
    }
    if (!projectId) {
      throw new Error('Project ID not found.');
    }

    const response = await fetch(`${FORMULAS_API_URL}/projects/${projectId}/production-calculations/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error || data.details || response.statusText || 'Live calculation failed';
      throw new Error(`Error (${response.status}): ${message}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Swallow abort errors; caller handles debouncing
      throw error;
    }
    console.error('postLiveProductionCalculations error:', error);
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

export const getProjectsByDesignId = async (designId) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
      console.warn('No auth token found');
      return { design_id: 0, design_name: '', projects: [], status: 'error' };
    }

    let controller;
    let timeoutId;

    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_URL}/designs/${designId}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects for design ${designId}: ${response.status}`);
      }

      const data = await response.json();
      console.log('Projects by design ID API response:', data);

      return data;
    } catch (error) {
      console.error('Error fetching projects by design ID:', error);
      return { design_id: 0, design_name: '', projects: [], status: 'error' };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (controller) controller.abort();
    }
  } catch (error) {
    console.error('Error in getProjectsByDesignId:', error);
    return { design_id: 0, design_name: '', projects: [], status: 'error' };
  }
};

export const deleteDesign = async (designId) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/designs/${designId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Failed to delete design: ${response.status} ${response.statusText}`);
      }
      throw e;
    }

    if (!response.ok) {
      switch (response.status) {
        case 404:
          throw new Error(responseData.error || 'Design not found or does not belong to user');
        case 500:
          throw new Error(responseData.error || 'Internal server error');
        default:
          throw new Error(responseData.error || `Failed to delete design: ${response.status}`);
      }
    }

    return responseData;
  } catch (error) {
    console.error('Error deleting design:', error);
    throw error;
  }
};

// Get design ID for a project using the designs GET API
export const getDesignIdForProject = async (projectId, designSystemName) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // For update flows, design system name might be empty - we'll search by project ID only
    if (!designSystemName) {
      console.log('No design system name provided, will search by project ID only');
    }

    console.log('Fetching design ID for project:', projectId, 'with design system name:', designSystemName);

    const response = await fetch(`${API_URL}/designs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Designs API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Designs API response:', data);

    // Find the design that matches the project ID (design system name might be different)
    if (data.designs && Array.isArray(data.designs)) {
      let matchingDesign = null;
      
      // If design system name is provided, try exact match first
      if (designSystemName) {
        matchingDesign = data.designs.find(design => 
          design.design_system_name === designSystemName &&
          design.projects && design.projects.some(project => project.id === parseInt(projectId))
        );
      }
      
      // If no exact match or no design system name provided, find by project ID only
      if (!matchingDesign) {
        console.log('Searching by project ID only...');
        matchingDesign = data.designs.find(design => 
          design.projects && design.projects.some(project => project.id === parseInt(projectId))
        );
      }
      
      if (matchingDesign) {
        console.log('Found matching design:', matchingDesign);
        console.log('Design system name in DB:', matchingDesign.design_system_name);
        console.log('Design system name searched:', designSystemName);
        return { 
          status: 'success', 
          designId: matchingDesign.id,
          designSystemName: matchingDesign.design_system_name
        };
      } else {
        console.error('No design found for project ID:', projectId);
        console.log('Available designs for debugging:', data.designs.slice(0, 5).map(d => ({
          id: d.id,
          design_system_name: d.design_system_name,
          project_ids: d.projects?.map(p => p.id)
        })));
        return { status: 'error', message: 'No design found for this project' };
      }
    } else {
      console.error('Invalid designs response format:', data);
      return { status: 'error', message: 'Invalid response format' };
    }
  } catch (error) {
    console.error('Error fetching design ID:', error);
    return { status: 'error', message: error.message };
  }
};

// Get water quality parameters for existing project (for updates)
export const getWaterQualityParameters = async (projectId) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log('Fetching water quality parameters for project:', projectId);

    const response = await fetch(`${API_URL}/projects/${projectId}/water-quality-parameters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Water quality parameters API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Water quality parameters API response:', data);
    return { status: 'success', data };
  } catch (error) {
    console.error('Error fetching water quality parameters:', error);
    return { status: 'error', message: error.message };
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

    // Check if this is an update flow (passed from component)
    // For update flows, we need both designId and projectId
    const isUpdate = designData.isUpdateFlow && designData.designId && designData.projectId;
    const existingDesignId = designData.designId || null;
    const existingProjectId = designData.projectId || null;

    // Create request body exactly matching API spec
    const timestamp = new Date().toISOString();
    const designId = isUpdate ? existingDesignId : Date.now().toString();
    
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
        id: isUpdate ? existingProjectId : designId,
        created_at: timestamp,
        name: designData.projectName.trim(),
        description: `Project for ${designData.designSystemName.trim()}`,
        species_names: designData.targetSpecies || ''
      }]
    };

    // For updates, include the existing project_id in the main request body
    if (isUpdate) {
      requestBody.project_id = existingProjectId;
      console.log('Updating existing design:', designId, 'and project:', existingProjectId);
    } else {
      console.log('Creating new design and project');
    }

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

    // If successful (200 or 201), the response should include design_id, project_id, and recommended values
    if (response.ok && (response.status === 200 || response.status === 201)) {
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

      // Log the action type for debugging
      if (responseData.action) {
        console.log('API Action:', responseData.action);
        if (responseData.action === 'created') {
          console.log('New design and project created successfully');
        } else if (responseData.action === 'updated') {
          console.log('Existing design and project updated successfully');
        }
      }

      return responseData;
    }

    throw new Error('Unexpected response from server');
  } catch (error) {
    console.error('Error creating design system:', error);
    throw error;
  }
};