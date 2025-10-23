// Advanced calculation API service

const API_BASE = import.meta.env.VITE_API_URL || '/backend';

export async function postAdvancedParameters(projectId, payload) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found. Please log in again.');

  // Respect provided type; default to 'advanced' when not specified
  const payloadWithType = {
    type: payload && payload.type ? payload.type : "advanced",
    ...payload
  };

  const url = `${API_BASE}/advanced/formulas/api/projects/${projectId}/advanced/parameters`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(payloadWithType)
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) {}

  if (!res.ok) {
    const details = (data && (data.error || data.details)) || res.statusText || 'Unknown error';
    throw new Error(`Advanced calc failed: ${details}`);
  }

  return data;
}

export async function postAdvancedStep6Results(projectId, payload) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found. Please log in again.');

  const url = `${API_BASE}/advanced/formulas/api/projects/${projectId}/step_6_results`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) {}

  if (!res.ok) {
    const details = (data && (data.error || data.details)) || res.statusText || 'Unknown error';
    throw new Error(`Advanced step 6 failed: ${details}`);
  }

  return data;
}

export async function getAdvancedStep6Results(projectId) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found. Please log in again.');

  const url = `${API_BASE}/advanced/formulas/api/projects/${projectId}/step_6_results`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache'
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) {}

  if (!res.ok) {
    const details = (data && (data.error || data.details)) || res.statusText || 'Unknown error';
    throw new Error(`Advanced step 6 fetch failed: ${details}`);
  }

  return data;
}


export async function getAdvancedLimitingFactor(projectId) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found. Please log in again.');

  const url = `${API_BASE}/advanced/formulas/api/projects/${projectId}/limiting_factor`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache'
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) {}

  if (!res.ok) {
    const details = (data && (data.error || data.details)) || res.statusText || 'Unknown error';
    throw new Error(`Advanced limiting factor fetch failed: ${details}`);
  }

  return data;
}


