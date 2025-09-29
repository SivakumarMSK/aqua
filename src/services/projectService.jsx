const API_URL = 'http://13.53.148.164:5000/new_design/api';
const FORMULAS_API_URL = 'http://13.53.148.164:5000/formulas/api';

export const getAllProjects = async () => {
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
    timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
    console.log('Designs API response:', data);

    if (data && Array.isArray(data.designs)) {
      // First collect all projects
      const allProjects = data.designs
        .filter(design => design.projects && design.projects.length > 0)
        .flatMap(design => 
          design.projects.map(project => ({
            ...project,
            design_system_name: design.design_system_name,
            design_id: design.id
          }))
        );

      // Remove duplicates by comparing all fields
      const uniqueProjects = allProjects.reduce((acc, current) => {
        const isDuplicate = acc.some(item => 
          (item.id === current.id) || 
          (item.name === current.name && 
           item.design_id === current.design_id)
        );
        
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return uniqueProjects;
    } else {
      console.error('Invalid API response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (controller) controller.abort();
  }
};

export const getProjectById = async (projectId) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.status}`);
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(projectData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create project: ${response.status}`);
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(projectData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update project: ${response.status}`);
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete project: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};


export const calculateMassBalance = async (projectId, formData) => {
  console.log('calculateMassBalance service function called with:', {
    projectId,
    formData
  });

  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  console.log('Auth token found:', !!token);
  
  if (!token) {
    console.error('No auth token found in storage');
    throw new Error('Authentication token not found');
  }

  try {
    console.log('calculateMassBalance called with project ID:', projectId);
    console.log('Form data received:', formData);

    // Submit only essential water quality parameters for basic calculation
    const requestBody = {
      // Essential water quality parameters only
      temperature: parseFloat(formData.waterTemp || 0),
      salinity: parseFloat(formData.salinity || 0),
      elevation_m: parseFloat(formData.siteElevation || 0),
      dissolved_O2_min: parseFloat(formData.minDO || 0),
      pH: parseFloat(formData.pH || 0),
      dissolved_CO2_max: parseFloat(formData.maxCO2 || 0),
      TAN_max: parseFloat(formData.maxTAN || 0),
      TSS_max: parseFloat(formData.minTSS || 0),
      species: formData.targetSpecies || 'string',
      use_recommended: Boolean(formData.useRecommendedValues),
      type: "basic" // Add type field for basic calculation
    };

    console.log('Request body prepared:', requestBody);

    // Submit parameters
    const postUrl = `${API_URL}/projects/${projectId}/water-quality-parameters`;
    console.log('Making POST request to:', postUrl);
    console.log('POST request headers:', {
      'Authorization': 'Bearer [token]',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    console.log('POST request body:', requestBody);

    const paramResponse = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!paramResponse.ok) {
      const errorData = await paramResponse.json();
      throw new Error(errorData.error || `Failed to submit parameters: ${paramResponse.status}`);
    }

    console.log('POST response status:', paramResponse.status);
    const paramData = await paramResponse.text();
    console.log('POST response data:', paramData);

    // Get calculations
    const getUrl = `${FORMULAS_API_URL}/projects/${projectId}/production-calculations`;
    console.log('Making GET request to:', getUrl);
    console.log('GET request headers:', {
      'Authorization': 'Bearer [token]',
      'Accept': 'application/json'
    });

    const calcResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!calcResponse.ok) {
      throw new Error(`Failed to fetch calculations: ${calcResponse.status}`);
    }

    const calcData = await calcResponse.json();

    // Return combined results with real data for oxygen and TSS, and include max/min use values from API
    return {
      oxygen: {
        bestInletMgL: calcData.o2_saturation_adjusted?.value || calcData.o2_saturation_adjusted_mg_l || 0,
        minSatPct: calcData.o2_saturation_adjusted?.value || calcData.o2_saturation_adjusted_mg_l || 0,
        saturationAdjustedMgL: calcData.o2_saturation_adjusted_mg_l || 0,
        // New: minimum DO to use (mg/L)
        MINDO_use: calcData.min_do_mg_l ?? calcData.min_do_use_mg_l ?? null,
        effluentMgL: calcData.oxygen_effluent_concentration?.value || calcData.oxygen_effluent_concentration_mg_l || 0,
        consMgPerDay: calcData.oxygen_consumption_production?.value || calcData.oxygen_consumption_production_mg_per_day || 0,
        consKgPerDay: (calcData.oxygen_consumption_production?.value || calcData.oxygen_consumption_production_mg_per_day || 0) / 1000000 // Convert mg to kg
      },
      tss: {
        effluentMgL: calcData.tss_effluent_concentration?.value || calcData.tss_effluent_concentration_mg_l || 0,
        prodMgPerDay: calcData.tss_production?.value || calcData.tss_production_mg || 0,
        prodKgPerDay: (calcData.tss_production?.value || calcData.tss_production_mg || 0) / 1000000, // Convert mg to kg
        // New: maximum TSS to use (mg/L)
        MAXTSS_use: calcData.max_tss_use_mg_l ?? null
      },
      co2: {
        // Keep existing values when present; include max CO2 to use (mg/L)
        effluentMgL: calcData.co2_effluent_concentration_mg_l ?? 15.5,
        prodMgPerDay: calcData.co2_production_mg_per_day ?? 2500000,
        prodKgPerDay: (calcData.co2_production_mg_per_day ?? 2500000) / 1000000,
        MAXCO2_use: calcData.max_co2_use_mg_l ?? null
      },
      tan: {
        effluentMgL: calcData.tan_effluent_concentration_mg_l ?? 1.0,
        prodMgPerDay: calcData.tan_production_mg_per_day ?? 800000,
        prodKgPerDay: (calcData.tan_production_mg_per_day ?? 800000) / 1000000,
        MAXTAN_use: calcData.max_tan_use_mg_l ?? null
      }
    };
  } catch (error) {
    console.error('Error calculating mass balance:', error);
    throw error;
  }
};
