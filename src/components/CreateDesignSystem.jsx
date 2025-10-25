import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import Stage7DynamicPanel from './Stage7DynamicPanel';
import DynamicOutputsPanel from './DynamicOutputsPanel';
import Stage6DynamicOutputsPanel from './Stage6DynamicOutputsPanel';
import Stage7DynamicOutputsPanel from './Stage7DynamicOutputsPanel';
import Stage8DynamicOutputsPanel from './Stage8DynamicOutputsPanel';
import InputsDisplay from './InputsDisplay';
import { getRecommendedValues, getSpecies } from '../services/speciesService';
import { createDesignSystem, createWaterQualityParameters, getWaterQualityParameters, getDesignIdForProject } from '../services/designSystemService.jsx';
import Swal from 'sweetalert2';
import { postAdvancedParameters, getAdvancedStep6Results, getAdvancedLimitingFactor } from '../services/advancedService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Toast from './Toast';

// Prevent scroll behavior on number inputs
const preventNumberInputScroll = () => {
  // Disable scroll wheel events on number inputs
  document.addEventListener('wheel', function(e) {
    if (e.target.type === 'number' && e.target === document.activeElement) {
      e.preventDefault();
    }
  }, { passive: false });

  // Alternative: Disable on focus
  document.addEventListener('focusin', function(e) {
    if (e.target.type === 'number') {
      e.target.addEventListener('wheel', function(e) {
        e.preventDefault();
      }, { passive: false });
    }
  });
};

// Stage 7 API functions
const postStage7Parameters = async (projectId, payload) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Ensure required parameters are always included with default values
    const requiredPayload = {
      mbbr_location: payload.mbbr_location || 'Integrated',
      pump_stop_overflow_volume: parseFloat(payload.pump_stop_overflow_volume) || 0,
      passive_nitrification_rate_stage1_percent: parseFloat(payload.passive_nitrification_rate_stage1_percent) || 0,
      passive_nitrification_rate_stage2_percent: parseFloat(payload.passive_nitrification_rate_stage2_percent) || 0,
      passive_nitrification_rate_stage3_percent: parseFloat(payload.passive_nitrification_rate_stage3_percent) || 0,
      ...payload // Include any additional parameters
    };

    console.log('📤 Stage 7 POST Payload:', requiredPayload);

    const response = await fetch(`/backend/advanced/formulas/api/projects/${projectId}/step7`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requiredPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stage 7 API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return { status: 'success', data };
  } catch (error) {
    console.error('Stage 7 API error:', error);
    return { status: 'error', message: error.message };
  }
};

const getStage7Results = async (projectId) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Debug logging to see what's being sent
    console.log('🔍 Stage 7 GET API Debug:');
    console.log('  Project ID:', projectId);
    console.log('  Project ID type:', typeof projectId);
    
    const url = `/backend/advanced/formulas/api/projects/${projectId}/step7`;
    console.log('  Full URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': 'calculated when request is sent'
      }
    });

    console.log('  Response status:', response.status);
    console.log('  Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('  Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('  Response data:', data);
    return { status: 'success', data };
  } catch (error) {
    console.error('Stage 7 Results API error:', error);
    return { status: 'error', message: error.message };
  }
};

const postStage8Parameters = async (projectId, payload) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // TODO: Replace with actual Stage 8 API endpoint when ready
    const response = await fetch(`/backend/advanced/formulas/api/projects/${projectId}/step8`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { status: 'success', data };
  } catch (error) {
    console.error('Stage 8 API error:', error);
    // For now, return success with placeholder data
    return { status: 'success', message: 'Stage 8 API not ready - using placeholder data' };
  }
};

const getStage8Results = async (projectId) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`/backend/advanced/formulas/api/projects/${projectId}/step8`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { status: 'success', data };
  } catch (error) {
    console.error('Stage 8 Results API error:', error);
    // Return placeholder data for now
    return {
      status: 'success',
      data: {
        project_id: Number(projectId) || 0,
        status: 'success',
        stage1: {
          Q_l_s_Stage1: 5.8655,
          limitingFlowRateStage1: 351.9319,
          n_Motor_Stage1: 0.9,
          n_Pump_Stage1: 0.7,
          pump_Head_Stage1: 10.0,
          pump_HydPower_Stage1: 0.5754,
          pump_PowerkW_Stage1: 0.9133
        },
        stage2: {
          Q_l_s_Stage2: 17.4646,
          limitingFlowRateStage2: 1047.8756,
          n_Motor_Stage2: 0.9,
          n_Pump_Stage2: 0.7,
          pump_Head_Stage2: 10.0,
          pump_HydPower_Stage2: 1.7133,
          pump_PowerkW_Stage2: 2.7195
        },
        stage3: {
          Q_l_s_Stage3: 28.3211,
          limitingFlowRateStage3: 1699.2674,
          n_Motor_Stage3: 0.9,
          n_Pump_Stage3: 0.7,
          pump_Head_Stage3: 10.0,
          pump_HydPower_Stage3: 2.7783,
          pump_PowerkW_Stage3: 4.41
        }
      }
    };
  }
};

// Step 7 Live API function
const postStep7LiveCalculations = async (projectId, payload) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log('📤 Step 7 Live API Payload (using production-calculations/live):', payload);

    const response = await fetch(`/backend/formulas/api/projects/${projectId}/production-calculations/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Step 7 Live API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Step 7 Live API Response:', data);
    return data;
  } catch (error) {
    console.error('Step 7 Live API error:', error);
    throw error;
  }
};
import { generateMassBalanceReport, generateAdvancedReportPdf, generateStage7ReportPdf, generateStage8ReportPdf, generateCompleteAdvancedReportPdf } from '../utils/pdfGenerator';
import { getCurrentPlan, getCurrentPlanSync } from '../utils/subscriptionUtils';
import Navbar from './Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Stepper from './Stepper';
import CombinedInputsPage from './CombinedInputsPage';
import '../styles/CreateDesignSystem.css';
import '../styles/InputsDisplay.css';
import { postLiveProductionCalculations } from '../services/designSystemService.jsx';

const CreateDesignSystem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [showCombinedInputs, setShowCombinedInputs] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prevent scroll behavior on number inputs when component mounts
  useEffect(() => {
    preventNumberInputScroll();
  }, []);
  const [loadingStep, setLoadingStep] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Design and project IDs state (no localStorage needed)
  const [designIds, setDesignIds] = useState({ designId: null, projectId: null });
  const [isUpdateFlow, setIsUpdateFlow] = useState(false);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  
  // Subscription and calculation type states
  const initialPlanSync = getCurrentPlanSync();
  const [userPlan, setUserPlan] = useState(initialPlanSync || 'Free');
  const [initialFree] = useState((initialPlanSync || 'Free') === 'Free');
  const [planLoaded, setPlanLoaded] = useState(false);
  const [calculationType, setCalculationType] = useState('basic'); // 'basic' or 'advanced'
  const [showCalculationTypeSelection, setShowCalculationTypeSelection] = useState(true);
  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);
  const [designCreated, setDesignCreated] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [advancedReport, setAdvancedReport] = useState(null);
  const [isAdvancedReportView, setIsAdvancedReportView] = useState(false);
  const [limitingFactor, setLimitingFactor] = useState(null);
  const [activeTab, setActiveTab] = useState('water');
  // Advanced Report tabs: 'all' | 'massBalance' | 'stage6' | 'stage7' | 'stage8'
  const [activeReportTab, setActiveReportTab] = useState('all');
  // Water quality inputs mapped for display in advanced report tabs
  const [advancedInputs, setAdvancedInputs] = useState(null);
  // Stage 7 specific inputs (different from Stage 6 inputs)
  const [stage7Inputs, setStage7Inputs] = useState(null);

  // Helper to map water quality GET API response to InputsDisplay format for Stage 6/Mass Balance
  const mapWaterQualityToInputs = (inputsData) => {
    const p = inputsData?.parameters || {};
    return {
      waterTemp: p.temperature ?? 25,
      salinity: p.salinity ?? 0,
      siteElevation: p.elevation_m ?? 0,
      minDO: p.dissolved_O2_min ?? 6,
      ph: p.ph ?? 7, // Use ph from API (lowercase h) and map to lowercase ph
      maxCO2: p.dissolved_CO2_max ?? 10,
      maxTAN: p.TAN_max ?? 1,
      minTSS: p.TSS_max ?? 20, // TSS_max is correct field name
      tankVolume: p.tanks_volume_each ?? 100,
      numTanks: p.number_of_tanks ?? 1,
      targetFishWeight: p.target_market_fish_size ?? 500,
      targetNumFish: p.target_max_stocking_density ?? 1000,
      feedRate: p.target_feed_rate ?? 2,
      feedProtein: p.feed_protein_percent ?? 40,
      feedConversionRatio: p.feed_conversion_ratio ?? 0,
      o2Absorption: p.oxygen_injection_efficiency ?? 80,
      co2Removal: p.co2_removal_efficiency ?? 70,
      tssRemoval: p.tss_removal_efficiency ?? 80,
      tanRemoval: p.tan_removal_efficiency ?? 60,
      targetSpecies: p.species || 'Tilapia',
      supplementPureO2: Boolean(p.supplement_pure_o2),
      // Additional fields from API response
      alkalinity: p.alkalinity ?? 0,
      targetMinO2Saturation: p.target_min_o2_saturation ?? 0,
      productionTarget_t: p.production_target_t ?? 0,
      harvestFrequency: p.harvest_frequency ?? '',
      initialWeight: p.initial_weight_wi_g ?? 0
    };
  };

  // Helper to map water quality GET API response to InputsDisplay format for Stage 7
  const mapWaterQualityToStage7Inputs = (inputsData) => {
    const p = inputsData?.parameters || {};
    
    return {
      // Common parameters (same as Stage 6)
      waterTemp: p.temperature ?? 25,
      salinity: p.salinity ?? 0,
      siteElevation: p.elevation_m ?? 0,
      minDO: p.dissolved_O2_min ?? 6,
      ph: p.ph ?? 7, // Use ph from API (lowercase h) and map to lowercase ph
      maxCO2: p.dissolved_CO2_max ?? 10,
      maxTAN: p.TAN_max ?? 1,
      minTSS: p.TSS_max ?? 20, // TSS_max is correct field name
      tankVolume: p.tanks_volume_each ?? 100,
      numTanks: p.number_of_tanks ?? 1,
      targetFishWeight: p.target_market_fish_size ?? 500,
      targetNumFish: p.target_max_stocking_density ?? 1000,
      feedRate: p.target_feed_rate ?? 2,
      feedProtein: p.feed_protein_percent ?? 40,
      feedConversionRatio: p.feed_conversion_ratio ?? 0,
      o2Absorption: p.oxygen_injection_efficiency ?? 80,
      co2Removal: p.co2_removal_efficiency ?? 70,
      tssRemoval: p.tss_removal_efficiency ?? 80,
      tanRemoval: p.tan_removal_efficiency ?? 60,
      targetSpecies: p.species || 'Tilapia',
      supplementPureO2: Boolean(p.supplement_pure_o2),
      // Additional fields from API response
      alkalinity: p.alkalinity ?? 0,
      targetMinO2Saturation: p.target_min_o2_saturation ?? 0,
      productionTarget_t: p.production_target_t ?? 0,
      harvestFrequency: p.harvest_frequency ?? '',
      initialWeight: p.initial_weight_wi_g ?? 0,
      // Stage-wise parameters (FCR, Feed Protein, Mortality)
      FCR_Stage1: p.fcr_stage1 ?? 0,
      FCR_Stage2: p.fcr_stage2 ?? 0,
      FCR_Stage3: p.fcr_stage3 ?? 0,
      FeedProtein_Stage1: p.feed_protein_stage1 ?? 0,
      FeedProtein_Stage2: p.feed_protein_stage2 ?? 0,
      FeedProtein_Stage3: p.feed_protein_stage3 ?? 0,
      Estimated_mortality_Stage1: p.estimated_mortality_stage1 ?? 0,
      Estimated_mortality_Stage2: p.estimated_mortality_stage2 ?? 0,
      Estimated_mortality_Stage3: p.estimated_mortality_stage3 ?? 0,
      // Stage 7 specific fields from API response
      mbbrLocation: p.mbbr_location ?? 'Inside tank',
      mediaToWaterVolumeRatio: p.media_to_water_volume_ratio ?? 0.1,
      volumetricNitrificationRateVtr: p.volumetric_nitrification_rate_vtr ?? 0.5,
      standaloneHeightDiameterRatio: p.standalone_height_diameter_ratio ?? 2.0,
      pumpStopOverflowVolume: p.pump_stop_overflow_volume ?? 0.1,
      // Passive nitrification rates
      passiveNitrificationRateStage1: p.passive_nitrification_rate_stage1_percent ?? 0,
      passiveNitrificationRateStage2: p.passive_nitrification_rate_stage2_percent ?? 0,
      passiveNitrificationRateStage3: p.passive_nitrification_rate_stage3_percent ?? 0,
      // Tank design parameters
      numTanksStage1: p.num_tanks_stage1 ?? 0,
      numTanksStage2: p.num_tanks_stage2 ?? 0,
      numTanksStage3: p.num_tanks_stage3 ?? 0,
      tankDdRatioStage1: p.tank_dd_ratio_stage1 ?? 0,
      tankDdRatioStage2: p.tank_dd_ratio_stage2 ?? 0,
      tankDdRatioStage3: p.tank_dd_ratio_stage3 ?? 0,
      tankFreeboardStage1: p.tank_freeboard_stage1 ?? 0,
      tankFreeboardStage2: p.tank_freeboard_stage2 ?? 0,
      tankFreeboardStage3: p.tank_freeboard_stage3 ?? 0
    };
  };

  // Fetch and set advancedInputs when entering report view or switching to relevant tabs
  useEffect(() => {
    const shouldShowInputs = activeReportTab === 'massBalance' || activeReportTab === 'stage7';
    if (!shouldShowInputs) return;

    const currentProjectId = localStorage.getItem('currentProjectId');
    if (!currentProjectId) {
      console.warn('No currentProjectId found; cannot fetch water quality inputs.');
      return;
    }

    (async () => {
      try {
        const res = await getWaterQualityParameters(currentProjectId);
        if (res?.status === 'success' && res.data) {
          if (activeReportTab === 'massBalance' && !advancedInputs) {
            const mapped = mapWaterQualityToInputs(res.data);
            setAdvancedInputs(mapped);
          } else if (activeReportTab === 'stage7') {
            const mapped = mapWaterQualityToStage7Inputs(res.data);
            setStage7Inputs(mapped);
          }
        } else {
          console.warn('Failed to load water quality inputs:', res);
        }
      } catch (e) {
        console.warn('Error fetching water quality inputs:', e);
      }
    })();
  }, [activeReportTab, isAdvancedReportView, advancedReport, getWaterQualityParameters, advancedInputs]);
  // Hydrate from navigation state when arriving from Advanced View (eye icon)
  useEffect(() => {
    const state = location?.state;
    if (state && state.isAdvancedReportView) {
      if (state.advancedReport) setAdvancedReport(state.advancedReport);
      if (state.limitingFactor) setLimitingFactor(state.limitingFactor);
      if (state.advancedInputs) setAdvancedInputs(state.advancedInputs);
      setIsAdvancedReportView(true);
      setShowCalculationTypeSelection(false);
      setShowAdvancedLayout(false);
      setShowStage7Inputs(false); // Ensure Stage 7 inputs are not shown in report view
      setActiveReportTab('massBalance');
    }
  }, [location]);

  // Load existing project data for updates
  const loadExistingProjectData = async (projectId) => {
    try {
      setLoading(true);
      setIsLoadingExistingData(true);
      console.log('Loading existing project data for project:', projectId);
      
      // Get design system name from localStorage (set by update button)
      // For updates, we don't have a design name in localStorage, so use empty string
      const designSystemName = formData.designSystemName || '';
      
      // Fetch both water quality parameters and design ID
      const [waterQualityResponse, designIdResponse] = await Promise.all([
        getWaterQualityParameters(projectId),
        getDesignIdForProject(projectId, designSystemName)
      ]);
      
      // Update design system name from API response if available
      console.log('Design ID response:', designIdResponse);
      if (designIdResponse.status === 'success' && designIdResponse.designSystemName) {
        console.log('Updating design system name from API:', designIdResponse.designSystemName);
        setFormData(prev => ({
          ...prev,
          designSystemName: designIdResponse.designSystemName
        }));
      } else {
        console.log('No design system name found in API response or API call failed');
        console.log('Response status:', designIdResponse.status);
        console.log('Design system name in response:', designIdResponse.designSystemName);
      }
      
      if (waterQualityResponse.status === 'success' && waterQualityResponse.data) {
        const data = waterQualityResponse.data;
        console.log('Loaded water quality data:', data);
        console.log('Available fields in API response:', Object.keys(data));
        console.log('Parameters object:', data.parameters);
        
        // Map API response to form data (data is nested in parameters object)
        const params = data.parameters || {};
        const mappedData = {
          // Water quality parameters
          waterTemp: params.temperature?.toString() || '',
          ph: params.ph?.toString() || '',
          salinity: params.salinity?.toString() || '',
          siteElevation: params.elevation_m?.toString() || '',
          minDO: params.dissolved_O2_min?.toString() || '',
          maxCO2: params.dissolved_CO2_max?.toString() || '',
          minTSS: params.TSS_max?.toString() || '',
          maxTAN: params.TAN_max?.toString() || '',
          useRecommendedValues: Boolean(params.use_recommended),
          
          // Additional water quality parameters
          targetMinO2Saturation: params.target_min_o2_saturation?.toString() || '',
          alkalinity: params.alkalinity?.toString() || '',
          supplementPureO2: Boolean(params.supplement_pure_o2),
          
          // Production parameters
          tankVolume: params.tanks_volume_each?.toString() || '',
          numTanks: params.number_of_tanks?.toString() || '',
          targetNumFish: params.target_max_stocking_density?.toString() || '',
          feedRate: params.target_feed_rate?.toString() || '',
          feedConversionRatio: params.feed_conversion_ratio?.toString() || '',
          feedProtein: params.feed_protein_percent?.toString() || '',
          targetFishWeight: params.target_market_fish_size?.toString() || '',
          
          // Production Information - Required Fields
          initialWeightWiG: params.initial_weight_wi_g?.toString() || '',
          juvenileSize: params.juvenile_size?.toString() || '',
          productionTarget_t: params.production_target_t?.toString() || '',
          harvestFrequency: params.harvest_frequency || 'Fortnightly',
          FCR_Stage1: params.fcr_stage1?.toString() || '',
          FeedProtein_Stage1: params.feed_protein_stage1?.toString() || '',
          FCR_Stage2: params.fcr_stage2?.toString() || '',
          FeedProtein_Stage2: params.feed_protein_stage2?.toString() || '',
          FCR_Stage3: params.fcr_stage3?.toString() || '',
          FeedProtein_Stage3: params.feed_protein_stage3?.toString() || '',
          Estimated_mortality_Stage1: params.estimated_mortality_stage1?.toString() || '',
          Estimated_mortality_Stage2: params.estimated_mortality_stage2?.toString() || '',
          Estimated_mortality_Stage3: params.estimated_mortality_stage3?.toString() || '',
          
          // Efficiency Parameters (System Efficiency Parameters)
          o2Absorption: params.oxygen_injection_efficiency?.toString() || '',
          tssRemoval: params.tss_removal_efficiency?.toString() || '',
          co2Removal: params.co2_removal_efficiency?.toString() || '',
          tanRemoval: params.tan_removal_efficiency?.toString() || '',
          
          // Set project and design IDs for updates
          projectId: projectId,
          designId: data.design_id || designIds.designId
        };
        
        console.log('Mapped data for form:', mappedData);
        console.log('Specific field values:', {
          ph: mappedData.ph,
          initialWeightWiG: mappedData.initialWeightWiG,
          phFromParams: params.ph,
          initialWeightFromParams: params.initial_weight_wi_g
        });
        console.log('Updating form data with mapped parameters for advanced flow');
        setFormData(prev => {
          const updatedData = { ...prev, ...mappedData };
          console.log('Form data updated with mapped parameters:', updatedData);
          console.log('Updated specific fields:', {
            ph: updatedData.ph,
            initialWeightWiG: updatedData.initialWeightWiG
          });
          return updatedData;
        });
        
        // Also update stage7FormData with Step 7 specific parameters
        const stage7MappedData = {
          mbbr_location: params.mbbr_location || 'Integrated',
          media_to_water_volume_ratio: params.media_to_water_volume_ratio || 0,
          passive_nitrification_rate_stage1_percent: params.passive_nitrification_rate_stage1_percent || 0,
          passive_nitrification_rate_stage2_percent: params.passive_nitrification_rate_stage2_percent || 0,
          passive_nitrification_rate_stage3_percent: params.passive_nitrification_rate_stage3_percent || 0,
          pump_stop_overflow_volume: params.pump_stop_overflow_volume || 0,
          standalone_height_diameter_ratio: params.standalone_height_diameter_ratio || 0,
          volumetric_nitrification_rate_vtr: params.volumetric_nitrification_rate_vtr || 0,
          num_tanks_stage1: params.num_tanks_stage1 || 0,
          num_tanks_stage2: params.num_tanks_stage2 || 0,
          num_tanks_stage3: params.num_tanks_stage3 || 0,
          tank_dd_ratio_stage1: params.tank_dd_ratio_stage1 || 0,
          tank_dd_ratio_stage2: params.tank_dd_ratio_stage2 || 0,
          tank_dd_ratio_stage3: params.tank_dd_ratio_stage3 || 0,
          tank_freeboard_stage1: params.tank_freeboard_stage1 || 0,
          tank_freeboard_stage2: params.tank_freeboard_stage2 || 0,
          tank_freeboard_stage3: params.tank_freeboard_stage3 || 0
        };
        
        console.log('Mapped Stage 7 data:', stage7MappedData);
        setStage7FormData(stage7MappedData);
        
        // Store design ID in component state for update operations
        // Project ID is already set when update flow is detected
        const designId = designIdResponse.status === 'success' ? designIdResponse.designId : null;
        
        setDesignIds(prev => ({
          ...prev,
          designId: designId
        }));
        
        console.log('Setting IDs for update flow:', {
          designId: designId,
          projectId: projectId,
          designIdResponse: designIdResponse,
          'Current designIds state': designIds
        });
        
        console.log('Project data loaded successfully');
        setToast({
          show: true,
          message: 'Project data loaded successfully',
          type: 'success'
        });
      } else {
        console.error('Failed to load project data:', waterQualityResponse.message);
        setToast({
          show: true,
          message: 'Failed to load project data: ' + waterQualityResponse.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading existing project data:', error);
      setToast({
        show: true,
        message: 'Error loading project data: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
      setIsLoadingExistingData(false);
    }
  };

  // Handle update flow from dashboard
  useEffect(() => {
    console.log('🔄 useEffect triggered - location changed');
    console.log('Current location:', location.pathname, location.search);
    console.log('Current designIds:', designIds);
    console.log('Current designIdsRef:', designIdsRef.current);
    
    const urlParams = new URLSearchParams(location.search);
    const isUpdate = urlParams.get('update') === 'true';
    const updateType = urlParams.get('type');
    
    if (isUpdate) {
      // Update flow: skip calculation type selection and go directly to appropriate flow
      console.log('Update flow detected, type:', updateType);
      setIsUpdateFlow(true);
      
      if (updateType === 'advanced') {
        setCalculationType('advanced');
        setShowCalculationTypeSelection(false);
        setShowAdvancedLayout(true);
        setShowAdvancedFields(true); // Show advanced fields for update flow
      } else {
        // Default to basic for update flow
        setCalculationType('basic');
        setShowCalculationTypeSelection(false);
        setShowAdvancedLayout(false);
      }
      
      // Load existing project data
      const updateProjectId = localStorage.getItem('updateProjectId');
      const updateProjectName = localStorage.getItem('updateProjectName');
      const updateProjectSpecies = localStorage.getItem('updateProjectSpecies');
      
      if (updateProjectId) {
        // Set initial form data from localStorage
        setFormData(prev => ({
          ...prev,
          projectName: updateProjectName || '',
          targetSpecies: updateProjectSpecies || '',
          designSystemName: '' // Leave design name empty for updates - user should enter their own design name
        }));
        
        // Set project ID immediately for update flow
        setDesignIds(prev => {
          console.log('Setting project ID immediately for update flow:', updateProjectId);
          return {
            ...prev,
            projectId: updateProjectId
          };
        });
        
        // Load detailed project data and set design ID
        loadExistingProjectData(updateProjectId);
      }
    } else {
      // New design flow: be very conservative about resetting state
      console.log('New design flow: checking if we should reset state');
      console.log('Current designIds before check:', designIdsRef.current);
      console.log('isBackButtonScenarioRef.current:', isBackButtonScenarioRef.current);
      
      // Only reset if we have NO existing IDs AND we're not in a back button scenario
      const hasExistingIds = designIdsRef.current.projectId || designIdsRef.current.designId;
      const isBackButtonScenario = isBackButtonScenarioRef.current;
      
      if (!hasExistingIds && !isBackButtonScenario) {
        // No existing IDs and not a back button scenario - this is a true new design
        console.log('No existing IDs and not back button scenario - resetting state');
        setIsUpdateFlow(false);
        setDesignIds({ designId: null, projectId: null });
        
        // Clear localStorage items
        localStorage.removeItem('updateProjectId');
        localStorage.removeItem('updateProjectType');
        localStorage.removeItem('updateProjectName');
        localStorage.removeItem('updateProjectSpecies');
      } else {
        // We have existing IDs OR we're in a back button scenario - preserve the IDs
        console.log('Preserving state - hasExistingIds:', hasExistingIds, 'isBackButtonScenario:', isBackButtonScenario);
        console.log('Preserving designIds:', designIdsRef.current);
        console.log('designIds state before preserving:', designIds);
        setIsUpdateFlow(false); // Still not an update flow, but preserve IDs
        
        // Reset the back button flag after using it
        if (isBackButtonScenario) {
          isBackButtonScenarioRef.current = false;
        }
      }
    }
  }, [location]);

  // Keep designIdsRef in sync with designIds state
  useEffect(() => {
    designIdsRef.current = designIds;
  }, [designIds]);
  
  // Stage 7 and Stage 8 selection states
  const [stage7Selected, setStage7Selected] = useState(false);
  const [stage8Selected, setStage8Selected] = useState(false);
  const [stage7Report, setStage7Report] = useState(null);
  const [stage8Report, setStage8Report] = useState(null);

  // Live dynamic outputs state for right panel
  const [liveOutputs, setLiveOutputs] = useState(null);
  const liveDebounceRef = useRef(null);
  const liveAbortRef = useRef(null);
  const speciesSavedRef = useRef(false);
  const designIdsRef = useRef({ designId: null, projectId: null });
  const isBackButtonScenarioRef = useRef(false);
  // Keep the latest form data snapshot for building live payloads (avoids stale state)
  const liveFormRef = useRef({});

  // Advanced dynamic calculation states
  const [dynamicStage6, setDynamicStage6] = useState({ 
    step6: { status: 'empty', data: null },
    massBalance: { status: 'empty', data: null },
    limitingFactor: { status: 'empty', data: null },
    stage8: { status: 'empty', data: null }
  });
  const [dynamicStage7, setDynamicStage7] = useState({ 
    biofilter: { status: 'empty', data: null }, 
    sump: { status: 'empty', data: null },
    stage1: { status: 'empty', data: null },
    stage2: { status: 'empty', data: null },
    stage3: { status: 'empty', data: null }
  });
  const [dynamicStage8, setDynamicStage8] = useState({ 
    stage1: { status: 'empty', data: null },
    stage2: { status: 'empty', data: null },
    stage3: { status: 'empty', data: null }
  });
  
  // Store Step 6 values temporarily when Stage 7 is selected
  const [tempStep6Values, setTempStep6Values] = useState(null);
  
  // Function to store Step 6 values temporarily
  const storeStep6ValuesTemporarily = () => {
    console.log('[TempStorage] formData.feedConversionRatio before storing:', formData.feedConversionRatio);
    const step6Values = {
      waterQuality: {
        ph: formData.ph,
        waterTemp: formData.waterTemp,
        minDO: formData.minDO,
        targetMinO2Saturation: formData.targetMinO2Saturation,
        maxTAN: formData.maxTAN,
        maxCO2: formData.maxCO2,
        minTSS: formData.minTSS,
        salinity: formData.salinity,
        alkalinity: formData.alkalinity,
        supplementPureO2: formData.supplementPureO2,
        useRecommendedValues: formData.useRecommendedValues,
        siteElevation: formData.siteElevation
      },
      production: {
        targetSpecies: formData.targetSpecies,
        initialWeight: formData.initialWeightWiG,
        juvenileSize: formData.juvenileSize,
        targetFishWeight: formData.targetFishWeight,
        targetNumFish: formData.targetNumFish,
        productionTarget_t: formData.productionTarget_t,
        harvestFrequency: formData.harvestFrequency,
        tankVolume: formData.tankVolume,
        numTanks: formData.numTanks,
        feedRate: formData.feedRate,
        feedConversionRatio: formData.feedConversionRatio,
        feedProtein: formData.feedProtein
      },
      stageWise: {
        FCR_Stage1: formData.FCR_Stage1,
        FeedProtein_Stage1: formData.FeedProtein_Stage1,
        FCR_Stage2: formData.FCR_Stage2,
        FeedProtein_Stage2: formData.FeedProtein_Stage2,
        FCR_Stage3: formData.FCR_Stage3,
        FeedProtein_Stage3: formData.FeedProtein_Stage3,
        Estimated_mortality_Stage1: formData.Estimated_mortality_Stage1,
        Estimated_mortality_Stage2: formData.Estimated_mortality_Stage2,
        Estimated_mortality_Stage3: formData.Estimated_mortality_Stage3
      },
      systemEfficiency: {
        o2Absorption: formData.o2Absorption,
        tssRemoval: formData.tssRemoval,
        co2Removal: formData.co2Removal,
        tanRemoval: formData.tanRemoval
      }
    };
    
    setTempStep6Values(step6Values);
    console.log('[TempStorage] Feed Conversion Ratio stored:', formData.feedConversionRatio);
    console.log('[TempStorage] Production object feedConversionRatio:', step6Values.production.feedConversionRatio);
  };
  
  // Function to clear temporary Step 6 values
  const clearTempStep6Values = () => {
    setTempStep6Values(null);
    console.log('[TempStorage] Cleared temporary Step 6 values');
  };

  // Keep ref in sync with state (initialized after formData is declared)
  
  // New flow states
  const [showStage7Inputs, setShowStage7Inputs] = useState(false);
  const [stage7FormData, setStage7FormData] = useState({
    mbbr_location: 'Integrated',
    media_to_water_volume_ratio: 0,
    passive_nitrification_rate_stage1_percent: 0,
    passive_nitrification_rate_stage2_percent: 0,
    passive_nitrification_rate_stage3_percent: 0,
    pump_stop_overflow_volume: 0,
    standalone_height_diameter_ratio: 0,
    volumetric_nitrification_rate_vtr: 0,
    num_tanks_stage1: 0,
    num_tanks_stage2: 0,
    num_tanks_stage3: 0,
    tank_dd_ratio_stage1: 0,
    tank_dd_ratio_stage2: 0,
    tank_dd_ratio_stage3: 0,
    tank_freeboard_stage1: 0,
    tank_freeboard_stage2: 0,
    tank_freeboard_stage3: 0
  });

  // Stage 8 form data states

  // Fallback report when Step 6 API is not ready
  const buildZeroAdvancedReport = (projectId) => ({
    project_id: projectId ? Number(projectId) : 0,
    status: 'success',
    step_6: {
      co2: { l_per_min: 0, m3_per_min: 0 },
      oxygen: { mg_per_minute: 0, oc16_mg_per_day: 0, oc17_mg_per_hour: 0 },
      stage2_co2: { l_per_min: 0, m3_per_hr: 0 },
      stage2_oxygen: { l_per_min: 0, m3_per_hr: 0 },
      stage2_tan: { l_per_min: 0, m3_per_hr: 0 },
      stage2_tss: { l_per_min: 0, m3_per_hr: 0 },
      stage3_oxygen: { l_per_min: 0, m3_per_hr: 0 },
      stage3_tss: { l_per_min: 0, m3_per_hr: 0 },
      tan: { l_per_min: 0, m3_per_hr: 0 },
      tss: { l_per_min: 0, m3_per_hr: 0 }
    }
  });

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        // Check for auth token
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('Fetching species list with token:', token.substring(0, 10) + '...');
        const species = await getSpecies();
        console.log('Received species:', species);
        
        if (Array.isArray(species)) {
          // Create a Set to remove duplicates and add index for unique keys
          const uniqueSpecies = [...new Set(species.map(s => s.common_name))];
          setSpeciesList(uniqueSpecies);
        } else if (species && Array.isArray(species.species)) {
          // Create a Set to remove duplicates and add index for unique keys
          const uniqueSpecies = [...new Set(species.species.map(s => s.common_name))];
          setSpeciesList(uniqueSpecies);
        } else {
          console.error('Unexpected species data format:', species);
          setSpeciesList([]);
        }
      } catch (error) {
        console.error('Failed to fetch species list:', error);
        setSpeciesList([]);
        
        // Handle different error cases
        if (error.message === 'Authentication token not found' || 
            error.message.includes('401') || 
            error.message.includes('Unauthorized')) {
          console.log('Auth error detected, redirecting to login');
          // Clear any invalid tokens
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          navigate('/login');
        }
      } finally {
        setLoadingSpecies(false);
      }
    };
    fetchSpecies();
  }, [navigate]);

  // Check user subscription plan
  useEffect(() => {
    const checkUserPlan = async () => {
      try {
        const plan = await getCurrentPlan();
        setUserPlan(plan);
        console.log('User plan:', plan);
        
        // Only show calculation type selection if not in update mode
        const urlParams = new URLSearchParams(location.search);
        const isUpdate = urlParams.get('update') === 'true';
        
        if (!isUpdate) {
        // Show calculation type selection for all users
        setShowCalculationTypeSelection(true);
        }
      } catch (error) {
        console.error('Error checking user plan:', error);
        // Default to Free if error
        setUserPlan('Free');
      } finally {
        setPlanLoaded(true);
      }
    };

    checkUserPlan();
  }, [location]);

  const [error, setError] = useState('');

  const getRecommendedValues2 = async (species) => {
    try {
      const data = await getRecommendedValues(species);
      console.log('Raw recommended values:', data);
      
      // Extract values from the new API response structure
      const speciesParams = data.species_parameters || {};
      const commonParams = data.common_parameters || {};
      const recommendedValues = {};
      
      console.log('Processing species parameters:', speciesParams);
      console.log('Processing common parameters:', commonParams);

      // Helper function to get the best available value with improved handling
      const getBestValue = (param, preferMax = false, customKeys = ['design', 'recommended', 'optimal', 'min', 'max']) => {
        if (!param) return null;
        
        // If param is a direct value (not an object), return it
        if (typeof param !== 'object') {
          return param;
        }
        
        // If customKeys are provided, try them in order
        if (customKeys) {
          for (const key of customKeys) {
            if (param[key] !== undefined && param[key] !== null && param[key] !== '') {
              return param[key];
            }
          }
        }
        
        // For parameters that have min/max, use appropriate logic
        if (param.min !== undefined && param.max !== undefined) {
          // For ranges, prefer design value if available, otherwise use average of min and max
          if (param.design !== undefined && param.design !== null) {
            return param.design;
          }
          if (preferMax) {
            return param.max;
          }
          return (param.min + param.max) / 2;
        }
        
        // If we have min but no max, or max but no min, use that
        if (preferMax && param.max !== undefined && param.max !== null) return param.max;
        if (!preferMax && param.min !== undefined && param.min !== null) return param.min;
        
        return null;
      };

      // Water Quality Parameters from species_parameters
      // Temperature mapping
      const tempValue = getBestValue(speciesParams.temperature, false, ['design', 'min', 'max']);
      console.log('Temperature parameter:', speciesParams.temperature);
      console.log('Calculated temperature value:', tempValue);
      recommendedValues.waterTemp = tempValue;
      
      // ph mapping
      const phValue = getBestValue(speciesParams.ph, false, ['design', 'min', 'max']);
      console.log('ph parameter:', speciesParams.ph);
      console.log('Calculated ph value:', phValue);
      recommendedValues.ph = phValue;
      
      // Salinity mapping
      console.log('🔍 First function - Salinity parameter:', speciesParams.salinity);
      const salinityValue = getBestValue(speciesParams.salinity, false, ['design', 'min', 'max']);
      console.log('🔍 First function - Calculated salinity value:', salinityValue, 'type:', typeof salinityValue);
      recommendedValues.salinity = salinityValue;
      
      // Dissolved oxygen mapping
      const doValue = getBestValue(speciesParams.dissolved_oxygen, false, ['min', 'max']);
      console.log('DO parameter:', speciesParams.dissolved_oxygen);
      console.log('Calculated DO value:', doValue);
      recommendedValues.minDO = doValue;
      
      // Carbon dioxide mapping
      const co2Value = getBestValue(speciesParams.carbon_dioxide, true, ['max']);
      console.log('CO2 parameter:', speciesParams.carbon_dioxide);
      console.log('Calculated CO2 value:', co2Value);
      recommendedValues.maxCO2 = co2Value;
      
      // Total suspended solids mapping
      const tssValue = getBestValue(speciesParams.total_suspended_solids, true, ['max']);
      console.log('TSS parameter:', speciesParams.total_suspended_solids);
      console.log('Calculated TSS value:', tssValue);
      recommendedValues.minTSS = tssValue;
      
      // Total ammonia nitrogen mapping
      const tanValue = getBestValue(speciesParams.total_ammonia_nitrogen, true, ['max']);
      console.log('TAN parameter:', speciesParams.total_ammonia_nitrogen);
      console.log('Calculated TAN value:', tanValue);
      recommendedValues.maxTAN = tanValue;
      
      // Log all mapped values for verification
      console.log('Final mapped values:', {
        waterTemp: recommendedValues.waterTemp,
        ph: recommendedValues.ph,
        salinity: recommendedValues.salinity,
        minDO: recommendedValues.minDO,
        maxCO2: recommendedValues.maxCO2,
        minTSS: recommendedValues.minTSS,
        maxTAN: recommendedValues.maxTAN
      });

      // Production Parameters from common_parameters
      const systemDesign = commonParams.system_design || {};
      const productionTargets = commonParams.production_targets || {};
      
      // Tank Volume (keep as L)
      if (systemDesign.tank_volume_each_l !== undefined && systemDesign.tank_volume_each_l !== null) {
        recommendedValues.tankVolume = systemDesign.tank_volume_each_l;
      }

      // Total Number of Tanks
      if (systemDesign.num_tanks !== undefined && systemDesign.num_tanks !== null) {
        recommendedValues.numTanks = systemDesign.num_tanks;
      }

      // Feed Rate (% body weight per day)
      if (productionTargets.target_feed_rate_percent_bw_day !== undefined && 
          productionTargets.target_feed_rate_percent_bw_day !== null) {
        recommendedValues.feedRate = productionTargets.target_feed_rate_percent_bw_day;
      }

      // Feed Protein Content (%)
      if (productionTargets.feed_protein_percent !== undefined && 
          productionTargets.feed_protein_percent !== null) {
        recommendedValues.feedProtein = productionTargets.feed_protein_percent;
      }

      // Feed Conversion Ratio
      if (productionTargets.feed_conversion_ratio !== undefined && 
          productionTargets.feed_conversion_ratio !== null) {
        recommendedValues.feedConversionRatio = productionTargets.feed_conversion_ratio;
      }

      // Target Number of Fish (mapped from target_max_stocking_density_kg_m3)
      if (productionTargets.target_max_stocking_density_kg_m3 !== undefined && 
          productionTargets.target_max_stocking_density_kg_m3 !== null) {
        recommendedValues.targetNumFish = productionTargets.target_max_stocking_density_kg_m3;
      }

      // Efficiency Parameters from common_parameters
      if (commonParams.removal_efficiencies) {
        const efficiencies = commonParams.removal_efficiencies;
        
        if (efficiencies.o2_absorption !== undefined) {
          recommendedValues.o2Absorption = efficiencies.o2_absorption;
        }
        
        if (efficiencies.tss_removal !== undefined) {
          recommendedValues.tssRemoval = efficiencies.tss_removal;
        }
        
        if (efficiencies.co2_removal !== undefined) {
          recommendedValues.co2Removal = efficiencies.co2_removal;
        }
        
        if (efficiencies.tan_removal !== undefined) {
          recommendedValues.tanRemoval = efficiencies.tan_removal;
        }
      }

      // Biofilter Sizing Parameters from common_parameters
      if (commonParams.biofilter_sizing) {
        const biofilter = commonParams.biofilter_sizing;
        
        if (biofilter.media_to_water_volume_ratio !== undefined) {
          recommendedValues.mediaToWaterVolumeRatio = biofilter.media_to_water_volume_ratio;
        }
        
        if (biofilter.standalone_height_diameter_ratio !== undefined) {
          recommendedValues.standaloneHeightDiameterRatio = biofilter.standalone_height_diameter_ratio;
        }
        
        if (biofilter.volumetric_nitrification_rate_vtr !== undefined) {
          recommendedValues.volumetricNitrificationRateVtr = biofilter.volumetric_nitrification_rate_vtr;
        }
      }

      console.log('Mapped recommended values:', recommendedValues);
      return recommendedValues;
    } catch (err) {
      console.error('Error fetching recommended values:', err);
      setError(`Failed to fetch recommended values: ${err.message}. Please try again or proceed without recommended values.`);
      throw err;
    }
  };

  const [formData, setFormData] = useState({
    // Initial Parameters
    designSystemName: '',
    projectName: '',
    systemPurpose: 'Commercial aquaculture production (monoculture)',
    systemType: 'RAS',
    targetSpecies: '',
    useRecommendedValues: false,
    productionPhase: '',  // Added production phase field

    // Water Quality Parameters
    waterTemp: '', // °C
    ph: '',
    salinity: '', // %
    siteElevation: '',
    minDO: '', // mg/l
    maxCO2: '', // mg/l
    minTSS: '', // mg/l
    maxTAN: '', // mg/L
    targetMinO2Saturation: '', // % - new field
    alkalinity: '', // mg/L - new field
    supplementPureO2: false, // boolean - new field

    // Production Information - Required Fields
    initialWeightWiG: '', // Initial weight wi (g)
    juvenileSize: '', // Size of juveniles at purchase (g)
    targetFishWeight: '', // Target fish weight at harvest (g)
    productionTarget_t: '', // Target production per year (t)
    harvestFrequency: 'Fortnightly', // Harvest frequency
    FCR_Stage1: '', // FCR (Stage1 juvenile)
    FeedProtein_Stage1: '', // Feed protein content (Stage 1) (%)
    FCR_Stage2: '', // FCR (Stage 2 fingerling)
    FeedProtein_Stage2: '', // Feed protein content (Stage 2) (%)
    FCR_Stage3: '', // FCR (Stage 3 growout)
    FeedProtein_Stage3: '', // Feed protein content (Stage 3) (%)
    Estimated_mortality_Stage1: '', // Estimated mortality Stage 1 (%)
    Estimated_mortality_Stage2: '', // Estimated mortality Stage 2 (%)
    Estimated_mortality_Stage3: '', // Estimated mortality Stage 3 (%)
    
    // Production Parameters for Mass Balance
    tankVolume: '', // m³
    numTanks: '',
    targetNumFish: '',
    targetMaxStockingDensity: '', // kg/m³
    feedRate: '', // % of biomass/day
    feedConversionRatio: '', // Feed Conversion Ratio (FCR)
    feedProtein: '', // %

    // Efficiency Parameters
    o2Absorption: '', // %
    tssRemoval: '', // %
    co2Removal: '', // %
    tanRemoval: '', // %

    // Biofilter Sizing Parameters
    mediaToWaterVolumeRatio: '', // Media to water volume ratio
    standaloneHeightDiameterRatio: '', // Standalone height diameter ratio
    volumetricNitrificationRateVtr: '', // Volumetric nitrification rate VTR
  });

  // Sync latest form values for live polling payloads
  useEffect(() => {
    liveFormRef.current = formData;
  }, [formData]);

  // Update tempStep6Values when formData changes (if we're in Stage 7 flow)
  useEffect(() => {
    if (stage7Selected && tempStep6Values && showStage7Inputs) {
      // Update tempStep6Values with latest formData when user changes Step 6 values
      const updatedStep6Values = {
        waterQuality: {
          ph: formData.ph,
          waterTemp: formData.waterTemp,
          minDO: formData.minDO,
          targetMinO2Saturation: formData.targetMinO2Saturation,
          maxTAN: formData.maxTAN,
          maxCO2: formData.maxCO2,
          minTSS: formData.minTSS,
          salinity: formData.salinity,
          alkalinity: formData.alkalinity,
          supplementPureO2: formData.supplementPureO2,
          useRecommendedValues: formData.useRecommendedValues,
          siteElevation: formData.siteElevation
        },
        production: {
          targetSpecies: formData.targetSpecies,
          initialWeight: formData.initialWeightWiG,
          juvenileSize: formData.juvenileSize,
          targetFishWeight: formData.targetFishWeight,
          targetNumFish: formData.targetNumFish,
          productionTarget_t: formData.productionTarget_t,
          harvestFrequency: formData.harvestFrequency,
          tankVolume: formData.tankVolume,
          numTanks: formData.numTanks,
          feedRate: formData.feedRate,
          feedConversionRatio: formData.feedConversionRatio,
          feedProtein: formData.feedProtein
        },
        stageWise: {
          FCR_Stage1: formData.FCR_Stage1,
          FeedProtein_Stage1: formData.FeedProtein_Stage1,
          FCR_Stage2: formData.FCR_Stage2,
          FeedProtein_Stage2: formData.FeedProtein_Stage2,
          FCR_Stage3: formData.FCR_Stage3,
          FeedProtein_Stage3: formData.FeedProtein_Stage3,
          Estimated_mortality_Stage1: formData.Estimated_mortality_Stage1,
          Estimated_mortality_Stage2: formData.Estimated_mortality_Stage2,
          Estimated_mortality_Stage3: formData.Estimated_mortality_Stage3
        },
        systemEfficiency: {
          o2Absorption: formData.o2Absorption,
          tssRemoval: formData.tssRemoval,
          co2Removal: formData.co2Removal,
          tanRemoval: formData.tanRemoval
        }
      };
      
      setTempStep6Values(updatedStep6Values);
      console.log('[TempStorage] Updated Step 6 values with latest formData:', updatedStep6Values);
    }
  }, [formData, stage7Selected, tempStep6Values, showStage7Inputs]);

  // Species list is now fetched from API

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setError(''); // Clear any previous errors
    
    if (name === 'useRecommendedValues') {
      // When checkbox is checked, get recommended values based on selected species
      if (checked && formData.targetSpecies) {
        try {
          console.log('Fetching recommended values for species:', formData.targetSpecies);
          const data = await getRecommendedValues(formData.targetSpecies);
          console.log('Raw API response:', data);
          
          // Extract species parameters
          const params = data.species_parameters || {};
          console.log('Extracted parameters:', params);
          
          // Helper function to get best value
          const getBestValue = (param, preferMax = false) => {
            if (!param) return null;
            
            console.log('🔍 First getBestValue - param.design:', param.design, 'type:', typeof param.design);
            if (param.design !== undefined && param.design !== null) {
              console.log('🔍 First getBestValue - returning design value:', param.design);
              return param.design;
            }
            
            if (param.min !== undefined && param.max !== undefined) {
              if (preferMax) {
                return param.max;
              }
              return (param.min + param.max) / 2;
            }
            
            if (preferMax && param.max !== undefined) {
              return param.max;
            }
            
            if (!preferMax && param.min !== undefined) {
              return param.min;
            }
            
            return null;
          };
          
          // Initialize updatedData with just checkbox state
          const updatedData = {
            useRecommendedValues: checked
          };

          // Extract both species and common parameters
          const speciesParams = data.species_parameters || {};
          const commonParams = data.common_parameters || {};
          
          console.log('Processing species parameters:', speciesParams);
          console.log('Processing common parameters:', commonParams);

          // Water Quality Parameters from species_parameters
          // Temperature - use design value if available, otherwise use min/max average
          if (speciesParams.temperature) {
            const tempValue = speciesParams.temperature.design !== undefined ? 
              speciesParams.temperature.design : 
              (speciesParams.temperature.min + speciesParams.temperature.max) / 2;
            if (tempValue !== undefined && tempValue !== null) {
              updatedData.waterTemp = tempValue.toString();
            }
          }
          
          // pH - use design value if available, otherwise use min/max average
          if (speciesParams.ph) {
            const phValue = speciesParams.ph.design !== undefined ? 
              speciesParams.ph.design : 
              (speciesParams.ph.min + speciesParams.ph.max) / 2;
            if (phValue !== undefined && phValue !== null) {
              updatedData.ph = phValue.toString();
            }
          }
          
          // Salinity - use design value if available, otherwise use min/max average
          if (speciesParams.salinity) {
            const salinityValue = speciesParams.salinity.design !== undefined ? 
              speciesParams.salinity.design : 
              (speciesParams.salinity.min + speciesParams.salinity.max) / 2;
            if (salinityValue !== undefined && salinityValue !== null) {
              updatedData.salinity = salinityValue.toString();
            }
          }
          
          // Dissolved Oxygen - use min value
          if (speciesParams.dissolved_oxygen?.min !== undefined && speciesParams.dissolved_oxygen.min !== null) {
            updatedData.minDO = speciesParams.dissolved_oxygen.min.toString();
          }
          
          // Carbon Dioxide - use max value
          if (speciesParams.carbon_dioxide?.max !== undefined && speciesParams.carbon_dioxide.max !== null) {
            updatedData.maxCO2 = speciesParams.carbon_dioxide.max.toString();
          }
          
          // Total Suspended Solids - use max value
          if (speciesParams.total_suspended_solids?.max !== undefined && speciesParams.total_suspended_solids.max !== null) {
            updatedData.minTSS = speciesParams.total_suspended_solids.max.toString();
          }
          
          // Total Ammonia Nitrogen - use max value
          if (speciesParams.total_ammonia_nitrogen?.max !== undefined && speciesParams.total_ammonia_nitrogen.max !== null) {
            updatedData.maxTAN = speciesParams.total_ammonia_nitrogen.max.toString();
          }

          // Production Parameters from common_parameters
          const systemDesign = commonParams.system_design || {};
          const productionTargets = commonParams.production_targets || {};
          
          // Tank Volume (keep as L)
          if (systemDesign.tank_volume_each_l !== undefined && systemDesign.tank_volume_each_l !== null) {
            console.log('Setting tank volume to:', systemDesign.tank_volume_each_l, 'L');
            updatedData.tankVolume = systemDesign.tank_volume_each_l.toString();
          }

          // Total Number of Tanks
          if (systemDesign.num_tanks !== undefined && systemDesign.num_tanks !== null) {
            console.log('Setting numTanks to:', systemDesign.num_tanks);
            updatedData.numTanks = systemDesign.num_tanks.toString();
          }

          // Feed Rate (% body weight per day)
          if (productionTargets.target_feed_rate_percent_bw_day !== undefined && 
              productionTargets.target_feed_rate_percent_bw_day !== null) {
            console.log('Setting feedRate to:', productionTargets.target_feed_rate_percent_bw_day);
            updatedData.feedRate = productionTargets.target_feed_rate_percent_bw_day.toString();
          }

          // Feed Protein Content (%)
          if (productionTargets.feed_protein_percent !== undefined && 
              productionTargets.feed_protein_percent !== null) {
            console.log('Setting feedProtein to:', productionTargets.feed_protein_percent);
            updatedData.feedProtein = productionTargets.feed_protein_percent.toString();
          }

          // Feed Conversion Ratio
          if (productionTargets.feed_conversion_ratio !== undefined && 
              productionTargets.feed_conversion_ratio !== null) {
            console.log('Setting feedConversionRatio to:', productionTargets.feed_conversion_ratio);
            updatedData.feedConversionRatio = productionTargets.feed_conversion_ratio.toString();
          }

          // Target Number of Fish (mapped from target_max_stocking_density_kg_m3)
          if (productionTargets.target_max_stocking_density_kg_m3 !== undefined && 
              productionTargets.target_max_stocking_density_kg_m3 !== null) {
            console.log('Setting targetNumFish to:', productionTargets.target_max_stocking_density_kg_m3);
            updatedData.targetNumFish = productionTargets.target_max_stocking_density_kg_m3.toString();
          }

          // Efficiency Parameters from common_parameters
          if (commonParams.removal_efficiencies) {
            const efficiencies = commonParams.removal_efficiencies;
            
            if (efficiencies.o2_absorption !== undefined) {
              updatedData.o2Absorption = efficiencies.o2_absorption.toString();
            }
            
            if (efficiencies.tss_removal !== undefined) {
              updatedData.tssRemoval = efficiencies.tss_removal.toString();
            }
            
            if (efficiencies.co2_removal !== undefined) {
              updatedData.co2Removal = efficiencies.co2_removal.toString();
            }
            
            if (efficiencies.tan_removal !== undefined) {
              updatedData.tanRemoval = efficiencies.tan_removal.toString();
            }
          }

          // Biofilter Sizing Parameters from common_parameters
          if (commonParams.biofilter_sizing) {
            const biofilter = commonParams.biofilter_sizing;
            
            if (biofilter.media_to_water_volume_ratio !== undefined) {
              updatedData.mediaToWaterVolumeRatio = biofilter.media_to_water_volume_ratio.toString();
            }
            
            if (biofilter.standalone_height_diameter_ratio !== undefined) {
              updatedData.standaloneHeightDiameterRatio = biofilter.standalone_height_diameter_ratio.toString();
            }
            
            if (biofilter.volumetric_nitrification_rate_vtr !== undefined) {
              updatedData.volumetricNitrificationRateVtr = biofilter.volumetric_nitrification_rate_vtr.toString();
            }
          }
          
          // Log the final values being set
          console.log('Final values to be set:', updatedData);
          // Format numeric values
          Object.keys(updatedData).forEach(key => {
            if (typeof updatedData[key] === 'number') {
              updatedData[key] = Number.isInteger(updatedData[key]) 
                ? updatedData[key].toString()
                : updatedData[key].toFixed(2);
            }
          });
          
          console.log('Calculated values to update:', updatedData);
          
          // Filter out only production phase selection, but keep mass balance production parameters
          const productionPhaseFields = [
            'productionPhase'    // Only exclude production phase selection
          ];
          
          const filteredData = Object.keys(updatedData).reduce((acc, key) => {
            if (!productionPhaseFields.includes(key)) {
              acc[key] = updatedData[key];
            }
            return acc;
          }, {});

          // Update form data with all parameters including mass balance production parameters
          setFormData(prev => {
            const newData = {
              ...prev,
              ...filteredData
            };
            console.log('New form data (including mass balance production parameters):', newData);
            return newData;
          });
        } catch (err) {
          console.error('Error fetching recommended values:', err);
          // If fetching fails, uncheck the box and keep current values
          // On error, just uncheck the box and keep current values
          setFormData(prev => ({
            ...prev,
            useRecommendedValues: false
          }));
          setError('Failed to fetch recommended values. Please try again or proceed without recommended values.');
        }
      } else if (checked && !formData.targetSpecies) {
        // If checkbox is checked but no species is selected
        setError('Please select a target species first.');
        setFormData(prev => ({
          ...prev,
          useRecommendedValues: false
        }));
      } else {
        // When unchecked, keep current values but enable editing
        setFormData(prev => ({
          ...prev,
          useRecommendedValues: false
        }));
      }
    } else if (name === 'targetSpecies') {
      // When species changes, first update the species value
      setFormData(prev => ({
        ...prev,
        targetSpecies: value,
        // Reset recommended values when species changes
        useRecommendedValues: false
      }));

      // Clear any previous error
      setError('');
    } else {
      // Normal input handling
      if (name === 'initialWeightWiG') {
        console.log('🔍 Initial Weight Input Change:', { name, value, type, checked });
        console.log('🔍 Current formData.initialWeightWiG:', formData.initialWeightWiG);
      }
      setFormData(prev => {
        const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
        if (name === 'initialWeightWiG') {
          console.log('🔍 Updated formData.initialWeightWiG:', next.initialWeightWiG);
        }
        // Update live ref immediately so debounced call sees latest keystroke
        liveFormRef.current = next;
        return next;
      });
    }

    // Note: Water quality POST API will only be called during final calculation (Calculate Advanced Report)
    // No need to persist species immediately when selected

    // Trigger debounced live calculation for basic flow on each keystroke
    if (calculationType === 'basic') {
      console.log('[LiveCalc] Basic flow live calculation triggered for field:', name);
      if (liveDebounceRef.current) {
        clearTimeout(liveDebounceRef.current);
      }
      liveDebounceRef.current = setTimeout(() => {
        // Ensure liveFormRef has the latest values before running calculations
        const latestFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };
        liveFormRef.current = latestFormData;
        console.log('[LiveCalc] Running live calculations with projectId:', designIds.projectId);
        runLiveCalculations();
      }, 400);
    }

    // Trigger debounced live calculation for advanced flow on each keystroke
    if (calculationType === 'advanced' && showAdvancedFields && !showStage7Inputs) {
      console.log('[AdvancedLiveCalc] Advanced flow live calculation triggered for field:', name);
      if (liveDebounceRef.current) {
        clearTimeout(liveDebounceRef.current);
      }
      liveDebounceRef.current = setTimeout(() => {
        console.log('[AdvancedLiveCalc] Triggering live calculation for Step 6');
        // Ensure we have the latest form data including the current input change
        const latestFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };
        liveFormRef.current = latestFormData;
        console.log('[AdvancedLiveCalc] Running advanced live calculations with projectId:', designIds.projectId);
        runAdvancedLiveCalculations(latestFormData);
      }, 400);
    }

    // Trigger debounced live calculation for Stage 7 inputs
    if (calculationType === 'advanced' && showStage7Inputs) {
      console.log('[AdvancedStage7LiveCalc] Stage 7 live calculation triggered for field:', name);
      if (liveDebounceRef.current) {
        clearTimeout(liveDebounceRef.current);
      }
      liveDebounceRef.current = setTimeout(() => {
        console.log('[AdvancedStage7LiveCalc] Triggering live calculation for Stage 7');
        // Ensure we have the latest form data including the current input change
        const latestFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };
        liveFormRef.current = latestFormData;
        
        // Ensure we have the latest Stage 7 form data including the current input change
        const latestStage7FormData = { ...stage7FormData, [name]: type === 'checkbox' ? checked : value };
        console.log('[AdvancedStage7LiveCalc] Latest Stage 7 form data:', latestStage7FormData);
        console.log('[AdvancedStage7LiveCalc] Running Stage 7 live calculations with projectId:', designIds.projectId);
        
        runAdvancedStage7LiveCalculations(latestFormData, latestStage7FormData);
      }, 400);
    }
  };

  // Map current formData to live API payload
  const buildLiveInputsPayload = (formDataToUse = null) => {
    const d = formDataToUse || liveFormRef.current || {};
    
    // Debug: Log the critical values
    console.log('[LiveCalc] Critical values check:', {
      tankVolume: d.tankVolume,
      numTanks: d.numTanks,
      feedRate: d.feedRate,
      targetFishWeight: d.targetFishWeight,
      targetNumFish: d.targetNumFish,
      waterTemp: d.waterTemp,
      salinity: d.salinity,
      siteElevation: d.siteElevation
    });
    
    // Helper function to safely parse values - only include if they have actual values
    const safeParseFloat = (value) => {
      const parsed = parseFloat(value ?? '');
      return isNaN(parsed) || parsed === 0 ? null : parsed;
    };
    
    const safeParseInt = (value) => {
      const parsed = parseInt(value ?? '', 10);
      return isNaN(parsed) || parsed === 0 ? null : parsed;
    };
    
    const inputs = {
      // Only include values that are actually provided and non-zero
      ...(d.maxTAN && { TAN_max: parseFloat(d.maxTAN) }),
      ...(d.minTSS && { TSS_max: parseFloat(d.minTSS) }),
      ...(d.alkalinity && { alkalinity: parseFloat(d.alkalinity) }),
      ...(d.co2Removal && { co2_removal_efficiency: parseFloat(d.co2Removal) }),
      ...(d.maxCO2 && { dissolved_CO2_max: parseFloat(d.maxCO2) }),
      ...(d.minDO && { dissolved_O2_min: parseFloat(d.minDO) }),
      ...(d.siteElevation && { elevation_m: parseFloat(d.siteElevation) }),
      ...(d.Estimated_mortality_Stage1 && { estimated_mortality_stage1: parseFloat(d.Estimated_mortality_Stage1) }),
      ...(d.Estimated_mortality_Stage2 && { estimated_mortality_stage2: parseFloat(d.Estimated_mortality_Stage2) }),
      ...(d.Estimated_mortality_Stage3 && { estimated_mortality_stage3: parseFloat(d.Estimated_mortality_Stage3) }),
      ...(d.FCR_Stage1 && { fcr_stage1: parseFloat(d.FCR_Stage1) }),
      ...(d.FCR_Stage2 && { fcr_stage2: parseFloat(d.FCR_Stage2) }),
      ...(d.FCR_Stage3 && { fcr_stage3: parseFloat(d.FCR_Stage3) }),
      ...(d.feedRate && { feed_conversion_ratio: parseFloat(d.feedRate) }),
      ...(d.feedConversionRatio && { feed_conversion_ratio: parseFloat(d.feedConversionRatio) }),
      ...(d.feedProtein && { feed_protein_percent: parseFloat(d.feedProtein) }),
      ...(d.FeedProtein_Stage1 && { feed_protein_stage1: parseFloat(d.FeedProtein_Stage1) }),
      ...(d.FeedProtein_Stage2 && { feed_protein_stage2: parseFloat(d.FeedProtein_Stage2) }),
      ...(d.FeedProtein_Stage3 && { feed_protein_stage3: parseFloat(d.FeedProtein_Stage3) }),
      ...(d.harvestFrequency && { harvest_frequency: d.harvestFrequency }),
      ...(d.initialWeightWiG && { initial_weight_wi_g: parseFloat(d.initialWeightWiG) }),
      ...(d.initialWeight && !d.initialWeightWiG && { initial_weight_wi_g: parseFloat(d.initialWeight) }),
      ...(d.juvenileSize && { juvenile_size: parseFloat(d.juvenileSize) }),
      ...(d.numTanks && { number_of_tanks: parseInt(d.numTanks, 10) }),
      ...(d.o2Absorption && { oxygen_injection_efficiency: parseFloat(d.o2Absorption) }),
      ...(d.ph && { ph: parseFloat(d.ph) }),
      ...(d.productionTarget_t && { production_target_t: parseFloat(d.productionTarget_t) }),
      ...(d.salinity && { salinity: parseFloat(d.salinity) }),
      ...(d.targetSpecies && { species: d.targetSpecies }),
      supplement_pure_o2: true, // Always include this boolean
      ...(d.tanRemoval && { tan_removal_efficiency: parseFloat(d.tanRemoval) }),
      ...(d.tankVolume && { tanks_volume_each: parseFloat(d.tankVolume) }),
      ...(d.feedRate && { target_feed_rate: parseFloat(d.feedRate) }),
      ...(d.targetFishWeight && { target_market_fish_size: parseFloat(d.targetFishWeight) }),
      ...(d.targetNumFish && { target_max_stocking_density: parseFloat(d.targetNumFish) }),
      ...(d.targetMinO2Saturation && { target_min_o2_saturation: parseFloat(d.targetMinO2Saturation) }),
      ...(d.waterTemp && { temperature: parseFloat(d.waterTemp) }),
      ...(d.tssRemoval && { tss_removal_efficiency: parseFloat(d.tssRemoval) }),
      supplement_pure_o2: Boolean(d.supplementPureO2), // Always include this boolean
      use_recommended: Boolean(d.useRecommendedValues) // Always include this boolean
    };
    
    console.log('[LiveCalc] Built payload:', inputs);
    
    return {
      include_intermediates: false,
      inputs
    };
  };

  // Build live API payload for Step 7 live API (Stage 7 inputs page)
  const buildStep7LiveInputsPayload = (step6Values, stage7Values = null) => {
    const step6 = step6Values || {};
    const stage7 = stage7Values || {};
    
    console.log('[Step7LiveCalc] Building Step 7 payload from Step 6:', step6);
    console.log('[Step7LiveCalc] Building Step 7 payload from Stage 7:', stage7);
    
    // Step 7 live API expects ALL Step 6 parameters PLUS Step 7 parameters
    const payload = {
      // Basic Water Quality Parameters
      ph: step6.waterQuality?.ph ? parseFloat(step6.waterQuality.ph) : 0,
      temperature: step6.waterQuality?.waterTemp ? parseFloat(step6.waterQuality.waterTemp) : 0,
      dissolved_O2_min: step6.waterQuality?.minDO ? parseFloat(step6.waterQuality.minDO) : 0,
      target_min_o2_saturation: step6.waterQuality?.targetMinO2Saturation ? parseFloat(step6.waterQuality.targetMinO2Saturation) : 0,
      TAN_max: step6.waterQuality?.maxTAN ? parseFloat(step6.waterQuality.maxTAN) : 0,
      dissolved_CO2_max: step6.waterQuality?.maxCO2 ? parseFloat(step6.waterQuality.maxCO2) : 0,
      TSS_max: step6.waterQuality?.minTSS ? parseFloat(step6.waterQuality.minTSS) : 0,
      salinity: step6.waterQuality?.salinity ? parseFloat(step6.waterQuality.salinity) : 0,
      alkalinity: step6.waterQuality?.alkalinity ? parseFloat(step6.waterQuality.alkalinity) : 0,
      supplement_pure_o2: step6.waterQuality?.supplementPureO2 !== undefined ? Boolean(step6.waterQuality.supplementPureO2) : false,
      elevation_m: step6.waterQuality?.siteElevation ? parseFloat(step6.waterQuality.siteElevation) : 0,

      // Removal/Absorption Efficiencies
      oxygen_injection_efficiency: step6.systemEfficiency?.o2Absorption ? parseFloat(step6.systemEfficiency.o2Absorption) : 0,
      tss_removal_efficiency: step6.systemEfficiency?.tssRemoval ? parseFloat(step6.systemEfficiency.tssRemoval) : 0,
      co2_removal_efficiency: step6.systemEfficiency?.co2Removal ? parseFloat(step6.systemEfficiency.co2Removal) : 0,
      tan_removal_efficiency: step6.systemEfficiency?.tanRemoval ? parseFloat(step6.systemEfficiency.tanRemoval) : 0,

      // Species and Production
      species: step6.production?.targetSpecies || '',
      initial_weight_wi_g: step6.production?.initialWeight ? parseFloat(step6.production.initialWeight) : 0,
      target_market_fish_size: step6.production?.targetFishWeight ? parseFloat(step6.production.targetFishWeight) : 0,

      // Step 6 Production Parameters
      production_target_t: step6.production?.productionTarget_t ? parseFloat(step6.production.productionTarget_t) : 0,
      harvest_frequency: step6.production?.harvestFrequency || "Fortnightly",
      fcr_stage1: step6.stageWise?.FCR_Stage1 ? parseFloat(step6.stageWise.FCR_Stage1) : 0,
      feed_protein_stage1: step6.stageWise?.FeedProtein_Stage1 ? parseFloat(step6.stageWise.FeedProtein_Stage1) : 0,
      fcr_stage2: step6.stageWise?.FCR_Stage2 ? parseFloat(step6.stageWise.FCR_Stage2) : 0,
      feed_protein_stage2: step6.stageWise?.FeedProtein_Stage2 ? parseFloat(step6.stageWise.FeedProtein_Stage2) : 0,
      fcr_stage3: step6.stageWise?.FCR_Stage3 ? parseFloat(step6.stageWise.FCR_Stage3) : 0,
      feed_protein_stage3: step6.stageWise?.FeedProtein_Stage3 ? parseFloat(step6.stageWise.FeedProtein_Stage3) : 0,
      estimated_mortality_stage1: step6.stageWise?.Estimated_mortality_Stage1 ? parseFloat(step6.stageWise.Estimated_mortality_Stage1) : 0,
      estimated_mortality_stage2: step6.stageWise?.Estimated_mortality_Stage2 ? parseFloat(step6.stageWise.Estimated_mortality_Stage2) : 0,
      estimated_mortality_stage3: step6.stageWise?.Estimated_mortality_Stage3 ? parseFloat(step6.stageWise.Estimated_mortality_Stage3) : 0,

      // Basic Production Parameters
      number_of_tanks: step6.production?.numTanks ? parseFloat(step6.production.numTanks) : 0,
      tanks_volume_each: step6.production?.tankVolume ? parseFloat(step6.production.tankVolume) : 0,
      target_max_stocking_density: step6.production?.targetNumFish ? parseFloat(step6.production.targetNumFish) : 0,
      target_feed_rate: step6.production?.feedRate ? parseFloat(step6.production.feedRate) : 0,
      // Prefer explicit Feed Conversion Ratio from production; fallback to Stage 1 FCR
      feed_conversion_ratio: (() => {
        const prodFCR = step6.production?.feedConversionRatio;
        const stage1FCR = step6.stageWise?.FCR_Stage1;
        
        // Check if production FCR exists and is not empty
        if (prodFCR !== undefined && prodFCR !== null && prodFCR !== '' && !isNaN(parseFloat(prodFCR))) {
          return parseFloat(prodFCR);
        } else if (stage1FCR !== undefined && stage1FCR !== null && stage1FCR !== '' && !isNaN(parseFloat(stage1FCR))) {
          return parseFloat(stage1FCR);
        } else {
          return 0;
        }
      })(),
      feed_protein_percent: step6.production?.feedProtein ? parseFloat(step6.production.feedProtein) : 0,

      // Step 7 Biofilter/MBBR Parameters
      volumetric_nitrification_rate_vtr: stage7.volumetric_nitrification_rate_vtr ? parseFloat(stage7.volumetric_nitrification_rate_vtr) : 0,
      media_to_water_volume_ratio: stage7.media_to_water_volume_ratio ? parseFloat(stage7.media_to_water_volume_ratio) : 0,
      mbbr_location: stage7.mbbr_location || "Integrated",
      standalone_height_diameter_ratio: stage7.standalone_height_diameter_ratio ? parseFloat(stage7.standalone_height_diameter_ratio) : 0,
      pump_stop_overflow_volume: stage7.pump_stop_overflow_volume ? parseFloat(stage7.pump_stop_overflow_volume) : 0,
      passive_nitrification_rate_stage1_percent: stage7.passive_nitrification_rate_stage1_percent ? parseFloat(stage7.passive_nitrification_rate_stage1_percent) : 0,
      passive_nitrification_rate_stage2_percent: stage7.passive_nitrification_rate_stage2_percent ? parseFloat(stage7.passive_nitrification_rate_stage2_percent) : 0,
      passive_nitrification_rate_stage3_percent: stage7.passive_nitrification_rate_stage3_percent ? parseFloat(stage7.passive_nitrification_rate_stage3_percent) : 0,

      // Step 4 Tank Design Parameters (required for Fish Holding Tank Design)
      num_tanks_stage1: stage7.num_tanks_stage1 ? parseInt(stage7.num_tanks_stage1) : 0,
      num_tanks_stage2: stage7.num_tanks_stage2 ? parseInt(stage7.num_tanks_stage2) : 0,
      num_tanks_stage3: stage7.num_tanks_stage3 ? parseInt(stage7.num_tanks_stage3) : 0,
      tank_dd_ratio_stage1: stage7.tank_dd_ratio_stage1 ? parseFloat(stage7.tank_dd_ratio_stage1) : 0,
      tank_dd_ratio_stage2: stage7.tank_dd_ratio_stage2 ? parseFloat(stage7.tank_dd_ratio_stage2) : 0,
      tank_dd_ratio_stage3: stage7.tank_dd_ratio_stage3 ? parseFloat(stage7.tank_dd_ratio_stage3) : 0,
      tank_freeboard_stage1: stage7.tank_freeboard_stage1 ? parseFloat(stage7.tank_freeboard_stage1) : 0,
      tank_freeboard_stage2: stage7.tank_freeboard_stage2 ? parseFloat(stage7.tank_freeboard_stage2) : 0,
      tank_freeboard_stage3: stage7.tank_freeboard_stage3 ? parseFloat(stage7.tank_freeboard_stage3) : 0
    };
    
    console.log('[Step7LiveCalc] Built flat payload:', payload);
    
    return {
      include_intermediates: false,
      inputs: payload
    };
  };

  // Build live API payload for advanced calculations (Step 6 + Stage 7)
  const buildAdvancedLiveInputsPayload = (step6Values, stage7Values = null) => {
    const step6 = step6Values || {};
    const stage7 = stage7Values || {};
    
    console.log('[AdvancedLiveCalc] Building payload from Step 6:', step6);
    console.log('[AdvancedLiveCalc] Building payload from Stage 7:', stage7);
    
    // Combine Step 6 and Stage 7 values
    const inputs = {
      // Water Quality (from Step 6)
      ...(step6.waterQuality?.ph && step6.waterQuality.ph.toString().trim() !== '' && { ph: parseFloat(step6.waterQuality.ph) }),
      ...(step6.waterQuality?.waterTemp && step6.waterQuality.waterTemp.toString().trim() !== '' && { temperature: parseFloat(step6.waterQuality.waterTemp) }),
      ...(step6.waterQuality?.minDO && step6.waterQuality.minDO.toString().trim() !== '' && { dissolved_O2_min: parseFloat(step6.waterQuality.minDO) }),
      ...(step6.waterQuality?.targetMinO2Saturation && step6.waterQuality.targetMinO2Saturation.toString().trim() !== '' && { target_min_o2_saturation: parseFloat(step6.waterQuality.targetMinO2Saturation) }),
      ...(step6.waterQuality?.maxTAN && step6.waterQuality.maxTAN.toString().trim() !== '' && { TAN_max: parseFloat(step6.waterQuality.maxTAN) }),
      ...(step6.waterQuality?.maxCO2 && step6.waterQuality.maxCO2.toString().trim() !== '' && { dissolved_CO2_max: parseFloat(step6.waterQuality.maxCO2) }),
      ...(step6.waterQuality?.minTSS && step6.waterQuality.minTSS.toString().trim() !== '' && { TSS_max: parseFloat(step6.waterQuality.minTSS) }),
      ...(step6.waterQuality?.salinity && step6.waterQuality.salinity.toString().trim() !== '' && { salinity: parseFloat(step6.waterQuality.salinity) }),
      ...(step6.waterQuality?.alkalinity && step6.waterQuality.alkalinity.toString().trim() !== '' && { alkalinity: parseFloat(step6.waterQuality.alkalinity) }),
      ...(step6.waterQuality?.supplementPureO2 !== undefined && { supplement_pure_o2: Boolean(step6.waterQuality.supplementPureO2) }),
      ...(step6.waterQuality?.siteElevation && step6.waterQuality.siteElevation.toString().trim() !== '' && { elevation_m: parseFloat(step6.waterQuality.siteElevation) }),
      
      // Production (from Step 6)
      ...(step6.production?.targetSpecies && step6.production.targetSpecies.toString().trim() !== '' && { species: step6.production.targetSpecies }),
      ...(step6.production?.initialWeight && step6.production.initialWeight.toString().trim() !== '' && { initial_weight_wi_g: parseFloat(step6.production.initialWeight) }),
      ...(step6.production?.targetFishWeight && step6.production.targetFishWeight.toString().trim() !== '' && { target_market_fish_size: parseFloat(step6.production.targetFishWeight) }),
      target_max_stocking_density: step6.production?.targetNumFish ? Number(step6.production.targetNumFish) : 0,
      ...(step6.production?.productionTarget_t && step6.production.productionTarget_t.toString().trim() !== '' && { production_target_t: parseFloat(step6.production.productionTarget_t) }),
      ...(step6.production?.harvestFrequency && step6.production.harvestFrequency.toString().trim() !== '' && { harvest_frequency: step6.production.harvestFrequency }),
      ...(step6.production?.tankVolume && step6.production.tankVolume.toString().trim() !== '' && { tanks_volume_each: parseFloat(step6.production.tankVolume) }),
      ...(step6.production?.numTanks && step6.production.numTanks.toString().trim() !== '' && { number_of_tanks: parseFloat(step6.production.numTanks) }),
      ...(step6.production?.feedRate && step6.production.feedRate.toString().trim() !== '' && { target_feed_rate: parseFloat(step6.production.feedRate) }),
      feed_conversion_ratio: step6.production?.feedConversionRatio ? parseFloat(step6.production.feedConversionRatio) : 0,
      ...(step6.production?.feedProtein && step6.production.feedProtein.toString().trim() !== '' && { feed_protein_percent: parseFloat(step6.production.feedProtein) }),
      
      // Stage-wise parameters (from Step 6)
      ...(step6.stageWise?.FCR_Stage1 && step6.stageWise.FCR_Stage1.toString().trim() !== '' && { fcr_stage1: parseFloat(step6.stageWise.FCR_Stage1) }),
      ...(step6.stageWise?.FeedProtein_Stage1 && step6.stageWise.FeedProtein_Stage1.toString().trim() !== '' && { feed_protein_stage1: parseFloat(step6.stageWise.FeedProtein_Stage1) }),
      ...(step6.stageWise?.FCR_Stage2 && step6.stageWise.FCR_Stage2.toString().trim() !== '' && { fcr_stage2: parseFloat(step6.stageWise.FCR_Stage2) }),
      ...(step6.stageWise?.FeedProtein_Stage2 && step6.stageWise.FeedProtein_Stage2.toString().trim() !== '' && { feed_protein_stage2: parseFloat(step6.stageWise.FeedProtein_Stage2) }),
      ...(step6.stageWise?.FCR_Stage3 && step6.stageWise.FCR_Stage3.toString().trim() !== '' && { fcr_stage3: parseFloat(step6.stageWise.FCR_Stage3) }),
      ...(step6.stageWise?.FeedProtein_Stage3 && step6.stageWise.FeedProtein_Stage3.toString().trim() !== '' && { feed_protein_stage3: parseFloat(step6.stageWise.FeedProtein_Stage3) }),
      ...(step6.stageWise?.Estimated_mortality_Stage1 && step6.stageWise.Estimated_mortality_Stage1.toString().trim() !== '' && { estimated_mortality_stage1: parseFloat(step6.stageWise.Estimated_mortality_Stage1) }),
      ...(step6.stageWise?.Estimated_mortality_Stage2 && step6.stageWise.Estimated_mortality_Stage2.toString().trim() !== '' && { estimated_mortality_stage2: parseFloat(step6.stageWise.Estimated_mortality_Stage2) }),
      ...(step6.stageWise?.Estimated_mortality_Stage3 && step6.stageWise.Estimated_mortality_Stage3.toString().trim() !== '' && { estimated_mortality_stage3: parseFloat(step6.stageWise.Estimated_mortality_Stage3) }),
      
      // System Efficiency (from Step 6)
      ...(step6.systemEfficiency?.o2Absorption && step6.systemEfficiency.o2Absorption.toString().trim() !== '' && { oxygen_injection_efficiency: parseFloat(step6.systemEfficiency.o2Absorption) }),
      ...(step6.systemEfficiency?.tssRemoval && step6.systemEfficiency.tssRemoval.toString().trim() !== '' && { tss_removal_efficiency: parseFloat(step6.systemEfficiency.tssRemoval) }),
      ...(step6.systemEfficiency?.co2Removal && step6.systemEfficiency.co2Removal.toString().trim() !== '' && { co2_removal_efficiency: parseFloat(step6.systemEfficiency.co2Removal) }),
      ...(step6.systemEfficiency?.tanRemoval && step6.systemEfficiency.tanRemoval.toString().trim() !== '' && { tan_removal_efficiency: parseFloat(step6.systemEfficiency.tanRemoval) }),
      
      // Stage 7 parameters (only include when stage7Values is provided)
      ...(stage7Values && {
        // Biofilter parameters
        mbbr_location: stage7.mbbr_location || 'Integrated',
        media_to_water_volume_ratio: parseFloat(stage7.media_to_water_volume_ratio) || 0,
        passive_nitrification_rate_stage1_percent: parseFloat(stage7.passive_nitrification_rate_stage1_percent) || 0,
        passive_nitrification_rate_stage2_percent: parseFloat(stage7.passive_nitrification_rate_stage2_percent) || 0,
        passive_nitrification_rate_stage3_percent: parseFloat(stage7.passive_nitrification_rate_stage3_percent) || 0,
        pump_stop_overflow_volume: parseFloat(stage7.pump_stop_overflow_volume) || 0,
        ...(stage7.standalone_height_diameter_ratio && stage7.standalone_height_diameter_ratio.toString().trim() !== '' && { standalone_height_diameter_ratio: parseFloat(stage7.standalone_height_diameter_ratio) }),
        ...(stage7.volumetric_nitrification_rate_vtr && stage7.volumetric_nitrification_rate_vtr.toString().trim() !== '' && { volumetric_nitrification_rate_vtr: parseFloat(stage7.volumetric_nitrification_rate_vtr) }),
        
        // Tank design parameters
        ...(stage7.num_tanks_stage1 && stage7.num_tanks_stage1.toString().trim() !== '' && { num_tanks_stage1: parseInt(stage7.num_tanks_stage1) }),
        ...(stage7.num_tanks_stage2 && stage7.num_tanks_stage2.toString().trim() !== '' && { num_tanks_stage2: parseInt(stage7.num_tanks_stage2) }),
        ...(stage7.num_tanks_stage3 && stage7.num_tanks_stage3.toString().trim() !== '' && { num_tanks_stage3: parseInt(stage7.num_tanks_stage3) }),
        ...(stage7.tank_dd_ratio_stage1 && stage7.tank_dd_ratio_stage1.toString().trim() !== '' && { tank_dd_ratio_stage1: parseFloat(stage7.tank_dd_ratio_stage1) }),
        ...(stage7.tank_dd_ratio_stage2 && stage7.tank_dd_ratio_stage2.toString().trim() !== '' && { tank_dd_ratio_stage2: parseFloat(stage7.tank_dd_ratio_stage2) }),
        ...(stage7.tank_dd_ratio_stage3 && stage7.tank_dd_ratio_stage3.toString().trim() !== '' && { tank_dd_ratio_stage3: parseFloat(stage7.tank_dd_ratio_stage3) }),
        ...(stage7.tank_freeboard_stage1 && stage7.tank_freeboard_stage1.toString().trim() !== '' && { tank_freeboard_stage1: parseFloat(stage7.tank_freeboard_stage1) }),
        ...(stage7.tank_freeboard_stage2 && stage7.tank_freeboard_stage2.toString().trim() !== '' && { tank_freeboard_stage2: parseFloat(stage7.tank_freeboard_stage2) }),
        ...(stage7.tank_freeboard_stage3 && stage7.tank_freeboard_stage3.toString().trim() !== '' && { tank_freeboard_stage3: parseFloat(stage7.tank_freeboard_stage3) })
      }),
      
      // Always include these parameters
      supplement_pure_o2: Boolean(step6.waterQuality?.supplementPureO2),
      use_recommended: Boolean(step6.waterQuality?.useRecommendedValues),
      type: 'advanced'
    };
    
    console.log('[AdvancedLiveCalc] Built payload:', inputs);
    
    return {
      include_intermediates: false,
      inputs
    };
  };

  // Debounced runner with abort of stale requests
  const runLiveCalculations = async () => {
    try {
      // Use liveFormRef.current which should have the latest values
      const currentFormData = liveFormRef.current || formData;
      
      // Debug: Log current form data
      console.log('[LiveCalc] Current formData:', formData);
      console.log('[LiveCalc] Current liveFormRef.current:', liveFormRef.current);
      console.log('[LiveCalc] Using currentFormData for calculations:', currentFormData);
      
      // Require species and project to be available; otherwise skip live call
      const projectId = designIds.projectId;
      const species = (currentFormData.targetSpecies || '').trim();
      console.log('[LiveCalc] Checking requirements:', { projectId, species, isUpdateFlow, calculationType });
      
      // For basic flow, we need to be more lenient since project creation happens later
      if (!projectId || !species) {
        console.warn('[LiveCalc] Skipping live call: missing project/species', { projectId, species });
        return;
      }
      
      // For basic flow, don't require species to be persisted yet since it happens during design creation
      if (!speciesSavedRef.current && !isUpdateFlow && calculationType === 'advanced') {
        console.warn('[LiveCalc] Species not yet persisted to project; attempting persisted live may fail');
        return;
      }
      
      // For basic flow, we can try the live call even if species isn't persisted yet
      if (!speciesSavedRef.current && !isUpdateFlow && calculationType === 'basic') {
        console.log('[LiveCalc] Basic flow: attempting live call without species persistence');
      }
      
      // Check minimum values; warn but do not block the call since payload omits empties
      const d = currentFormData || {};
      const hasMinimumValues = d.tankVolume && d.numTanks && d.feedRate && d.targetFishWeight;
      if (!hasMinimumValues) {
        console.warn('[LiveCalc] Proceeding without some minimum values (payload will omit empties).');
        console.log('[LiveCalc] Required values check:', {
          tankVolume: d.tankVolume,
          numTanks: d.numTanks,
          feedRate: d.feedRate,
          targetFishWeight: d.targetFishWeight
        });
      }

      // Abort previous in-flight request
      if (liveAbortRef.current) {
        liveAbortRef.current.abort();
      }
      const controller = new AbortController();
      liveAbortRef.current = controller;

      const payload = buildLiveInputsPayload(currentFormData);
      const data = await postLiveProductionCalculations(projectId, payload, controller.signal);

      // Map response.values & fields_ready into our dynamic panel structure
      const ready = data.fields_ready || {};
      const values = data.values || {};
      const step6 = data.step_6 || {};
      const step8 = data.step_8 || {};

      // Debug: Log the actual API response structure
      console.log('[LiveCalc] API Response Debug:', {
        fields_ready: ready,
        values: values,
        step6: step6,
        step8: step8,
        allKeys: Object.keys(values || {}),
        tssKeys: Object.keys(values || {}).filter(key => key.includes('tss')),
        co2Keys: Object.keys(values || {}).filter(key => key.includes('co2')),
        tanKeys: Object.keys(values || {}).filter(key => key.includes('tan'))
      });

      const nextLive = {};
      
      // Mass Balance Data
      // Oxygen
      if (ready.o2_saturation_adjusted_mg_l || ready.oxygen_effluent_concentration_mg_l || ready.oxygen_consumption_production_mg_per_day || ready.oxygen_consumption_production_kg_per_day) {
        nextLive.oxygen = {
          status: 'populated',
          data: {
            saturationAdjustedMgL: values.o2_saturation_adjusted_mg_l,
            effluentMgL: values.oxygen_effluent_concentration_mg_l,
            consMgPerDay: values.oxygen_consumption_production_mg_per_day,
            consKgPerDay: values.oxygen_consumption_production_kg_per_day,
              MINDO_use: currentFormData.minDO ? parseFloat(currentFormData.minDO) : undefined
          }
        };
      }
      // TSS
      if (ready.tss_effluent_concentration_mg_l || ready.tss_production_mg || ready.tss_production_kg) {
        nextLive.tss = {
          status: 'populated',
          data: {
            effluentMgL: values.tss_effluent_concentration_mg_l,
            prodMgPerDay: values.tss_production_mg,
            prodKgPerDay: values.tss_production_kg,
            MAXTSS_use: currentFormData.minTSS ? parseFloat(currentFormData.minTSS) : undefined
          }
        };
      }
      // CO2
      if (ready.co2_effluent_concentration_mg_l || ready.co2_production_mg_per_day || ready.co2_production_kg_per_day) {
        nextLive.co2 = {
          status: 'populated',
          data: {
            effluentMgL: values.co2_effluent_concentration_mg_l,
            prodMgPerDay: values.co2_production_mg_per_day,
            prodKgPerDay: values.co2_production_kg_per_day,
              MAXCO2_use: currentFormData.maxCO2 ? parseFloat(currentFormData.maxCO2) : undefined
          }
        };
      }
      // TAN
      if (ready.tan_effluent_concentration_mg_l || ready.tan_production_mg_per_day || ready.tan_production_kg_per_day) {
        nextLive.tan = {
          status: 'populated',
          data: {
            effluentMgL: values.tan_effluent_concentration_mg_l,
            prodMgPerDay: values.tan_production_mg_per_day,
            prodKgPerDay: values.tan_production_kg_per_day,
              MAXTAN_use: currentFormData.maxTAN ? parseFloat(currentFormData.maxTAN) : undefined
          }
        };
      }

      // Stage 6 Data (Stage 1 only for basic calculations)
      if (ready.step_6 && step6.oxygen && step6.co2 && step6.tan && step6.tss) {
        nextLive.stage6 = {
          status: 'populated',
          data: {
            // Map Stage 1 data to the format expected by the UI
            oxygen_l_per_min: step6.oxygen.l_per_min,
            oxygen_m3_per_hr: step6.oxygen.m3_per_hr,
            co2_l_per_min: step6.co2.l_per_min,
            co2_m3_per_hr: step6.co2.m3_per_hr,
            tan_l_per_min: step6.tan.l_per_min,
            tan_m3_per_hr: step6.tan.m3_per_hr,
            tss_l_per_min: step6.tss.l_per_min,
            tss_m3_per_hr: step6.tss.m3_per_hr
          }
        };
      }

      // Stage 8 Data (Pump Calculations)
      if (ready.step_8 && step8) {
        nextLive.stage8 = {
          status: 'populated',
          data: {
            stage1: step8.stage1 || {},
            stage2: step8.stage2 || {},
            stage3: step8.stage3 || {}
          }
        };
      }

      // Limiting Factor Data (Stage 1 only for basic calculations)
      if (data.limitingParameterStage1 && data.limitingFlowRateStage1m3hr) {
        nextLive.limitingFactor = {
          status: 'populated',
          data: {
            // Map Stage 1 data to the format expected by the UI
            factor: data.limitingParameterStage1,
            flow_l_per_min: data.limitingFlowRateStage1m3hr * 1000 / 60, // Convert m3/hr to l/min
            flow_m3_per_hr: data.limitingFlowRateStage1m3hr
          }
        };
      }

      // Push to dynamic panel
      setLiveOutputs(nextLive);
    } catch (err) {
      if (err.name === 'AbortError') return; // ignore aborted stale requests
      console.error('Live calculations error:', err);

      // If backend says species missing, try to persist species once and retry
      const message = String(err && err.message || '');
      if (message.includes('Species not specified in project')) {
        try {
          const species = (formData.targetSpecies || '').trim();
          if (species) {
            const persistPayload = {
              maxTAN: formData.maxTAN,
              minTSS: formData.minTSS,
              maxCO2: formData.maxCO2,
              minDO: formData.minDO,
              siteElevation: formData.siteElevation,
              ph: formData.ph,
              salinity: formData.salinity,
              targetSpecies: species,
              waterTemp: formData.waterTemp,
              useRecommendedValues: formData.useRecommendedValues,
              type: calculationType,
              numTanks: formData.numTanks,
              tankVolume: formData.tankVolume,
              feedRate: formData.feedRate,
              feedConversionRatio: formData.feedConversionRatio,
              targetFishWeight: formData.targetFishWeight,
              targetNumFish: formData.targetNumFish,
              feedProtein: formData.feedProtein
            };
            console.warn('[LiveCalc] Persisting species to project before retry...');
            await createWaterQualityParameters(persistPayload);
            speciesSavedRef.current = true;
            // Retry once after a short delay
            setTimeout(() => {
              runLiveCalculations();
            }, 300);
            return;
          }
        } catch (persistErr) {
          console.warn('[LiveCalc] Species persist failed on retry path:', persistErr);
        }
      }
      // Show error state on all sections for now
      setLiveOutputs({
        oxygen: { status: 'error', data: null },
        tss: { status: 'error', data: null },
        co2: { status: 'error', data: null },
        tan: { status: 'error', data: null },
        stage6: { status: 'error', data: null },
        stage8: { status: 'error', data: null },
        limitingFactor: { status: 'error', data: null }
      });
    }
  };

  // Advanced live calculation for Step 6 input page
  const runAdvancedLiveCalculations = async (currentFormData = null) => {
    const formDataToUse = currentFormData || formData;
    
    // Debug logging to track the form data being used
    console.log('[AdvancedLiveCalc] Using formDataToUse:', formDataToUse);
    console.log('[AdvancedLiveCalc] Water temp value:', formDataToUse.waterTemp);
    console.log('[AdvancedLiveCalc] Salinity value:', formDataToUse.salinity);
    console.log('[AdvancedLiveCalc] Site elevation value:', formDataToUse.siteElevation);
    
    try {
      const projectId = designIds.projectId;
      const species = (formDataToUse.targetSpecies || '').trim();
      console.log('[AdvancedLiveCalc] Checking requirements:', { projectId, species, isUpdateFlow });
      if (!projectId) {
        console.warn('[AdvancedLiveCalc] No project ID found');
        return;
      }

      // Ensure species is persisted to project before live calculations
      // In update mode, species might already be in the project, so we can try the live call
      if (species && !speciesSavedRef.current && !isUpdateFlow) {
        try {
          const waterQualityPayload = {
            maxTAN: formDataToUse.maxTAN,
            minTSS: formDataToUse.minTSS,
            maxCO2: formDataToUse.maxCO2,
            minDO: formDataToUse.minDO,
            siteElevation: formDataToUse.siteElevation,
            ph: formDataToUse.ph,
            salinity: formDataToUse.salinity,
            targetSpecies: species,
            waterTemp: formDataToUse.waterTemp,
            useRecommendedValues: formDataToUse.useRecommendedValues,
            type: 'advanced',
            numTanks: formDataToUse.numTanks,
            tankVolume: formDataToUse.tankVolume,
            feedRate: formDataToUse.feedRate,
            feedConversionRatio: formDataToUse.feedConversionRatio,
            targetFishWeight: formDataToUse.targetFishWeight,
            targetNumFish: formDataToUse.targetNumFish,
            feedProtein: formDataToUse.feedProtein,
            // Include efficiency parameters
            o2Absorption: formDataToUse.o2Absorption,
            co2Removal: formDataToUse.co2Removal,
            tanRemoval: formDataToUse.tanRemoval,
            tssRemoval: formDataToUse.tssRemoval
          };
          await createWaterQualityParameters(waterQualityPayload);
          speciesSavedRef.current = true;
          console.log('[AdvancedLiveCalc] Species saved to project for live calculations');
        } catch (persistErr) {
          console.warn('[AdvancedLiveCalc] Failed to persist species to project:', persistErr);
          // If species persistence fails, skip the live calculation
          return;
        }
      }

      // If no species is available, skip the live calculation
      if (!species) {
        console.warn('[AdvancedLiveCalc] No species specified, skipping live calculation');
        return;
      }

      // Wait until species was persisted once (best effort)
      // In update mode, species might already be in the project, so we can try the live call
      if (!speciesSavedRef.current && !isUpdateFlow) {
        console.warn('[AdvancedLiveCalc] Species not yet persisted to project; attempting persisted live may fail');
        return;
      }
      
      // For update flow, we can try the live call even if species isn't marked as persisted
      if (!speciesSavedRef.current && isUpdateFlow) {
        console.log('[AdvancedLiveCalc] Update flow: attempting live call without species persistence check');
      }

      // Build payload from current form data
      const step6Values = {
        waterQuality: {
          ph: formDataToUse.ph,
          waterTemp: formDataToUse.waterTemp,
          minDO: formDataToUse.minDO,
          targetMinO2Saturation: formDataToUse.targetMinO2Saturation,
          maxTAN: formDataToUse.maxTAN,
          maxCO2: formDataToUse.maxCO2,
          minTSS: formDataToUse.minTSS,
          salinity: formDataToUse.salinity,
          alkalinity: formDataToUse.alkalinity,
          supplementPureO2: formDataToUse.supplementPureO2,
          siteElevation: formDataToUse.siteElevation
        },
        production: {
          targetSpecies: formDataToUse.targetSpecies,
          initialWeight: formDataToUse.initialWeightWiG,
          juvenileSize: formDataToUse.juvenileSize,
          targetFishWeight: formDataToUse.targetFishWeight,
          // Ensure live uses the immediate typed value for target number of fish
          targetNumFish: formDataToUse.targetNumFish,
          // Ensure live uses the immediate typed value for feed conversion ratio
          feedConversionRatio: formDataToUse.feedConversionRatio,
          productionTarget_t: formDataToUse.productionTarget_t,
          harvestFrequency: formDataToUse.harvestFrequency,
          tankVolume: formDataToUse.tankVolume,
          numTanks: formDataToUse.numTanks,
          feedRate: formDataToUse.feedRate,
          feedConversionRatio: formDataToUse.feedConversionRatio,
          feedProtein: formDataToUse.feedProtein
        },
        stageWise: {
          FCR_Stage1: formDataToUse.FCR_Stage1,
          FeedProtein_Stage1: formDataToUse.FeedProtein_Stage1,
          FCR_Stage2: formDataToUse.FCR_Stage2,
          FeedProtein_Stage2: formDataToUse.FeedProtein_Stage2,
          FCR_Stage3: formDataToUse.FCR_Stage3,
          FeedProtein_Stage3: formDataToUse.FeedProtein_Stage3,
          Estimated_mortality_Stage1: formDataToUse.Estimated_mortality_Stage1,
          Estimated_mortality_Stage2: formDataToUse.Estimated_mortality_Stage2,
          Estimated_mortality_Stage3: formDataToUse.Estimated_mortality_Stage3
        },
        systemEfficiency: {
          o2Absorption: formDataToUse.o2Absorption,
          tssRemoval: formDataToUse.tssRemoval,
          co2Removal: formDataToUse.co2Removal,
          tanRemoval: formDataToUse.tanRemoval
        }
      };

      const payload = buildAdvancedLiveInputsPayload(step6Values);
      console.log('[AdvancedLiveCalc] Calling live API with payload:', payload);
      console.log('[AdvancedLiveCalc] Initial weight values:', {
        initialWeightWiG: formDataToUse.initialWeightWiG,
        initialWeight: formDataToUse.initialWeightWiG,
        finalValue: formDataToUse.initialWeightWiG,
        payloadValue: payload.inputs?.initial_weight_wi_g
      });
      const data = await postLiveProductionCalculations(projectId, payload);
      console.log('[AdvancedLiveCalc] Live API response:', data);

      // Map response to dynamic outputs
      const ready = data.fields_ready || {};
      const values = data.values || {};
      const step6 = data.step_6 || {};
      const step8 = data.step_8 || {};

      // Debug: Log the actual API response structure
      console.log('[AdvancedLiveCalc] API Response Debug:', {
        fields_ready: ready,
        values: values,
        step6: step6,
        step8: step8,
        allKeys: Object.keys(values || {}),
        tssKeys: Object.keys(values || {}).filter(key => key.includes('tss')),
        co2Keys: Object.keys(values || {}).filter(key => key.includes('co2')),
        tanKeys: Object.keys(values || {}).filter(key => key.includes('tan')),
        step6Keys: Object.keys(values || {}).filter(key => key.includes('step_6') || key.includes('stage')),
        oxygenKeys: Object.keys(values || {}).filter(key => key.includes('oxygen'))
      });
      console.log('[AdvancedLiveCalc] Mapped data:', { ready, values, step6, step8 });

      const nextLive = {};

      // Mass Balance Data - Create separate sections for each component
      if (ready.o2_saturation_adjusted_mg_l || ready.oxygen_effluent_concentration_mg_l || ready.oxygen_consumption_production_mg_per_day || ready.oxygen_consumption_production_kg_per_day) {
        nextLive.massBalance_oxygen = {
          status: 'populated',
          data: {
            'oxygen.saturationAdjustedMgL': values.o2_saturation_adjusted_mg_l,
            'oxygen.effluentMgL': values.oxygen_effluent_concentration_mg_l,
            'oxygen.consMgPerDay': values.oxygen_consumption_production_mg_per_day,
            'oxygen.consKgPerDay': values.oxygen_consumption_production_kg_per_day,
            'oxygen.MINDO_use': formData.minDO ? parseFloat(formData.minDO) : undefined
          }
        };
      }

      if (ready.tss_effluent_concentration_mg_l || ready.tss_production_mg || ready.tss_production_kg) {
        nextLive.massBalance_tss = {
          status: 'populated',
          data: {
            'tss.effluentMgL': values.tss_effluent_concentration_mg_l,
            'tss.prodMgPerDay': values.tss_production_mg,
            'tss.prodKgPerDay': values.tss_production_kg,
            'tss.MAXTSS_use': formData.minTSS ? parseFloat(formData.minTSS) : undefined
          }
        };
      }

      if (ready.co2_effluent_concentration_mg_l || ready.co2_production_mg_per_day || ready.co2_production_kg_per_day) {
        nextLive.massBalance_co2 = {
          status: 'populated',
          data: {
            'co2.effluentMgL': values.co2_effluent_concentration_mg_l,
            'co2.prodMgPerDay': values.co2_production_mg_per_day,
            'co2.prodKgPerDay': values.co2_production_kg_per_day,
            'co2.MAXCO2_use': formData.maxCO2 ? parseFloat(formData.maxCO2) : undefined
          }
        };
      }

      if (ready.tan_effluent_concentration_mg_l || ready.tan_production_mg_per_day || ready.tan_production_kg_per_day) {
        nextLive.massBalance_tan = {
          status: 'populated',
          data: {
            'tan.effluentMgL': values.tan_effluent_concentration_mg_l,
            'tan.prodMgPerDay': values.tan_production_mg_per_day,
            'tan.prodKgPerDay': values.tan_production_kg_per_day,
            'tan.MAXTAN_use': formData.maxTAN ? parseFloat(formData.maxTAN) : undefined
          }
        };
      }

      // Step 6 Data (all three stages) - Create separate sections for each stage
      console.log('[AdvancedLiveCalc] Step 6 debug:', {
        step6Ready: ready.step_6,
        step6Data: step6,
        step6Keys: step6 ? Object.keys(step6) : 'no step6 data',
        oxygenData: step6?.oxygen,
        stage2OxygenData: step6?.stage2_oxygen,
        stage3OxygenData: step6?.stage3_oxygen,
        allStep6Keys: step6 ? Object.keys(step6) : [],
        step6Values: step6
      });
      
      if (ready.step_6 && step6) {
        // Stage 1 - Structure data to match UI expectations
        const stage1Data = {
          'step_6': {
            'oxygen': {
              'l_per_min': step6.oxygen?.l_per_min,
              'm3_per_hr': step6.oxygen?.m3_per_hr
            },
            'co2': {
              'l_per_min': step6.co2?.l_per_min,
              'm3_per_hr': step6.co2?.m3_per_hr
            },
            'tss': {
              'l_per_min': step6.tss?.l_per_min,
              'm3_per_hr': step6.tss?.m3_per_hr
            },
            'tan': {
              'l_per_min': step6.tan?.l_per_min,
              'm3_per_hr': step6.tan?.m3_per_hr
            }
          }
        };
        
        nextLive.step6_stage1 = {
          status: 'populated',
          data: stage1Data
        };
        console.log('[AdvancedLiveCalc] Created step6_stage1:', nextLive.step6_stage1);
        console.log('[AdvancedLiveCalc] Stage1 values:', {
          oxygen_l_per_min: step6.oxygen?.l_per_min,
          oxygen_m3_per_hr: step6.oxygen?.m3_per_hr,
          co2_l_per_min: step6.co2?.l_per_min,
          co2_m3_per_hr: step6.co2?.m3_per_hr
        });

        // Stage 2 - Structure data to match UI expectations
        const stage2Data = {
          'step_6': {
            'stage2_oxygen': {
              'l_per_min': step6.stage2_oxygen?.l_per_min,
              'm3_per_hr': step6.stage2_oxygen?.m3_per_hr
            },
            'stage2_co2': {
              'l_per_min': step6.stage2_co2?.l_per_min,
              'm3_per_hr': step6.stage2_co2?.m3_per_hr
            },
            'stage2_tss': {
              'l_per_min': step6.stage2_tss?.l_per_min,
              'm3_per_hr': step6.stage2_tss?.m3_per_hr
            },
            'stage2_tan': {
              'l_per_min': step6.stage2_tan?.l_per_min,
              'm3_per_hr': step6.stage2_tan?.m3_per_hr
            }
          }
        };
        
        nextLive.step6_stage2 = {
          status: 'populated',
          data: stage2Data
        };
        console.log('[AdvancedLiveCalc] Created step6_stage2:', nextLive.step6_stage2);
        console.log('[AdvancedLiveCalc] Stage2 values:', {
          stage2_oxygen_l_per_min: step6.stage2_oxygen?.l_per_min,
          stage2_oxygen_m3_per_hr: step6.stage2_oxygen?.m3_per_hr,
          stage2_co2_l_per_min: step6.stage2_co2?.l_per_min,
          stage2_co2_m3_per_hr: step6.stage2_co2?.m3_per_hr
        });

        // Stage 3 - Structure data to match UI expectations
        const stage3Data = {
          'step_6': {
            'stage3_oxygen': {
              'l_per_min': step6.stage3_oxygen?.l_per_min,
              'm3_per_hr': step6.stage3_oxygen?.m3_per_hr
            },
            'stage3_co2': {
              'l_per_min': step6.stage3_co2?.l_per_min,
              'm3_per_hr': step6.stage3_co2?.m3_per_hr
            },
            'stage3_tss': {
              'l_per_min': step6.stage3_tss?.l_per_min,
              'm3_per_hr': step6.stage3_tss?.m3_per_hr
            },
            'stage3_tan': {
              'l_per_min': step6.stage3_tan?.l_per_min,
              'm3_per_hr': step6.stage3_tan?.m3_per_hr
            }
          }
        };
        
        nextLive.step6_stage3 = {
          status: 'populated',
          data: stage3Data
        };
        console.log('[AdvancedLiveCalc] Created step6_stage3:', nextLive.step6_stage3);
        console.log('[AdvancedLiveCalc] Stage3 values:', {
          stage3_oxygen_l_per_min: step6.stage3_oxygen?.l_per_min,
          stage3_oxygen_m3_per_hr: step6.stage3_oxygen?.m3_per_hr,
          stage3_co2_l_per_min: step6.stage3_co2?.l_per_min,
          stage3_co2_m3_per_hr: step6.stage3_co2?.m3_per_hr
        });
      }

      // Step 8 Data (all three stages) - Create separate sections for each stage
      console.log('[AdvancedLiveCalc] Step 8 debug:', {
        step8Ready: ready.step_8,
        step8Data: step8,
        step8Keys: step8 ? Object.keys(step8) : 'no step8 data'
      });
      
      if (ready.step_8 && step8) {
        // Stage 1
        nextLive.stage8_stage1 = {
          status: 'populated',
          data: {
            'stage1.limitingFlowRateStage1': step8.stage1?.limitingFlowRateStage1,
            'stage1.Q_l_s_Stage1': step8.stage1?.Q_l_s_Stage1,
            'stage1.pump_Head_Stage1': step8.stage1?.pump_Head_Stage1,
            'stage1.pump_HydPower_Stage1': step8.stage1?.pump_HydPower_Stage1,
            'stage1.pump_PowerkW_Stage1': step8.stage1?.pump_PowerkW_Stage1,
            'stage1.n_Pump_Stage1': step8.stage1?.n_Pump_Stage1,
            'stage1.n_Motor_Stage1': step8.stage1?.n_Motor_Stage1
          }
        };

        // Stage 2
        nextLive.stage8_stage2 = {
          status: 'populated',
          data: {
            'stage2.limitingFlowRateStage2': step8.stage2?.limitingFlowRateStage2,
            'stage2.Q_l_s_Stage2': step8.stage2?.Q_l_s_Stage2,
            'stage2.pump_Head_Stage2': step8.stage2?.pump_Head_Stage2,
            'stage2.pump_HydPower_Stage2': step8.stage2?.pump_HydPower_Stage2,
            'stage2.pump_PowerkW_Stage2': step8.stage2?.pump_PowerkW_Stage2,
            'stage2.n_Pump_Stage2': step8.stage2?.n_Pump_Stage2,
            'stage2.n_Motor_Stage2': step8.stage2?.n_Motor_Stage2
          }
        };

        // Stage 3
        nextLive.stage8_stage3 = {
          status: 'populated',
          data: {
            'stage3.limitingFlowRateStage3': step8.stage3?.limitingFlowRateStage3,
            'stage3.Q_l_s_Stage3': step8.stage3?.Q_l_s_Stage3,
            'stage3.pump_Head_Stage3': step8.stage3?.pump_Head_Stage3,
            'stage3.pump_HydPower_Stage3': step8.stage3?.pump_HydPower_Stage3,
            'stage3.pump_PowerkW_Stage3': step8.stage3?.pump_PowerkW_Stage3,
            'stage3.n_Pump_Stage3': step8.stage3?.n_Pump_Stage3,
            'stage3.n_Motor_Stage3': step8.stage3?.n_Motor_Stage3
          }
        };
      }

      // Limiting Factor Data (all three stages) - Create separate sections for each stage
      if (data.limitingParameterStage1 || data.limitingParameterStage2 || data.limitingParameterStage3) {
        console.log('[AdvancedLiveCalc] Limiting factor data found:', {
          stage1: data.limitingParameterStage1,
          stage2: data.limitingParameterStage2,
          stage3: data.limitingParameterStage3
        });
        // Stage 1
        nextLive.limitingFactor_stage1 = {
          status: 'populated',
          data: {
            'stage1.factor': data.limitingParameterStage1 || '-',
            'stage1.flow_l_per_min': data.limitingFlowRateStage1m3hr ? data.limitingFlowRateStage1m3hr * 1000 / 60 : 0,
            'stage1.flow_m3_per_hr': data.limitingFlowRateStage1m3hr || 0
          }
        };

        // Stage 2
        nextLive.limitingFactor_stage2 = {
          status: 'populated',
          data: {
            'stage2.factor': data.limitingParameterStage2 || '-',
            'stage2.flow_l_per_min': data.limitingFlowRateStage2m3hr ? data.limitingFlowRateStage2m3hr * 1000 / 60 : 0,
            'stage2.flow_m3_per_hr': data.limitingFlowRateStage2m3hr || 0
          }
        };

        // Stage 3
        nextLive.limitingFactor_stage3 = {
          status: 'populated',
          data: {
            'stage3.factor': data.limitingParameterStage3 || '-',
            'stage3.flow_l_per_min': data.limitingFlowRateStage3m3hr ? data.limitingFlowRateStage3m3hr * 1000 / 60 : 0,
            'stage3.flow_m3_per_hr': data.limitingFlowRateStage3m3hr || 0
          }
        };
      }

      console.log('[AdvancedLiveCalc] Setting dynamic stage 6 data:', nextLive);
      console.log('[AdvancedLiveCalc] All sections being set:', {
        massBalance: Object.keys(nextLive).filter(k => k.startsWith('massBalance')),
        step6: Object.keys(nextLive).filter(k => k.startsWith('step6')),
        limitingFactor: Object.keys(nextLive).filter(k => k.startsWith('limitingFactor')),
        stage8: Object.keys(nextLive).filter(k => k.startsWith('stage8'))
      });
      setDynamicStage6(nextLive);
    } catch (err) {
      console.error('Advanced live calculations error:', err);
      setDynamicStage6({
        step6: { status: 'error', data: null },
        massBalance: { status: 'error', data: null },
        limitingFactor: { status: 'error', data: null },
        stage8: { status: 'error', data: null }
      });
    }
  };

  // Advanced live calculation for Stage 7 input page
  const runAdvancedStage7LiveCalculations = async (currentFormData = null, currentStage7FormData = null) => {
    const formDataToUse = currentFormData || formData;
    const stage7FormDataToUse = currentStage7FormData || stage7FormData;
    try {
      const projectId = designIds.projectId;
      if (!projectId) {
        console.warn('[AdvancedStage7LiveCalc] No project ID found');
        return;
      }

      if (!tempStep6Values) {
        console.warn('[AdvancedStage7LiveCalc] No Step 6 values stored');
        return;
      }

      // Ensure species is persisted to project before live calculations
      const species = (tempStep6Values.production?.targetSpecies || '').trim();
      if (species && !speciesSavedRef.current) {
        try {
          const waterQualityPayload = {
            maxTAN: tempStep6Values.waterQuality?.maxTAN,
            minTSS: tempStep6Values.waterQuality?.minTSS,
            maxCO2: tempStep6Values.waterQuality?.maxCO2,
            minDO: tempStep6Values.waterQuality?.minDO,
            siteElevation: tempStep6Values.waterQuality?.siteElevation,
            ph: tempStep6Values.waterQuality?.ph,
            salinity: tempStep6Values.waterQuality?.salinity,
            targetSpecies: species,
            waterTemp: tempStep6Values.waterQuality?.waterTemp,
            useRecommendedValues: formDataToUse.useRecommendedValues,
            type: 'advanced',
            numTanks: tempStep6Values.production?.numTanks,
            tankVolume: tempStep6Values.production?.tankVolume,
            feedRate: tempStep6Values.production?.feedRate,
            feedConversionRatio: tempStep6Values.production?.feedConversionRatio,
            targetFishWeight: tempStep6Values.production?.targetFishWeight,
            targetNumFish: tempStep6Values.production?.targetNumFish,
            feedProtein: tempStep6Values.production?.feedProtein,
            // Include efficiency parameters
            o2Absorption: tempStep6Values.systemEfficiency?.o2Absorption,
            co2Removal: tempStep6Values.systemEfficiency?.co2Removal,
            tanRemoval: tempStep6Values.systemEfficiency?.tanRemoval,
            tssRemoval: tempStep6Values.systemEfficiency?.tssRemoval
          };
          await createWaterQualityParameters(waterQualityPayload);
          speciesSavedRef.current = true;
          console.log('[AdvancedStage7LiveCalc] Species saved to project for live calculations');
        } catch (persistErr) {
          console.warn('[AdvancedStage7LiveCalc] Failed to persist species to project:', persistErr);
          // If species persistence fails, skip the live calculation
          return;
        }
      }

      // If no species is available, skip the live calculation
      if (!species) {
        console.warn('[AdvancedStage7LiveCalc] No species specified, skipping live calculation');
        return;
      }

      // Wait until species was persisted once (best effort)
      if (!speciesSavedRef.current) {
        console.warn('[AdvancedStage7LiveCalc] Species not yet persisted to project; attempting persisted live may fail');
        return;
      }

      // Build payload from stored Step 6 values + current Stage 7 values
      console.log('[AdvancedStage7LiveCalc] Using Stage 7 form data:', stage7FormDataToUse);
      const stage7Values = {
        // Biofilter parameters
        mbbr_location: stage7FormDataToUse.mbbr_location,
        media_to_water_volume_ratio: stage7FormDataToUse.media_to_water_volume_ratio,
        passive_nitrification_rate_stage1_percent: stage7FormDataToUse.passive_nitrification_rate_stage1_percent,
        passive_nitrification_rate_stage2_percent: stage7FormDataToUse.passive_nitrification_rate_stage2_percent,
        passive_nitrification_rate_stage3_percent: stage7FormDataToUse.passive_nitrification_rate_stage3_percent,
        pump_stop_overflow_volume: stage7FormDataToUse.pump_stop_overflow_volume,
        standalone_height_diameter_ratio: stage7FormDataToUse.standalone_height_diameter_ratio,
        volumetric_nitrification_rate_vtr: stage7FormDataToUse.volumetric_nitrification_rate_vtr,
        
        // Tank design parameters
        num_tanks_stage1: stage7FormDataToUse.num_tanks_stage1,
        num_tanks_stage2: stage7FormDataToUse.num_tanks_stage2,
        num_tanks_stage3: stage7FormDataToUse.num_tanks_stage3,
        tank_dd_ratio_stage1: stage7FormDataToUse.tank_dd_ratio_stage1,
        tank_dd_ratio_stage2: stage7FormDataToUse.tank_dd_ratio_stage2,
        tank_dd_ratio_stage3: stage7FormDataToUse.tank_dd_ratio_stage3,
        tank_freeboard_stage1: stage7FormDataToUse.tank_freeboard_stage1,
        tank_freeboard_stage2: stage7FormDataToUse.tank_freeboard_stage2,
        tank_freeboard_stage3: stage7FormDataToUse.tank_freeboard_stage3
      };

      console.log('[AdvancedStage7LiveCalc] Feed Conversion Ratio from stored values:', {
        production: tempStep6Values?.production?.feedConversionRatio,
        stageWise: tempStep6Values?.stageWise?.FCR_Stage1
      });
      const payload = buildStep7LiveInputsPayload(tempStep6Values, stage7Values);
      console.log('[AdvancedStage7LiveCalc] Step 7 live API payload feed_conversion_ratio:', payload.inputs?.feed_conversion_ratio);
      console.log('[AdvancedStage7LiveCalc] Juvenile size in payload:', payload.production?.juvenile_size);
      const data = await postStep7LiveCalculations(projectId, payload);

      // Map response to dynamic outputs
      const ready = data.fields_ready || {};
      const values = data.values || {};
      const step4 = data.step_4 || {};
      const step7 = data.step_7 || {};

      const nextLive = {};

      // Stage 4 Data (Tank Design)
      if (ready.step_4 && step4) {
        nextLive.step4 = {
          status: 'populated',
          data: step4
        };
      }

      // Stage 7 Data
      if (ready.step_7 && step7) {
        // Map biofilter data from the main step7 object
        nextLive.biofilter = {
          status: 'populated',
          data: {
            bioVTR_use: step7.bioVTR_use,
            bio_VTR_compensation: step7.bio_VTR_compensation,
            bio_shape: step7.bio_shape
          }
        };
        
        // Map sump data from stage data (using stage1 as reference)
        nextLive.sump = {
          status: 'populated',
          data: {
            sump_Size_3min: step7.stage1?.sump_Size_3min_Stage1,
            sump_Size_5min: step7.stage1?.sump_Size_5min_Stage1,
            sump_totvol: step7.stage1?.sump_totvol_Stage1
          }
        };
        
        // Map stage data for each stage
        if (step7.stage1) {
          nextLive.stage1 = {
            status: 'populated',
            data: step7.stage1
          };
        }
        if (step7.stage2) {
          nextLive.stage2 = {
            status: 'populated',
            data: step7.stage2
          };
        }
        if (step7.stage3) {
          nextLive.stage3 = {
            status: 'populated',
            data: step7.stage3
          };
        }
      }

      setDynamicStage7(nextLive);
    } catch (err) {
      console.error('Advanced Stage 7 live calculations error:', err);
      setDynamicStage7({
        biofilter: { status: 'error', data: null },
        sump: { status: 'error', data: null },
        stage1: { status: 'error', data: null },
        stage2: { status: 'error', data: null },
        stage3: { status: 'error', data: null }
      });
    }
  };

  const nextStep = async () => {
    console.log('NextStep called. Current step:', step);
    console.log('Current form data:', formData);

    // For update flows, ensure we have both IDs before proceeding
    if (isUpdateFlow && (!designIds.projectId || !designIds.designId)) {
      console.log('Update flow: waiting for both project ID and design ID to be loaded...');
      console.log('Current IDs:', designIds);
      return;
    }
    
    // Prevent API calls while loading existing project data (for non-update flows)
    if (!isUpdateFlow && isLoadingExistingData) {
      console.log('Still loading existing project data, please wait...');
      return;
    }

    // If we're on step 1 (Initial Setup), create design system first
    if (step === 1) {
      try {
        setLoading(true);
        console.log('Creating design system...');
        console.log('Current designIds state:', designIds);
        console.log('designIdsRef.current:', designIdsRef.current);
        console.log('isUpdateFlow:', isUpdateFlow);
        console.log('isBackButtonScenarioRef.current:', isBackButtonScenarioRef.current);
        
        // Validate required fields for basic flow
        if (calculationType === 'basic') {
          if (!formData.targetSpecies || formData.targetSpecies.trim() === '') {
            setError('Please select a target species before proceeding.');
            setLoading(false);
            return;
          }
        }
        
        // Check if we have existing IDs (back button scenario) or if this is a true update flow
        const hasProjectId = designIds.projectId;
        const hasDesignId = designIds.designId;
        
        // For back button scenario: use existing IDs if we have projectId (designId might be null initially)
        // For update flow: use existing IDs if we have both projectId and designId
        const shouldUseProjectId = hasProjectId && (isUpdateFlow ? hasDesignId : true);
        const shouldUseDesignId = hasDesignId && (isUpdateFlow ? hasProjectId : true);
        
        console.log('API call debug:', {
          isUpdateFlow,
          hasProjectId,
          hasDesignId,
          shouldUseProjectId,
          shouldUseDesignId,
          designIds,
          sendingDesignId: shouldUseDesignId ? designIds.designId : null,
          sendingProjectId: shouldUseProjectId ? designIds.projectId : null,
          'isUpdateFlow && hasProjectId && hasDesignId': isUpdateFlow && hasProjectId && hasDesignId
        });
        
        const apiPayload = {
          ...formData,
          isUpdateFlow: shouldUseProjectId, // Use projectId as the main indicator for updates
          designId: shouldUseDesignId ? designIds.designId : null,
          projectId: shouldUseProjectId ? designIds.projectId : null
        };
        
        console.log('API payload being sent:', apiPayload);
        
        const response = await createDesignSystem(apiPayload);
        console.log('Design system created:', response);

        if (response.design_id) {
          console.log('Design ID received:', response.design_id);
          // Store the design ID in component state
          setDesignIds(prev => ({ ...prev, designId: response.design_id }));
        }
        
        if (response.project_id) {
          console.log('Project ID received:', response.project_id);
          // Store the project ID in component state
          setDesignIds(prev => ({ ...prev, projectId: response.project_id }));
        }
        
        if (response.recommended_values) {
          console.log('Received recommended values:', response.recommended_values);
          // Store recommended values if provided
          localStorage.setItem('recommendedValues', JSON.stringify(response.recommended_values));
        }
      } catch (error) {
        console.error('Failed to create design system:', error);
        const message = error?.message || 'Failed to create design system';
        // If API sent a duplicate/validation message, surface via SweetAlert2
        await Swal.fire({
          icon: 'error',
          title: 'Could not create',
          text: message,
          confirmButtonColor: '#dc3545'
        });
        return;
      } finally {
        setLoading(false);
      }
    }

    // No API calls during water quality phase - just move to next step
    
    // If we're on step 1 and useRecommendedValues is checked, fetch recommended values
    if (step === 1 && formData.useRecommendedValues && formData.targetSpecies) {
      console.log('Fetching recommended values for species:', formData.targetSpecies);
      setLoading(true);
      try {
        // Check for auth token
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found, redirecting to login');
          navigate('/login');
          return;
        }

        const data = await getRecommendedValues(formData.targetSpecies);
        console.log('Raw API response:', data);
        
        if (!data || (!data.species_parameters && !data.common_parameters)) {
          throw new Error('Invalid response format: missing required parameters');
        }
        
        // Extract species parameters
        const params = data.species_parameters || {};
        const commonParams = data.common_parameters || {};
        console.log('Extracted species parameters:', params);
        console.log('Extracted common parameters:', commonParams);
        
        // Helper function to get best value
        const getBestValue = (param, preferMax = false, customKeys = null) => {
          if (!param) return null;
          
          // If customKeys are provided, try them in order
          if (customKeys) {
            for (const key of customKeys) {
              if (param[key] !== undefined && param[key] !== null && param[key] !== '') {
                return param[key];
              }
            }
          } else {
            // Default behavior
            console.log('🔍 getBestValue - param.design:', param.design, 'type:', typeof param.design);
            if (param.design !== undefined && param.design !== null) {
              console.log('🔍 getBestValue - returning design value:', param.design);
              return param.design;
            }
            
            if (param.min !== undefined && param.max !== undefined) {
              if (preferMax) {
                return param.max;
              }
              return (param.min + param.max) / 2;
            }
            
            if (preferMax && param.max !== undefined) {
              return param.max;
            }
            
            if (!preferMax && param.min !== undefined) {
              return param.min;
            }
          }
          
          return null;
        };
        
        // Initialize updatedData with water quality parameters
        console.log('🔍 Salinity params:', params.salinity);
        const salinityValue = getBestValue(params.salinity);
        console.log('🔍 Salinity getBestValue result:', salinityValue);
        console.log('🔍 Salinity final value:', salinityValue !== null && salinityValue !== undefined ? salinityValue : 0);
        
        let updatedData = {
          waterTemp: getBestValue(params.temperature) ?? 21.5,
          ph: getBestValue(params.ph, false, ['design', 'optimal', 'recommended', 'min', 'max']) ?? 7.0,
          salinity: salinityValue !== null && salinityValue !== undefined ? salinityValue : 0,
          minDO: getBestValue(params.dissolved_oxygen, false) || 5.0,
          maxCO2: getBestValue(params.carbon_dioxide, true) || 10.0,
          minTSS: getBestValue(params.total_suspended_solids, true) || 100.0,
          maxTAN: getBestValue(params.total_ammonia_nitrogen, true) || 0.5,
          // New parameters with default values
          targetMinO2Saturation: 95, // Default value
          alkalinity: 250, // Default value
          supplementPureO2: false // Default value
        };

        // Add efficiency parameters from removal_efficiencies
        if (commonParams.removal_efficiencies) {
          const efficiencies = commonParams.removal_efficiencies;
          
          if (efficiencies.o2_absorption !== undefined && efficiencies.o2_absorption !== null) {
            updatedData.o2Absorption = efficiencies.o2_absorption.toString();
          }
          
          if (efficiencies.tss_removal !== undefined && efficiencies.tss_removal !== null) {
            updatedData.tssRemoval = efficiencies.tss_removal.toString();
          }
          
          if (efficiencies.co2_removal !== undefined && efficiencies.co2_removal !== null) {
            updatedData.co2Removal = efficiencies.co2_removal.toString();
          }
          
          if (efficiencies.tan_removal !== undefined && efficiencies.tan_removal !== null) {
            updatedData.tanRemoval = efficiencies.tan_removal.toString();
          }
        }
        
        // Format numeric values
        Object.keys(updatedData).forEach(key => {
          if (typeof updatedData[key] === 'number') {
            updatedData[key] = Number.isInteger(updatedData[key]) 
              ? updatedData[key].toString()
              : updatedData[key].toFixed(2);
          }
        });
        
        console.log('🔍 Salinity after formatting:', updatedData.salinity);
        console.log('Calculated values to update:', updatedData);
        
        // Update form data
        setFormData(prev => {
          const newData = {
            ...prev,
            ...updatedData
          };
          console.log('🔍 Final salinity in form data:', newData.salinity);
          console.log('New form data:', newData);
          return newData;
        });
      } catch (error) {
        console.error('Failed to fetch recommended values:', error);
        alert('Failed to fetch recommended values. Please try again or proceed without recommended values.');
        return;
      } finally {
        setLoading(false);
      }
    }
    
    // Log final form data before moving to next step
    console.log('Moving to next step with form data:', formData);
    
    // For basic calculations, go to combined inputs page after step 1
    console.log('Step:', step, 'Calculation Type:', calculationType);
    if (step === 1 && calculationType === 'basic') {
      console.log('Going to combined inputs page');
      setShowCombinedInputs(true);
      setStep(2); // Set to step 2 (Inputs) for stepper display
    } else {
      console.log('Going to next step normally');
      setStep(prev => prev + 1);
    }
  };
  const prevStep = () => {
    console.log('🔙 prevStep called - current step:', step, 'showCombinedInputs:', showCombinedInputs);
    if (step === 1) {
      navigate('/dashboard');
    } else if (showCombinedInputs) {
      // Go back to initial page from combined inputs
      console.log('🔙 Going back from combined inputs - setting back button flag');
      setShowCombinedInputs(false);
      setStep(1);
      // Set flag to indicate this is a back button scenario
      isBackButtonScenarioRef.current = true;
    } else {
      const newStep = step - 1;
      console.log('🔙 Going back from step', step, 'to step', newStep);
      setStep(newStep);
      // If we're going back to step 1, set the back button flag
      if (newStep === 1) {
        console.log('🔙 Going back to step 1 - setting back button flag');
        console.log('🔙 Current designIds when going back:', designIds);
        console.log('🔙 Current designIdsRef when going back:', designIdsRef.current);
        isBackButtonScenarioRef.current = true;
      }
    }
  };

  // Handle back button from combined inputs page
  const handleCombinedInputsBack = () => {
    console.log('handleCombinedInputsBack called - setting back button flag');
    setShowCombinedInputs(false);
    setStep(1);
    // Set flag to indicate this is a back button scenario
    isBackButtonScenarioRef.current = true;
  };

  // Basic calculation function
  const handleBasicCalculate = async () => {
    try {
      setError('');

      // Get the project ID from localStorage
      const projectId = designIds.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      console.log('Starting mass balance calculation...');
      
      // First, submit all parameters to water quality endpoint
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Project ID:', projectId);
      console.log('Auth token found:', !!token);

      // Helper function to safely parse numbers, allowing 0
      const safeParseFloat = (value) => {
        // Handle empty string, undefined, or null
        if (value === '' || value === undefined || value === null) {
          return 0;
        }
        // Parse the number
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Get raw values first
      console.log('Raw form values:', {
        waterTemp: formData.waterTemp,
        salinity: formData.salinity,
        siteElevation: formData.siteElevation,
        'typeof waterTemp': typeof formData.waterTemp,
        'typeof salinity': typeof formData.salinity,
        'typeof siteElevation': typeof formData.siteElevation
      });

      // Parse the required fields first, defaulting to 0
      const temperature = Math.round(safeParseFloat(formData.waterTemp));
      const salinity = safeParseFloat(formData.salinity);
      const elevation = safeParseFloat(formData.siteElevation);

      // Log the parsed values
      console.log('Parsed values:', {
        temperature,
        salinity,
        elevation,
        'typeof temperature': typeof temperature,
        'typeof salinity': typeof salinity,
        'typeof elevation': typeof elevation
      });

      console.log('Parsed required fields:', {
        'Raw values': {
          waterTemp: formData.waterTemp,
          salinity: formData.salinity,
          siteElevation: formData.siteElevation
        },
        'Parsed values': {
          temperature,
          salinity,
          elevation
        }
      });

      // Validate required fields, allowing 0 as a valid value
      const requiredFields = [
        { key: 'waterTemp', label: 'Water Temperature', apiKey: 'water_temperature' },
        { key: 'salinity', label: 'Salinity', apiKey: 'salinity' },
        { key: 'siteElevation', label: 'Site Elevation', apiKey: 'elevation_m' }
      ];

      // Log validation details
      console.log('Validating required inputs:', {
        'Raw form values': {
          waterTemp: formData.waterTemp,
          salinity: formData.salinity,
          siteElevation: formData.siteElevation
        },
        'Types': {
          waterTemp: typeof formData.waterTemp,
          salinity: typeof formData.salinity,
          siteElevation: typeof formData.siteElevation
        }
      });

      console.log('Form data before validation:', formData);

      const missingInputs = requiredFields
        .filter(({ key, label }) => {
          // Get the actual form field key
          const formKey = key === 'waterTemp' ? 'waterTemp' : 
                        key === 'salinity' ? 'salinity' : 
                        key === 'siteElevation' ? 'siteElevation' : key;
          
          const value = formData[formKey];
          console.log(`Checking ${key} (${label}):`, {
            value,
            type: typeof value,
            isEmpty: value === '' || value === undefined || value === null,
            isZero: value === 0 || value === '0'
          });
          
          // Allow 0 as a valid value, but not empty string, undefined, or null
          return value === '' || value === undefined || value === null;
        })
        .map(({ label }) => label);

      if (missingInputs.length > 0) {
        throw new Error(`Please fill in the following required fields: ${missingInputs.join(', ')}`);
      }

      console.log('All required fields validated successfully');

      // Prepare water quality parameters in the shape expected by the service
      const waterQualityData = {
        waterTemp: temperature,
        salinity: salinity,
        siteElevation: elevation,
        minDO: safeParseFloat(formData.minDO) || 6,
        ph: safeParseFloat(formData.ph) || 7,
        maxCO2: safeParseFloat(formData.maxCO2) || 10,
        maxTAN: safeParseFloat(formData.maxTAN) || 1,
        minTSS: safeParseFloat(formData.minTSS) || 20,
        // Include production parameters required by backend prior to GET
        tankVolume: safeParseFloat(formData.tankVolume) || 0,
        targetFishWeight: safeParseFloat(formData.targetFishWeight) || 0,
        feedRate: safeParseFloat(formData.feedRate) || 0,
        feedConversionRatio: safeParseFloat(formData.feedConversionRatio) || 0,
        feedProtein: safeParseFloat(formData.feedProtein) || 0,
        numTanks: parseInt(formData.numTanks || 0, 10),
        targetNumFish: parseInt(formData.targetNumFish || 0, 10),
        useRecommendedValues: Boolean(formData.useRecommendedValues),
        targetSpecies: formData.targetSpecies || '',
        // Include efficiency parameters
        o2Absorption: safeParseFloat(formData.o2Absorption) || 0,
        co2Removal: safeParseFloat(formData.co2Removal) || 0,
        tanRemoval: safeParseFloat(formData.tanRemoval) || 0,
        tssRemoval: safeParseFloat(formData.tssRemoval) || 0,
        supplementPureO2: Boolean(formData.supplementPureO2)
      };

      console.log('Water quality data to send:', waterQualityData);

      // Submit water quality parameters
      const waterQualityResponse = await createWaterQualityParameters(waterQualityData);
      console.log('Water quality response:', waterQualityResponse);

      // Get production calculations
      const calcResponse = await fetch(`/backend/formulas/api/projects/${projectId}/production-calculations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!calcResponse.ok) {
        throw new Error(`Failed to get calculations: ${calcResponse.status}`);
      }

      const calcData = await calcResponse.json();
      console.log('Production calculations response:', calcData);

      // Map API response to our expected format
      const results = {
        oxygen: {
          bestInletMgL: calcData.o2_saturation_adjusted?.value || calcData.o2_saturation_adjusted_mg_l || 0,
          minSatPct: calcData.o2_saturation_adjusted?.value || calcData.o2_saturation_adjusted_mg_l || 0,
          saturationAdjustedMgL: calcData.o2_saturation_adjusted_mg_l || 0,
          MINDO_use: calcData.min_do_mg_l ?? calcData.min_do_use_mg_l ?? null,
          effluentMgL: calcData.oxygen_effluent_concentration?.value || calcData.oxygen_effluent_concentration_mg_l || 0,
          effluentConc: calcData.oxygen_effluent_concentration?.value || calcData.oxygen_effluent_concentration_mg_l || 0,
          consMgPerDay: calcData.oxygen_consumption_production?.value || calcData.oxygen_consumption_production_mg_per_day || 0,
          consKgPerDay: (calcData.oxygen_consumption_production?.value || calcData.oxygen_consumption_production_mg_per_day || 0) / 1000000
        },
        tss: {
          effluentMgL: calcData.tss_effluent_concentration?.value || calcData.tss_effluent_concentration_mg_l || 0,
          effluentConc: calcData.tss_effluent_concentration?.value || calcData.tss_effluent_concentration_mg_l || 0,
          prodMgPerDay: calcData.tss_production?.value || calcData.tss_production_mg || 0,
          prodKgPerDay: (calcData.tss_production?.value || calcData.tss_production_mg || 0) / 1000000,
          MAXTSS_use: calcData.max_tss_use_mg_l ?? null
        },
        co2: {
          effluentMgL: calcData.co2_effluent_concentration_mg_l ?? 15.5,
          effluentConc: calcData.co2_effluent_concentration_mg_l ?? 15.5,
          prodMgPerDay: calcData.co2_production_mg_per_day ?? 2500000,
          prodKgPerDay: (calcData.co2_production_mg_per_day ?? 2500000) / 1000000,
          MAXCO2_use: calcData.max_co2_use_mg_l ?? null
        },
        tan: {
          effluentMgL: calcData.tan_effluent_concentration_mg_l ?? 1.0,
          effluentConc: calcData.tan_effluent_concentration_mg_l ?? 1.0,
          prodMgPerDay: calcData.tan_production_mg_per_day ?? 800000,
          prodKgPerDay: (calcData.tan_production_mg_per_day ?? 800000) / 1000000,
          MAXTAN_use: calcData.max_tan_use_mg_l ?? null
        }
      };

      console.log('Mapped results:', results);

      // POST Stage 6 Juvenile parameters (minimal advanced payload)
      const stage6Payload = {
        ph: formData.ph ? parseFloat(formData.ph) : 7,
        temperature: formData.waterTemp ? parseFloat(formData.waterTemp) : 27,
        dissolved_O2_min: formData.minDO ? parseFloat(formData.minDO) : 3.0,
        target_min_o2_saturation: formData.targetMinO2Saturation ? parseFloat(formData.targetMinO2Saturation) : 95,
        TAN_max: formData.maxTAN ? parseFloat(formData.maxTAN) : 2,
        dissolved_CO2_max: formData.maxCO2 ? parseFloat(formData.maxCO2) : 15,
        TSS_max: formData.minTSS ? parseFloat(formData.minTSS) : 80,
        salinity: formData.salinity ? parseFloat(formData.salinity) : 0,
        alkalinity: formData.alkalinity ? parseFloat(formData.alkalinity) : 250,
        elevation_m: formData.siteElevation ? parseFloat(formData.siteElevation) : 500,
        species: formData.targetSpecies || "Nile tilapia",
        production_target_t: formData.productionTarget_t ? parseFloat(formData.productionTarget_t) : 100,
        harvest_frequency: formData.harvestFrequency || "Fortnightly",
        initial_weight_wi_g: (formData.initialWeightWiG && formData.initialWeightWiG.toString().trim() !== '') ? parseFloat(formData.initialWeightWiG) : null,
        juvenile_size: (formData.juvenileSize && formData.juvenileSize.toString().trim() !== '') ? parseFloat(formData.juvenileSize) : null,
        target_market_fish_size: (formData.targetFishWeight && formData.targetFishWeight.toString().trim() !== '') ? parseFloat(formData.targetFishWeight) : null,
        feed_protein_percent: (formData.feedProtein && formData.feedProtein.toString().trim() !== '') ? parseFloat(formData.feedProtein) : null,
        target_feed_rate: (formData.feedRate && formData.feedRate.toString().trim() !== '') ? parseFloat(formData.feedRate) : null,
        target_max_stocking_density: (formData.targetNumFish && formData.targetNumFish.toString().trim() !== '') ? parseFloat(formData.targetNumFish) : null,
        tanks_volume_each: (formData.tankVolume && formData.tankVolume.toString().trim() !== '') ? parseFloat(formData.tankVolume) : null,
        number_of_tanks: (formData.numTanks && formData.numTanks.toString().trim() !== '') ? parseInt(formData.numTanks, 10) : null,
        fcr_stage1: formData.FCR_Stage1 ? parseFloat(formData.FCR_Stage1) : 1.1,
        feed_protein_stage1: formData.FeedProtein_Stage1 ? parseFloat(formData.FeedProtein_Stage1) : 45,
        estimated_mortality_stage1: formData.Estimated_mortality_Stage1 ? parseFloat(formData.Estimated_mortality_Stage1) : 0,
        fcr_stage2: formData.FCR_Stage2 ? parseFloat(formData.FCR_Stage2) : 1.2,
        feed_protein_stage2: formData.FeedProtein_Stage2 ? parseFloat(formData.FeedProtein_Stage2) : 45,
        estimated_mortality_stage2: formData.Estimated_mortality_Stage2 ? parseFloat(formData.Estimated_mortality_Stage2) : 0,
        fcr_stage3: formData.FCR_Stage3 ? parseFloat(formData.FCR_Stage3) : 1.3,
        feed_protein_stage3: formData.FeedProtein_Stage3 ? parseFloat(formData.FeedProtein_Stage3) : 45,
        estimated_mortality_stage3: formData.Estimated_mortality_Stage3 ? parseFloat(formData.Estimated_mortality_Stage3) : 0,
        type: calculationType // Set type based on calculation type
      };
      await postAdvancedParameters(projectId, stage6Payload);

      // Fetch Stage 6 results (non-blocking)
      let basicStep6Results = null;
      try {
        basicStep6Results = await getAdvancedStep6Results(projectId);
      } catch (fetchErr) {
        console.warn('Failed to fetch Stage 6 results for basic project:', fetchErr);
      }

      // Fetch Limiting Factor (non-blocking)
      let basicLimitingFactor = null;
      try {
        basicLimitingFactor = await getAdvancedLimitingFactor(projectId);
      } catch (fetchErr) {
        console.warn('Failed to fetch Limiting Factor for basic project:', fetchErr);
      }

      // Update form data with results
      setFormData(prev => ({
        ...prev,
        calculationResults: results,
        basicStep6Results: basicStep6Results,
        basicLimitingFactor: basicLimitingFactor
      }));

      console.log('Basic calculation completed successfully');
    } catch (err) {
      console.error('Error in basic calculation:', err);
      setError(err.message);
      throw err;
    }
  };

  // Handle calculate mass balance from combined inputs page
  const handleCombinedInputsCalculate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Call the existing basic calculation logic
      await handleBasicCalculate();
      
      // After successful calculation, go to report step
      console.log('Calculation completed, navigating to report step');
      console.log('Current formData.calculationResults:', formData.calculationResults);
      console.log('Current formData.basicStep6Results:', formData.basicStep6Results);
      console.log('Current formData.basicLimitingFactor:', formData.basicLimitingFactor);
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setShowCombinedInputs(false);
        setStep(3); // Go to step 3 (Report) for basic calculations
        console.log('Step set to 3, showCombinedInputs set to false');
      }, 100);
    } catch (error) {
      console.error('Error in combined inputs calculation:', error);
      setError(error.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  // Render basic report
  const renderBasicReport = () => {
    console.log('renderBasicReport called with formData:', formData);
    const results = formData.calculationResults || {
      oxygen: {
        bestInletMgL: 8.5,
        minSatPct: 85,
        effluentMgL: 6.2,
        consMgPerDay: 1200000,
        consKgPerDay: 1.2
      },
      tss: {
        effluentMgL: 25.0,
        prodMgPerDay: 1800000,
        prodKgPerDay: 1.8
      },
      co2: {
        effluentMgL: 15.5,
        prodMgPerDay: 2500000,
        prodKgPerDay: 2.5
      },
      tan: {
        effluentMgL: 1.0,
        prodMgPerDay: 800000,
        prodKgPerDay: 0.8
      }
    };

    // Prepare inputs data for display
    const inputs = {
      waterTemp: formData.waterTemp || 0,
      salinity: formData.salinity || 0,
      siteElevation: formData.siteElevation || 0,
      minDO: formData.minDO || 0,
      ph: formData.ph || 0,
      maxCO2: formData.maxCO2 || 0,
      maxTAN: formData.maxTAN || 0,
      minTSS: formData.minTSS || 0,
      alkalinity: formData.alkalinity || 0,
      targetMinO2Saturation: formData.targetMinO2Saturation || 0,
      tankVolume: formData.tankVolume || 0,
      numTanks: formData.numTanks || 0,
      targetFishWeight: formData.targetFishWeight || 0,
      targetNumFish: formData.targetNumFish || 0,
      feedRate: formData.feedRate || 0,
      feedProtein: formData.feedProtein || 0,
      productionTarget_t: formData.productionTarget_t || 0,
      FCR_Stage1: formData.FCR_Stage1 || 0,
      FCR_Stage2: formData.FCR_Stage2 || 0,
      FCR_Stage3: formData.FCR_Stage3 || 0,
      FeedProtein_Stage1: formData.FeedProtein_Stage1 || 0,
      FeedProtein_Stage2: formData.FeedProtein_Stage2 || 0,
      FeedProtein_Stage3: formData.FeedProtein_Stage3 || 0,
      Estimated_mortality_Stage1: formData.Estimated_mortality_Stage1 || 0,
      Estimated_mortality_Stage2: formData.Estimated_mortality_Stage2 || 0,
      Estimated_mortality_Stage3: formData.Estimated_mortality_Stage3 || 0,
      o2Absorption: formData.o2Absorption || 0,
      co2Removal: formData.co2Removal || 0,
      tssRemoval: formData.tssRemoval || 0,
      tanRemoval: formData.tanRemoval || 0,
      targetSpecies: formData.targetSpecies || '',
      harvestFrequency: formData.harvestFrequency || '',
      initialWeight: formData.initialWeightWiG || 0,
      juvenileSize: formData.juvenileSize || 0
    };

    return (
      <div className="step-section">
        {/* Display Input Parameters */}
        <InputsDisplay inputs={inputs} />
        
        <h4>Mass Balance Report</h4>
        <div className="report-cards">
          <div className="row g-4">
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="text-primary">Oxygen</Card.Title>
                  <hr />
                  <p>
                    <strong>O₂ Saturation Adjusted:</strong>
                    <span>{(results.oxygen.saturationAdjustedMgL ?? 0).toFixed(2)} mg/L</span>
                  </p>
                  <p>
                    <strong>Min DO (use):</strong>
                    <span>{results.oxygen.MINDO_use ?? '-'} mg/L</span>
                  </p>
                  <p>
                    <strong>Oxygen Effluent Concentration:</strong>
                    <span>{results.oxygen.effluentConc.toFixed(2)} mg/L</span>
                  </p>
                  <p>
                    <strong>Oxygen Consumption (Production):</strong>
                    <span>{results.oxygen.consMgPerDay.toFixed(0)} mg/day</span>
                  </p>
                  <p>
                    <strong>Oxygen Consumption (Production):</strong>
                    <span>{results.oxygen.consKgPerDay.toFixed(2)} kg/day</span>
                  </p>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="text-primary">TSS</Card.Title>
                  <hr />
                  <p>
                    <strong>Max TSS (use):</strong>
                    <span>{results.tss.MAXTSS_use ?? '-'} mg/L</span>
                  </p>
                  <p>
                    <strong>TSS Effluent Concentration:</strong>
                    <span>{results.tss.effluentConc.toFixed(2)} mg/L</span>
                  </p>
                  <p>
                    <strong>TSS Production:</strong>
                    <span>{results.tss.prodMgPerDay.toFixed(0)} mg/day</span>
                  </p>
                  <p>
                    <strong>TSS Production:</strong>
                    <span>{results.tss.prodKgPerDay.toFixed(2)} kg/day</span>
                  </p>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="text-primary">CO2</Card.Title>
                  <hr />
                  <p>
                    <strong>Max CO₂ (use):</strong>
                    <span>{results.co2.MAXCO2_use ?? '-'} mg/L</span>
                  </p>
                  <p>
                    <strong>CO₂ Effluent Concentration:</strong>
                    <span>{results.co2.effluentConc.toFixed(2)} mg/L</span>
                  </p>
                  <p>
                    <strong>CO₂ Production:</strong>
                    <span>{results.co2.prodMgPerDay.toFixed(0)} mg/day</span>
                  </p>
                  <p>
                    <strong>CO₂ Production:</strong>
                    <span>{results.co2.prodKgPerDay.toFixed(2)} kg/day</span>
                  </p>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-6">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="text-primary">TAN</Card.Title>
                  <hr />
                  <p>
                    <strong>Max TAN (use):</strong>
                    <span>{results.tan.MAXTAN_use ?? '-'} mg/L</span>
                  </p>
                  <p>
                    <strong>TAN Effluent Concentration:</strong>
                    <span>{results.tan.effluentConc.toFixed(2)} mg/L</span>
                  </p>
                  <p>
                    <strong>TAN Production:</strong>
                    <span>{results.tan.prodMgPerDay.toFixed(0)} mg/day</span>
                  </p>
                  <p>
                    <strong>TAN Production:</strong>
                    <span>{results.tan.prodKgPerDay.toFixed(2)} kg/day</span>
                  </p>
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Stage 6: Juvenile (Stage 1) */}
          {formData.basicStep6Results && formData.basicStep6Results.step_6 && (
            <div className="col-12 mt-2">
              <h5 className="mb-3">Stage 6: Juvenile (Stage 1)</h5>
              {(() => {
                const s1 = formData.basicStep6Results.step_6 || {};
                return (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <Card className="h-100 shadow-sm oxygen-card">
                        <Card.Body>
                          <Card.Title className="text-primary">Oxygen</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">L/min</span><strong>{s1.oxygen?.l_per_min ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.oxygen?.m3_per_hr ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6">
                      <Card className="h-100 shadow-sm co2-card">
                        <Card.Body>
                          <Card.Title className="text-primary">CO2</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">L/min</span><strong>{s1.co2?.l_per_min ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.co2?.m3_per_hr ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6">
                      <Card className="h-100 shadow-sm tss-card">
                        <Card.Body>
                          <Card.Title className="text-primary">TSS</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">L/min</span><strong>{s1.tss?.l_per_min ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.tss?.m3_per_hr ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6">
                      <Card className="h-100 shadow-sm tan-card">
                        <Card.Body>
                          <Card.Title className="text-primary">TAN</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">L/min</span><strong>{s1.tan?.l_per_min ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.tan?.m3_per_hr ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Limiting Factor (Stage 1) */}
          {formData.basicLimitingFactor && formData.basicLimitingFactor.stage1 && (
            <div className="col-12 mt-2">
              <h5 className="mb-3">Limiting Factor (Stage 1)</h5>
              {(() => {
                const lf = formData.basicLimitingFactor.stage1 || {};
                const cardClass = (factor) => {
                  const f = (factor || '').toString().toLowerCase();
                  if (f.includes('oxygen')) return 'oxygen-card';
                  if (f.includes('co2')) return 'co2-card';
                  if (f.includes('tss')) return 'tss-card';
                  if (f.includes('tan')) return 'tan-card';
                  return 'oxygen-card';
                };
                return (
                  <div className="row g-4">
                    <div className="col-md-4">
                      <Card className={`h-100 shadow-sm ${cardClass(lf.factor)}`}>
                        <Card.Body>
                          <Card.Title className="text-primary">Stage 1</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">Factor</span><strong>{lf.factor ?? '-'}</strong></div>
                            <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.flow_l_per_min ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.flow_m3_per_hr ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          {/* Actions (match previous sizes/placements) */}
          <div className="navigation-buttons d-flex justify-content-between mt-4">
            <Button 
              variant="outline-secondary" 
              size="sm"
              style={{ width: '100px' }}
              onClick={() => {
                setShowCombinedInputs(true);
                setStep(2);
              }}
            >
              Back
            </Button>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                style={{ width: '130px' }}
                className="me-2"
                onClick={() => {
                  try {
                    const doc = generateMassBalanceReport(formData, results);
                    const fileName = `Mass_Balance_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                    doc.save(fileName);
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    alert('Error generating PDF. Please try again.');
                  }
                }}
              >
                Download
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={{ width: '220px' }}
                onClick={() => navigate('/dashboard')}
              >
                Save & Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInputWithTooltip = (name, label, unit = '', type = 'number') => {
    // Debug specific fields
    if (name === 'ph' || name === 'initialWeightWiG') {
      console.log(`[FormDebug] Rendering ${name}:`, {
        formDataValue: formData[name],
        formDataType: typeof formData[name],
        isUndefined: formData[name] === undefined,
        isNull: formData[name] === null,
        finalValue: (formData[name] !== undefined && formData[name] !== null) ? String(formData[name]) : ''
      });
    }
    
    // Special handling for harvest frequency dropdown
    if (name === 'harvestFrequency') {
      return (
        <Form.Group key={name} className="mb-3">
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip>{label} {unit ? `(${unit})` : ''}</Tooltip>}
          >
            <Form.Label>{label} {unit ? <span className="text-muted">({unit})</span> : ''}</Form.Label>
          </OverlayTrigger>
          <Form.Select
            name={name}
            value={formData[name] || 'Fortnightly'}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="Fortnightly">Fortnightly</option>
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
          </Form.Select>
        </Form.Group>
      );
    }
    
    return (
      <Form.Group key={name} className="mb-3">
        <OverlayTrigger
          placement="right"
          overlay={<Tooltip>{label} {unit ? `(${unit})` : ''}</Tooltip>}
        >
          <Form.Label>{label} {unit ? <span className="text-muted">({unit})</span> : ''}</Form.Label>
        </OverlayTrigger>
        <Form.Control
          type={type}
          name={name}
          value={(formData[name] !== undefined && formData[name] !== null) ? String(formData[name]) : ''}
          onChange={handleInputChange}
          // Removed disabled condition - input fields are now always editable
        />
      </Form.Group>
    );
  };

  const renderStep = () => {
    // For basic calculations, enforce new flow: step 2 is always combined inputs
    if (calculationType === 'basic') {
      if (step === 2) return null; // CombinedInputsPage renders instead
      // Remap report to step 3 for basic
      if (step === 3) {
        console.log('Step 3 case reached, calculationType:', calculationType);
        console.log('Rendering basic report');
        return renderBasicReport();
      }
    }
    
    switch (step) {
      case 1: // Initial
        return (
          <div className="step-section">
            <h4>Initial Setup</h4>
            <div className="form-group">
              {renderInputWithTooltip('designSystemName', 'Design System Name', '', 'text')}
              {renderInputWithTooltip('projectName', 'Project Name', '', 'text')}
              
              <Form.Group className="mb-3">
                <Form.Label>System Purpose</Form.Label>
                <Form.Select name="systemPurpose" value={formData.systemPurpose} onChange={handleInputChange} disabled={loading}>
                  <option value="Commercial aquaculture production (monoculture)">Commercial aquaculture production (monoculture)</option>
                  {/* Add other options as needed */}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>System Type</Form.Label>
                <Form.Select name="systemType" value={formData.systemType} onChange={handleInputChange} disabled={loading}>
                  <option value="RAS">RAS</option>
                  <option value="Flow-through" disabled>Flow-through (Coming Soon)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Target Species</Form.Label>
                <Form.Select 
                  name="targetSpecies" 
                  value={formData.targetSpecies} 
                  onChange={handleInputChange}
                  disabled={loading || loadingSpecies}
                >
                  <option value="">
                    {loadingSpecies ? 'Loading species...' : 'Select a species'}
                  </option>
                  {!loadingSpecies && speciesList.length === 0 && (
                    <option value="" disabled>No species available</option>
                  )}
                  {!loadingSpecies && speciesList.map((species, index) => (
                    <option key={`${species}-${index}`} value={species}>{species}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Use Recommended Water Quality Values"
                    name="useRecommendedValues"
                    checked={formData.useRecommendedValues}
                    onChange={handleInputChange}
                  disabled={loading}
                />
                {error && (
                  <div className="text-danger mt-2" style={{ fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}
                    </Form.Group>
            </div>
            <div className="navigation-buttons">
              <Button 
                variant="outline-secondary" 
                size="sm"
                style={{ width: '100px' }}
                onClick={prevStep}
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                style={{ width: '150px' }}
                onClick={nextStep}
                disabled={loading}
              >
                {loading ? 'Creating Design...' : 'Continue'}
              </Button>
            </div>
          </div>
        );

      case 2: // Water Quality
        return (
          <div className="step-section">
            <h4>Water Quality Parameters</h4>
            <div className="form-group">
              <div className="mb-4">
                <h5>Required Parameters</h5>
                {renderInputWithTooltip('waterTemp', 'Water Temperature', '°C')}
                {renderInputWithTooltip('salinity', 'Salinity', '%')}
                {renderInputWithTooltip('siteElevation', 'Site Elevation', 'm')}
              </div>

              <div className="mb-4">
                <h5>Other Water Quality Parameters</h5>
                {renderInputWithTooltip('minDO', 'Minimum Dissolved Oxygen (O₂)', 'mg/l')}
                {renderInputWithTooltip('targetMinO2Saturation', 'Target Minimum O₂ Saturation', '%')}
                {renderInputWithTooltip('ph', 'ph Level')}
                {renderInputWithTooltip('alkalinity', 'Alkalinity', 'mg/L')}
                {renderInputWithTooltip('minTSS', 'Maximum Total Suspended Solids (TSS)', 'mg/l')}
                {renderInputWithTooltip('maxCO2', 'Maximum Dissolved Carbon Dioxide (CO₂)', 'mg/l')}
                {renderInputWithTooltip('maxTAN', 'Maximum Total Ammonia (TAN)', 'mg/L')}
              </div>
            </div>
            <div className="navigation-buttons">
              <Button 
                variant="outline-secondary" 
                size="sm"
                style={{ width: '100px' }}
                onClick={prevStep}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                style={{ width: '100px' }}
                onClick={nextStep}
              >
                Continue
              </Button>
            </div>
          </div>
        );
            
      case 3: // Production
        return (
          <div className="step-section">
            <h4>Production Information</h4>
            <div className="form-group">
              {renderInputWithTooltip('tankVolume', 'Tank Volume', 'm³')}
              {renderInputWithTooltip('productionTarget_t', 'Target production per year', 't')}
              {renderInputWithTooltip('targetFishWeight', 'Target fish weight at harvest', 'g')}
              {renderInputWithTooltip('feedRate', 'Feed rate', '% of biomass/day')}
              {renderInputWithTooltip('feedConversionRatio', 'Feed Conversion Ratio (FCR)', '')}
              {renderInputWithTooltip('numTanks', 'Total Number of Tanks')}
              {renderInputWithTooltip('targetNumFish', 'Target Max Stocking Density', 'kg/m³')}
              {renderInputWithTooltip('feedProtein', 'Feed protein content', '%')}

              {renderInputWithTooltip('harvestFrequency', 'Harvest frequency', '', 'text')}
              {renderInputWithTooltip('initialWeightWiG', 'Initial weight', 'g')}

              {/* Stage-wise Feed Conversion & Mortality */}
              <div className="row g-3 mt-2">
                <div className="col-md-4">
                  <div className="card p-3">
                    <div className="fw-semibold mb-2">Stage 1 (Juvenile)</div>
                    {renderInputWithTooltip('FCR_Stage1', 'FCR', '', 'number')}
                    {renderInputWithTooltip('FeedProtein_Stage1', 'Feed protein', '%', 'number')}
                    {renderInputWithTooltip('Estimated_mortality_Stage1', 'Mortality', '%', 'number')}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card p-3">
                    <div className="fw-semibold mb-2">Stage 2 (Fingerling)</div>
                    {renderInputWithTooltip('FCR_Stage2', 'FCR', '', 'number')}
                    {renderInputWithTooltip('FeedProtein_Stage2', 'Feed protein', '%', 'number')}
                    {renderInputWithTooltip('Estimated_mortality_Stage2', 'Mortality', '%', 'number')}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card p-3">
                    <div className="fw-semibold mb-2">Stage 3 (Growout)</div>
                    {renderInputWithTooltip('FCR_Stage3', 'FCR', '', 'number')}
                    {renderInputWithTooltip('FeedProtein_Stage3', 'Feed protein', '%', 'number')}
                    {renderInputWithTooltip('Estimated_mortality_Stage3', 'Mortality', '%', 'number')}
                  </div>
                </div>
              </div>
            </div>
            <div className="navigation-buttons">
              <Button 
                variant="outline-secondary" 
                size="sm"
                style={{ width: '100px' }}
                onClick={prevStep}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                style={{ width: '100px' }}
                onClick={nextStep}
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 4: // Efficiency
        console.log('Rendering Efficiency step:', {
          loading,
          formData,
          error
        });
        return (
          <div className="step-section">
            <h4>System Efficiency Parameters</h4>
            <div className="form-group">
              {renderInputWithTooltip('o2Absorption', 'O₂ Absorption Efficiency', '%')}
              {renderInputWithTooltip('co2Removal', 'CO₂ Removal Efficiency', '%')}
              {renderInputWithTooltip('tssRemoval', 'TSS Removal Efficiency', '%')}
              {renderInputWithTooltip('tanRemoval', 'TAN Removal Efficiency', '%')}
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginTop: '20px'
              }}>
              <Button 
                variant="outline-secondary" 
                size="sm"
                style={{ width: '100px', borderRadius: '8px' }}
                onClick={prevStep}
              >
                Back
              </Button>
              <Button 
                variant="primary"
                size="sm"
                style={{ width: '160px', marginLeft: 'auto', borderRadius: '8px' }}
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError('');

                    // Get the project ID from localStorage
                    const projectId = designIds.projectId;
                    if (!projectId) {
                      throw new Error('Project ID not found');
                    }

                    console.log('Starting mass balance calculation...');
                    
                    // First, submit all parameters to water quality endpoint
                    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                    if (!token) {
                      throw new Error('Authentication token not found');
                    }
                    
                    console.log('Project ID:', projectId);
                    console.log('Auth token found:', !!token);

                    // Helper function to safely parse numbers, allowing 0
                    const safeParseFloat = (value) => {
                      // Handle empty string, undefined, or null
                      if (value === '' || value === undefined || value === null) {
                        return 0;
                      }
                      // Parse the number
                      const parsed = parseFloat(value);
                      return isNaN(parsed) ? 0 : parsed;
                    };

                    // Get raw values first
                    console.log('Raw form values:', {
                      waterTemp: formData.waterTemp,
                      salinity: formData.salinity,
                      siteElevation: formData.siteElevation,
                      'typeof waterTemp': typeof formData.waterTemp,
                      'typeof salinity': typeof formData.salinity,
                      'typeof siteElevation': typeof formData.siteElevation
                    });

                    // Parse the required fields first, defaulting to 0
                    const temperature = Math.round(safeParseFloat(formData.waterTemp));
                    const salinity = safeParseFloat(formData.salinity);
                    const elevation = safeParseFloat(formData.siteElevation);

                    // Log the parsed values
                    console.log('Parsed values:', {
                      temperature,
                      salinity,
                      elevation,
                      'typeof temperature': typeof temperature,
                      'typeof salinity': typeof salinity,
                      'typeof elevation': typeof elevation
                    });

                    console.log('Parsed required fields:', {
                      'Raw values': {
                        waterTemp: formData.waterTemp,
                        salinity: formData.salinity,
                        siteElevation: formData.siteElevation
                      },
                      'Parsed values': {
                        temperature,
                        salinity,
                        elevation
                      }
                    });

                    // Validate required fields, allowing 0 as a valid value
                    const requiredFields = [
                      { key: 'waterTemp', label: 'Water Temperature', apiKey: 'water_temperature' },
                      { key: 'salinity', label: 'Salinity', apiKey: 'salinity' },
                      { key: 'siteElevation', label: 'Site Elevation', apiKey: 'elevation_m' }
                    ];

                    // Log validation details
                    console.log('Validating required inputs:', {
                      'Raw form values': {
                        waterTemp: formData.waterTemp,
                        salinity: formData.salinity,
                        siteElevation: formData.siteElevation
                      },
                      'Types': {
                        waterTemp: typeof formData.waterTemp,
                        salinity: typeof formData.salinity,
                        siteElevation: typeof formData.siteElevation
                      }
                    });

                    console.log('Form data before validation:', formData);

                    const missingInputs = requiredFields
                      .filter(({ key, label }) => {
                        // Get the actual form field key
                        const formKey = key === 'waterTemp' ? 'waterTemp' : 
                                      key === 'salinity' ? 'salinity' : 
                                      key === 'siteElevation' ? 'siteElevation' : key;
                        
                        const value = formData[formKey];
                        const parsedValue = Number(value);
                        const isInvalid = value === '' || value === undefined || value === null || isNaN(parsedValue);
                        
                        console.log(`Validating ${label}:`, {
                          formKey,
                            rawValue: value,
                            parsedValue,
                            type: typeof value,
                            isEmpty: value === '',
                            isUndefined: value === undefined,
                            isNull: value === null,
                          isNaN: isNaN(parsedValue),
                          isInvalid
                        });
                        
                        return isInvalid;
                      })
                      .map(({ label }) => label);

                    if (missingInputs.length > 0) {
                      throw new Error(`Missing required fields: ${missingInputs.join(', ')}`);
                    }

                    // Create the request body with all phase values - exactly matching API docs
                    const waterTemp = Number(formData.waterTemp);
                    console.log('Processing water temperature:', {
                      raw: formData.waterTemp,
                      parsed: waterTemp,
                      rounded: Math.round(waterTemp)
                    });

                    // Debug: Log form data before creating request body
                    console.log('Form data before API request:', formData);
                    console.log('Specific missing fields check:', {
                      alkalinity: formData.alkalinity,
                      targetMinO2Saturation: formData.targetMinO2Saturation,
                      harvestFrequency: formData.harvestFrequency,
                      supplementPureO2: formData.supplementPureO2,
                      productionTarget_t: formData.productionTarget_t
                    });
                    
                    // Debug: Test the conversion logic
                    console.log('Conversion test:', {
                      alkalinity_test: formData.alkalinity ? Number(formData.alkalinity) : 250,
                      targetMinO2Saturation_test: formData.targetMinO2Saturation ? Number(formData.targetMinO2Saturation) : 95,
                      productionTarget_t_test: formData.productionTarget_t ? Number(formData.productionTarget_t) : 100
                    });

                    // Create request body with only basic calculation parameters as specified
                    const requestBody = {
                      // Basic calculation parameters only (as specified by user)
                      TAN_max: formData.maxTAN ? Number(formData.maxTAN) : 0,
                      TSS_max: formData.minTSS ? Number(formData.minTSS) : 0,
                      co2_removal_efficiency: formData.co2Removal ? Number(formData.co2Removal) : 0,
                      dissolved_CO2_max: formData.maxCO2 ? Number(formData.maxCO2) : 0,
                      dissolved_O2_min: formData.minDO ? Number(formData.minDO) : 0,
                      elevation_m: formData.siteElevation ? Number(formData.siteElevation) : 0,
                      feed_protein_percent: formData.FeedProtein_Stage1 ? Number(formData.FeedProtein_Stage1) : 0,
                      number_of_tanks: formData.numTanks ? Number(formData.numTanks) : 0, // Map to formData.numTanks if available
                      oxygen_injection_efficiency: formData.o2Absorption ? Number(formData.o2Absorption) : 0,
                      ph: formData.ph ? Number(formData.ph) : 0,
                      salinity: formData.salinity ? Number(formData.salinity) : 0,
                      species: formData.targetSpecies || "string",
                      tan_removal_efficiency: formData.tanRemoval ? Number(formData.tanRemoval) : 0,
                      tanks_volume_each: formData.tankVolume ? Number(formData.tankVolume) : 0, // Map to formData.tankVolume if available
                      target_feed_rate: formData.feedRate ? Number(formData.feedRate) : 0, // Map to formData.feedRate if available
                      target_market_fish_size: formData.targetFishWeight ? Number(formData.targetFishWeight) : 0,
                      target_max_stocking_density: formData.targetNumFish ? Number(formData.targetNumFish) : 0, // Map to formData.targetNumFish if available
                      temperature: formData.waterTemp ? Math.round(Number(formData.waterTemp)) : 0,
                      tss_removal_efficiency: formData.tssRemoval ? Number(formData.tssRemoval) : 0,
                      use_recommended: Boolean(formData.useRecommendedValues),
                      type: calculationType // Add type field based on calculation type
                    };

                    // Debug: Log the complete request body
                    console.log('Complete request body being sent:', requestBody);
                    console.log('Basic calculation parameters:', {
                      TAN_max: requestBody.TAN_max,
                      TSS_max: requestBody.TSS_max,
                      co2_removal_efficiency: requestBody.co2_removal_efficiency,
                      dissolved_CO2_max: requestBody.dissolved_CO2_max,
                      dissolved_O2_min: requestBody.dissolved_O2_min,
                      elevation_m: requestBody.elevation_m,
                      feed_protein_percent: requestBody.feed_protein_percent,
                      number_of_tanks: requestBody.number_of_tanks,
                      oxygen_injection_efficiency: requestBody.oxygen_injection_efficiency,
                      pH: requestBody.pH,
                      salinity: requestBody.salinity,
                      species: requestBody.species,
                      tan_removal_efficiency: requestBody.tan_removal_efficiency,
                      tanks_volume_each: requestBody.tanks_volume_each,
                      target_feed_rate: requestBody.target_feed_rate,
                      target_market_fish_size: requestBody.target_market_fish_size,
                      target_max_stocking_density: requestBody.target_max_stocking_density,
                      temperature: requestBody.temperature,
                      tss_removal_efficiency: requestBody.tss_removal_efficiency,
                      use_recommended: requestBody.use_recommended
                    });
                    
                    // Debug: Check basic field conversions
                    console.log('Basic field conversion debug:', {
                      'formData.waterTemp': formData.waterTemp,
                      'formData.salinity': formData.salinity,
                      'formData.siteElevation': formData.siteElevation,
                      'requestBody.temperature': requestBody.temperature,
                      'requestBody.salinity': requestBody.salinity,
                      'requestBody.elevation_m': requestBody.elevation_m
                    });

                    // Log the request details
                    console.log('Request body:', {
                      required: {
                        temperature: requestBody.temperature,
                        salinity: requestBody.salinity,
                        elevation: requestBody.elevation
                      },
                      full: requestBody
                    });

                    // Log raw form values
                    console.log('Raw form values:', {
                      waterTemp: formData.waterTemp,
                      salinity: formData.salinity,
                      siteElevation: formData.siteElevation
                    });

                    // Log parsed values
                    console.log('Parsed values:', {
                      temperature: requestBody.temperature,
                      salinity: requestBody.salinity,
                      elevation_m: requestBody.elevation_m
                    });

                    // Log the form data and request body before validation
                    console.log('Form data before validation:', {
                      waterTemp: formData.waterTemp,
                      salinity: formData.salinity,
                      siteElevation: formData.siteElevation
                    });
                    console.log('Request body before validation:', requestBody);

                    // Log the request body before validation
                    console.log('Request body before validation:', requestBody);

                    // Validate that all required values are valid numbers
                    [
                      { key: 'temperature', label: 'Water Temperature', formKey: 'waterTemp' },
                      { key: 'salinity', label: 'Salinity', formKey: 'salinity' },
                      { key: 'elevation_m', label: 'Site Elevation', formKey: 'siteElevation' }
                    ].forEach(({ key, label, formKey }) => {
                      const value = requestBody[key];
                      const rawValue = formData[formKey];
                      const parsedValue = Number(rawValue);
                      console.log(`Validating ${label}:`, {
                        key,
                        value,
                        rawValue,
                        parsedValue,
                        type: typeof value,
                        isNumber: typeof value === 'number',
                        isNaN: isNaN(value)
                      });
                      if (typeof value !== 'number' || isNaN(value)) {
                        throw new Error(`Invalid value for ${label}: ${rawValue} (computed: ${value}). Please check the form data and try again.`);
                      }
                    });

                    // Log the final request details
                    console.log('Making POST request with:', {
                      url: `/backend/new_design/api/projects/${projectId}/water-quality-parameters`,
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer [token]',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: requestBody
                    });

                    // Log the stringified request body
                    console.log('Request body as string:', JSON.stringify(requestBody));

                    // Log critical values before POST
                    console.log('Critical values check:', {
                      temperature: requestBody.temperature,
                      salinity: requestBody.salinity,
                      elevation_m: requestBody.elevation_m,
                      type_of_temperature: typeof requestBody.temperature,
                      type_of_salinity: typeof requestBody.salinity,
                      type_of_elevation: typeof requestBody.elevation_m
                    });
                    
                    // POST all parameters
                    setLoadingStep('Submitting water quality parameters...');
                    console.log('Starting water quality parameters POST request...');
                    console.log('Project ID:', projectId);
                    console.log('Request URL:', `/backend/new_design/api/projects/${projectId}/water-quality-parameters`);
                    console.log('Request headers:', {
                      'Authorization': 'Bearer [hidden]',
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    });
                    console.log('Request body:', JSON.stringify(requestBody, null, 2));

                    // Make the POST request
                    const paramResponse = await fetch(`/backend/new_design/api/projects/${projectId}/water-quality-parameters`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: JSON.stringify(requestBody)
                    });

                    // Get the response data first
                    const paramData = await paramResponse.text();
                    console.log('POST response status:', paramResponse.status);
                    console.log('POST response headers:', Object.fromEntries([...paramResponse.headers]));
                    console.log('POST response data:', paramData);
                    
                    // Try to parse the response data
                    let responseJson;
                    try {
                      responseJson = JSON.parse(paramData);
                      console.log('Parsed response:', responseJson);
                    } catch (e) {
                      console.error('Failed to parse response as JSON:', e);
                      console.log('Raw response:', paramData);
                      throw new Error('Invalid JSON response from server');
                    }

                    // Check for errors
                    if (!paramResponse.ok) {
                      console.error('Water quality parameters POST failed:', {
                        status: paramResponse.status,
                        statusText: paramResponse.statusText,
                        response: responseJson
                      });
                      throw new Error(responseJson?.error || `Failed to submit parameters: ${paramResponse.status}`);
                    }

                    // Log success
                    console.log('Water quality parameters POST successful');

                    // Wait for the server to process data
                    setLoadingStep('Processing water quality parameters...');
                    console.log('Waiting for server to process data...');
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5 seconds

                    // Verify water quality parameters were saved before proceeding
                    console.log('Verifying water quality parameters...');
                    const initialVerifyResponse = await fetch(`/backend/new_design/api/projects/${projectId}/water-quality-parameters`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                      }
                    });

                    if (!initialVerifyResponse.ok) {
                      throw new Error('Failed to verify water quality parameters');
                    }

                    const verificationResult = await initialVerifyResponse.json();
                    console.log('Water quality parameters verification response:', verificationResult);

                    // Add detailed logging of the parameters
                    const params = verificationResult.parameters || {};
                    console.log('Raw verification response:', verificationResult);
                    console.log('Extracted water quality parameters:', params);
                    
                    console.log('Checking water quality parameters:', {
                      temperature: {
                        value: params.temperature,
                        type: typeof params.temperature,
                        exists: params.temperature !== undefined && params.temperature !== null
                      },
                      salinity: {
                        value: params.salinity,
                        type: typeof params.salinity,
                        exists: params.salinity !== undefined && params.salinity !== null
                      },
                      elevation_m: {
                        value: params.elevation_m,
                        type: typeof params.elevation_m,
                        exists: params.elevation_m !== undefined && params.elevation_m !== null
                      }
                    });

                    // Verify that the POST was successful
                    if (verificationResult.status !== 'success') {
                      console.error('API response indicates failure:', verificationResult);
                      throw new Error(`Failed to save water quality parameters: ${verificationResult.message || 'Unknown error'}`);
                    }

                    // Since the API doesn't return the parameters directly in water_quality_params,
                    // we'll verify the request was successful and proceed with calculations
                    console.log('Water quality parameters saved successfully:', verificationResult);

                    // Log the parameters we sent for verification
                    console.log('Parameters sent to API:', {
                      temperature: requestBody.temperature,
                      salinity: requestBody.salinity,
                      elevation_m: requestBody.elevation_m
                    });

                    console.log('All required water quality parameters verified successfully');

                    console.log('Water quality parameters verified, proceeding to calculations...');
                    let retryCount = 0;
                    const maxRetries = 3;
                    let lastError = null;

                    while (retryCount < maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 300 + (retryCount * 200))); // Increasing delay with each retry

                      // Verify parameters are available
                      const checkResponse = await fetch(`/backend/new_design/api/projects/${projectId}/water-quality-parameters`, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/json'
                        }
                      });

                      if (checkResponse.ok) {
                        const checkData = await checkResponse.json();
                        const params = checkData.parameters || {};
                        
                        console.log(`Retry ${retryCount + 1} - Checking parameters:`, {
                          temperature: params.temperature,
                          salinity: params.salinity,
                          elevation_m: params.elevation_m
                        });

                        // If all required parameters are present, break the loop
                        if (params.temperature !== undefined && 
                            params.salinity !== undefined && 
                            params.elevation_m !== undefined) {
                          console.log('All required parameters verified present');
                          break;
                        }
                      }

                      console.log(`Retry ${retryCount + 1} - Parameters not yet available`);
                      retryCount++;
                      
                      if (retryCount === maxRetries) {
                        console.warn('Max retries reached waiting for parameters');
                      }
                    }

                    // Verify the parameters were saved by making a GET request
                    console.log('Verifying parameters were saved...');
                    const verifyResponse = await fetch(`/backend/new_design/api/projects/${projectId}/water-quality-parameters`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                      }
                    });

                    if (!verifyResponse.ok) {
                      console.error('Verification GET failed:', {
                        status: verifyResponse.status,
                        statusText: verifyResponse.statusText
                      });
                      throw new Error('Failed to verify parameters were saved');
                    }

                    const verificationData = await verifyResponse.json();
                    console.log('Verification successful:', verificationData);
                    console.log('Saved water quality parameters:', verificationData.parameters);
                    
                    // Double-check the critical parameters
                    const savedParams = verificationData.parameters || {};
                    console.log('Critical parameters check:', {
                      temperature: savedParams.temperature,
                      salinity: savedParams.salinity,
                      elevation_m: savedParams.elevation_m,
                      'typeof temperature': typeof savedParams.temperature,
                      'typeof salinity': typeof savedParams.salinity,
                      'typeof elevation_m': typeof savedParams.elevation_m
                    });

                    // After successful POST, wait to ensure parameters are processed
                    setLoadingStep('Finalizing parameter processing...');
                    console.log('Waiting for parameters to be fully processed...');
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5 seconds

                    // Verify one more time before calculations
                    const finalVerifyResponse = await fetch(`/backend/new_design/api/projects/${projectId}/water-quality-parameters`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                      }
                    });

                    if (finalVerifyResponse.ok) {
                      const finalVerifyData = await finalVerifyResponse.json();
                      const params = finalVerifyData.parameters || {};
                      
                      // Log the exact parameters we need
                      console.log('Final verification before calculations:', {
                        raw_params: params,
                        critical_params: {
                          temperature: params.temperature,
                          salinity: params.salinity,
                          elevation_m: params.elevation_m
                        }
                      });

                      // Verify all required parameters are present and have valid values
                      const missingParams = [];
                      if (params.temperature === undefined || params.temperature === null) missingParams.push('temperature');
                      if (params.salinity === undefined || params.salinity === null) missingParams.push('salinity');
                      if (params.elevation_m === undefined || params.elevation_m === null) missingParams.push('elevation_m');

                      if (missingParams.length > 0) {
                        console.error('Missing parameters in verification:', missingParams);
                        throw new Error(`Parameters not saved correctly: ${missingParams.join(', ')}`);
                      }

                      // Log success
                      console.log('All required parameters verified present with values:', {
                        temperature: params.temperature,
                        salinity: params.salinity,
                        elevation_m: params.elevation_m
                      });
                    } else {
                      throw new Error('Failed to verify parameters before calculations');
                    }

                    // After successful POST and verification, get the calculations
                    console.log('Starting production calculations GET request...');
                    console.log('Request URL:', `/backend/formulas/api/projects/${projectId}/production-calculations`);
                    
                    // Wait a bit longer to ensure all parameters are processed
                    setLoadingStep('Preparing calculations...');
                    console.log('Waiting for parameters to be fully processed before calculations...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    let results;
                    try {
                      // First verify all required parameters are present
                      const paramsResponse = await fetch(`/backend/new_design/api/projects/${projectId}/water-quality-parameters`, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/json'
                        }
                      });

                      if (!paramsResponse.ok) {
                        throw new Error('Failed to verify parameters before calculations');
                      }

                      const paramsData = await paramsResponse.json();
                      console.log('Current project parameters:', paramsData);

                      // Now request the calculations
                      setLoadingStep('Calculating mass balance...');
                      const calcResponse = await fetch(`/backend/formulas/api/projects/${projectId}/production-calculations`, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/json'
                        }
                      });

                      console.log('Calculations GET response status:', calcResponse.status);
                      console.log('Calculations GET response headers:', Object.fromEntries([...calcResponse.headers]));

                      // Get the raw response text first
                      const calcResponseText = await calcResponse.text();
                      console.log('Calculations GET raw response:', calcResponseText);

                      let calcData;
                      try {
                        calcData = JSON.parse(calcResponseText);
                        console.log('Parsed calculation data:', calcData);
                      } catch (e) {
                        console.error('Failed to parse calculation response as JSON:', e);
                        throw new Error('Invalid JSON response from calculations endpoint');
                      }

                      if (calcResponse.ok) {
                        console.log('Calculations GET successful');
                        
                        // Log the calculation data
                        console.log('Raw calculation data:', calcData);
                        
                        // Map API response to results object
                        results = {
                          oxygen: {
                            saturationAdjustedMgL: calcData.o2_saturation_adjusted_mg_l || 0,
                            // New: min DO to use (mg/L)
                            MINDO_use: (calcData.min_do_mg_l ?? calcData.min_do_use_mg_l) ?? null,
                            effluentConc: calcData.oxygen_effluent_concentration_mg_l || 0,
                            prodMgPerDay: calcData.oxygen_consumption_production_mg_per_day || 0,
                            prodKgPerDay: calcData.oxygen_consumption_production_kg_per_day || 0
                          },
                          tss: {
                            effluentConc: calcData.tss_effluent_concentration_mg_l || 0,
                            prodMgPerDay: calcData.tss_production_mg || 0,
                            prodKgPerDay: calcData.tss_production_kg || 0,
                            // New: max TSS to use (mg/L)
                            MAXTSS_use: calcData.max_tss_use_mg_l ?? null
                          },
                          co2: {
                            effluentConc: calcData.co2_effluent_concentration_mg_l || 0,
                            prodMgPerDay: calcData.co2_production_mg_per_day || 0,
                            prodKgPerDay: calcData.co2_production_kg_per_day || 0,
                            // New: max CO2 to use (mg/L)
                            MAXCO2_use: calcData.max_co2_use_mg_l ?? null
                          },
                          tan: {
                            effluentConc: calcData.tan_effluent_concentration_mg_l || 0,
                            prodMgPerDay: calcData.tan_production_mg_per_day || 0,
                            prodKgPerDay: calcData.tan_production_kg_per_day || 0,
                            // New: max TAN to use (mg/L)
                            MAXTAN_use: calcData.max_tan_use_mg_l ?? null
                          }
                        };
                      } else {
                        console.log('Using dummy data due to API error:', calcResponse.status);
                        throw new Error('Failed to get calculations');
                      }
                    } catch (err) {
                      console.log('Using dummy data due to API error:', err);
                      // Use all dummy data if API fails
                      results = {
                        oxygen: {
                          saturationAdjustedMgL: 0,
                          effluentConc: 6.2,
                          prodMgPerDay: 1200000,
                          prodKgPerDay: 1.2
                        },
                        tss: {
                          effluentConc: 25.0,
                          prodMgPerDay: 1800000,
                          prodKgPerDay: 1.8
                        },
                        co2: {
                          effluentConc: 15.5,
                          prodMgPerDay: 2500000,
                          prodKgPerDay: 2.5
                        },
                        tan: {
                          effluentConc: 1.0,
                          prodMgPerDay: 800000,
                          prodKgPerDay: 0.8
                        }
                      };
                    }

                    // Post minimal Stage 6 (Juvenile) parameters, then fetch Step 6 results
                    let basicStep6 = null;
                    let basicLimitingFactor = null;
                    try {
                      const currentProjectId = projectId || localStorage.getItem('currentProjectId');
                      if (currentProjectId) {
                        const stage6Payload = {
                          // Water quality
                          ph: formData.ph ? parseFloat(formData.ph) : 7,
                          temperature: formData.waterTemp ? parseFloat(formData.waterTemp) : 27,
                          dissolved_O2_min: formData.minDO ? parseFloat(formData.minDO) : 3.0,
                          target_min_o2_saturation: formData.targetMinO2Saturation ? parseFloat(formData.targetMinO2Saturation) : 95,
                          TAN_max: formData.maxTAN ? parseFloat(formData.maxTAN) : 2,
                          dissolved_CO2_max: formData.maxCO2 ? parseFloat(formData.maxCO2) : 15,
                          TSS_max: formData.minTSS ? parseFloat(formData.minTSS) : 80,
                          salinity: formData.salinity ? parseFloat(formData.salinity) : 0,
                          alkalinity: formData.alkalinity ? parseFloat(formData.alkalinity) : 250,
                          elevation_m: formData.siteElevation ? parseFloat(formData.siteElevation) : 0,

                          // Production
                          species: formData.targetSpecies || 'Nile tilapia',
                          production_target_t: formData.productionTarget_t ? parseFloat(formData.productionTarget_t) : 100,
                          target_market_fish_size: (formData.targetFishWeight && formData.targetFishWeight.toString().trim() !== '') ? parseFloat(formData.targetFishWeight) : null,
                          harvest_frequency: formData.harvestFrequency || 'Fortnightly',
                          initial_weight_wi_g: (formData.initialWeightWiG && formData.initialWeightWiG.toString().trim() !== '') ? parseFloat(formData.initialWeightWiG) : null,
                          juvenile_size: (formData.juvenileSize && formData.juvenileSize.toString().trim() !== '') ? parseFloat(formData.juvenileSize) : null,

                          // Stage-wise FCR & Mortality
                          fcr_stage1: formData.FCR_Stage1 ? parseFloat(formData.FCR_Stage1) : 1.1,
                          feed_protein_stage1: formData.FeedProtein_Stage1 ? parseFloat(formData.FeedProtein_Stage1) : 45,
                          estimated_mortality_stage1: formData.Estimated_mortality_Stage1 ? parseFloat(formData.Estimated_mortality_Stage1) : 0,
                          fcr_stage2: formData.FCR_Stage2 ? parseFloat(formData.FCR_Stage2) : 1.2,
                          feed_protein_stage2: formData.FeedProtein_Stage2 ? parseFloat(formData.FeedProtein_Stage2) : 45,
                          estimated_mortality_stage2: formData.Estimated_mortality_Stage2 ? parseFloat(formData.Estimated_mortality_Stage2) : 0,
                          fcr_stage3: formData.FCR_Stage3 ? parseFloat(formData.FCR_Stage3) : 1.3,
                          feed_protein_stage3: formData.FeedProtein_Stage3 ? parseFloat(formData.FeedProtein_Stage3) : 45,
                          estimated_mortality_stage3: formData.Estimated_mortality_Stage3 ? parseFloat(formData.Estimated_mortality_Stage3) : 0
                        };

                        // Submit Stage 6 parameters
                        await postAdvancedParameters(currentProjectId, { ...stage6Payload, type: calculationType });

                        // Fetch Step 6 results
                        basicStep6 = await getAdvancedStep6Results(currentProjectId);
                        // Fetch Limiting Factor
                        try {
                          basicLimitingFactor = await getAdvancedLimitingFactor(currentProjectId);
                        } catch (e) {
                          console.warn('Limiting factor not available during basic calc (non-blocking):', e);
                        }
                      }
                    } catch (e) {
                      console.warn('Stage 6 POST/GET failed during basic calc (non-blocking):', e);
                    }

                    // Show results in the current page
                    setLoadingStep('Generating report...');
                    setStep(5);  // Move to report step
                    setFormData(prev => ({
                      ...prev,
                      calculationResults: results,
                      basicStep6Results: basicStep6 || null,
                      basicLimitingFactor: basicLimitingFactor || null
                    }));

                  } catch (err) {
                    console.error('Error:', err);
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Calculating...' : 'Calculate Mass Balance'}
              </Button>
            </div>
          </div>
        );

      case 3: // Report for basic calculations
        console.log('Step 3 case reached, calculationType:', calculationType);
        if (calculationType === 'basic') {
          console.log('Rendering basic report');
          return renderBasicReport();
        }
        // Fall through to case 5 for advanced calculations

      case 5: // Report
        // Prefer advanced staged report when present; otherwise use basic results
        if (calculationType === 'advanced' && advancedReport && advancedReport.step6Results) {
          const s1 = advancedReport.step6Results;
          return (
            <div className="step-section">
              <h4>Advanced Report</h4>
              <div className="report-cards">
                {/* Stage 1 */}
                <h5 className="mb-3">Stage 1</h5>
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">Oxygen</Card.Title>
                        <div className="mt-3">
                          <div>mg/min: {s1.oxygen?.mg_per_minute ?? 0}</div>
                          <div>OC16 mg/day: {s1.oxygen?.oc16_mg_per_day ?? 0}</div>
                          <div>OC17 mg/hr: {s1.oxygen?.oc17_mg_per_hour ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">CO2</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.co2?.l_per_min ?? 0}</div>
                          <div>m³/min: {s1.co2?.m3_per_min ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mt-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">TSS</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.tss?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.tss?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mt-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">TAN</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.tan?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.tan?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                {/* Stage 2 */}
                <h5 className="mb-3">Stage 2</h5>
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">Oxygen (Stage 2)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage2_oxygen?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage2_oxygen?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">CO2 (Stage 2)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage2_co2?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage2_co2?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mt-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">TSS (Stage 2)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage2_tss?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage2_tss?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mt-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">TAN (Stage 2)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage2_tan?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage2_tan?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                {/* Stage 3 */}
                <h5 className="mb-3">Stage 3</h5>
                <div className="row g-4">
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">Oxygen (Stage 3)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage3_oxygen?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage3_oxygen?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">CO2 (Stage 3)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage3_co2?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage3_co2?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mt-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">TSS (Stage 3)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage3_tss?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage3_tss?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6 mt-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-primary">TAN (Stage 3)</Card.Title>
                        <div className="mt-3">
                          <div>L/min: {s1.stage3_tan?.l_per_min ?? 0}</div>
                          <div>m³/hr: {s1.stage3_tan?.m3_per_hr ?? 0}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                {/* Limiting Factor */}
                <h5 className="mb-3 mt-4">Limiting Factor</h5>
                <div className="row g-4">
                  {(() => {
                    const lf = limitingFactor || {
                      stage1: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                      stage2: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                      stage3: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 }
                    };
                    const cardClass = (factor) => {
                      const f = (factor || '').toString().toLowerCase();
                      if (f.includes('oxygen')) return 'oxygen-card';
                      if (f.includes('co2')) return 'co2-card';
                      if (f.includes('tss')) return 'tss-card';
                      if (f.includes('tan')) return 'tan-card';
                      return 'oxygen-card';
                    };
                    return (
                      <>
                        <div className="col-md-4">
                          <Card className={`h-100 shadow-sm ${cardClass(lf.stage1?.factor)}`}>
                            <Card.Body>
                              <Card.Title className="text-primary">Stage 1</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage1?.factor ?? '-'}</strong></div>
                                <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage1?.flow_l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage1?.flow_m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-4">
                          <Card className={`h-100 shadow-sm ${cardClass(lf.stage2?.factor)}`}>
                            <Card.Body>
                              <Card.Title className="text-primary">Stage 2</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage2?.factor ?? '-'}</strong></div>
                                <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage2?.flow_l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage2?.flow_m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-4">
                          <Card className={`h-100 shadow-sm ${cardClass(lf.stage3?.factor)}`}>
                            <Card.Body>
                              <Card.Title className="text-primary">Stage 3</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage3?.factor ?? '-'}</strong></div>
                                <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage3?.flow_l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage3?.flow_m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Navigation buttons for advanced report */}
              <div className="navigation-buttons mt-3">
                <div></div>
                <div className="button-group-right">
                  <Button
                    variant="outline-primary"
                    onClick={() => setStep(4)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Save & Return to Dashboard
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    style={{ 
                      width: '100px', 
                      borderRadius: '8px', 
                      height: '30px',
                      padding: '0',
                      lineHeight: '30px',
                      textAlign: 'center'
                    }}
                    onClick={() => {
                      try {
                        const doc = generateAdvancedReportPdf(formData, advancedReport, limitingFactor);
                        const fileName = `Advanced_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                        alert('Error generating PDF. Please try again.');
                      }
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          );
        }

        // Use the calculation results from state (Basic/Free)
        const results = formData.calculationResults || {
          oxygen: {
            bestInletMgL: 8.5,
            minSatPct: 85,
            effluentMgL: 6.2,
            consMgPerDay: 1200000,
            consKgPerDay: 1.2
          },
          tss: {
            effluentMgL: 25.0,
            prodMgPerDay: 1800000,
            prodKgPerDay: 1.8
          },
          co2: {
            effluentMgL: 15.5,
            prodMgPerDay: 2500000,
            prodKgPerDay: 2.5
          },
          tan: {
            effluentMgL: 1.0,
            prodMgPerDay: 800000,
            prodKgPerDay: 0.8
          }
        };

        return (
          <div className="step-section">
            <h4>Mass Balance Report</h4>
            <div className="report-cards">
              <div className="row g-4">
                <div className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-primary">Oxygen</Card.Title>
                      <hr />
                      <p>
                        <strong>O₂ Saturation Adjusted:</strong>
                        <span>{(results.oxygen.saturationAdjustedMgL ?? 0).toFixed(2)} mg/L</span>
                      </p>
                      <p>
                        <strong>Min DO (use):</strong>
                        <span>{results.oxygen.MINDO_use ?? '-'} mg/L</span>
                      </p>
                      <p>
                        <strong>Oxygen Effluent Concentration:</strong>
                        <span>{results.oxygen.effluentConc.toFixed(2)} mg/L</span>
                      </p>
                      <p>
                        <strong>Oxygen Consumption (mg/day):</strong>
                        <span>{results.oxygen.prodMgPerDay.toLocaleString()} mg/day</span>
                      </p>
                      <p>
                        <strong>Oxygen Consumption (kg/day):</strong>
                        <span>{results.oxygen.prodKgPerDay.toFixed(2)} kg/day</span>
                      </p>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-success">Total Suspended Solids (TSS)</Card.Title>
                      <hr />
                      <p>
                        <strong>TSS Effluent Concentration:</strong>
                        <span>{results.tss.effluentConc.toFixed(2)} mg/L</span>
                      </p>
                      <p>
                        <strong>Max TSS (use):</strong>
                        <span>{results.tss.MAXTSS_use ?? '-'} mg/L</span>
                      </p>
                      <p>
                        <strong>TSS Production (mg/day):</strong>
                        <span>{results.tss.prodMgPerDay.toLocaleString()} mg/day</span>
                      </p>
                      <p>
                        <strong>TSS Production (kg/day):</strong>
                        <span>{results.tss.prodKgPerDay.toFixed(2)} kg/day</span>
                      </p>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-warning">Carbon Dioxide (CO₂)</Card.Title>
                      <hr />
                      <p>
                        <strong>CO₂ Effluent Concentration:</strong>
                        <span>{results.co2.effluentConc.toFixed(2)} mg/L</span>
                      </p>
                      <p>
                        <strong>Max CO₂ (use):</strong>
                        <span>{results.co2.MAXCO2_use ?? '-'} mg/L</span>
                      </p>
                      <p>
                        <strong>CO₂ Production (mg/day):</strong>
                        <span>{results.co2.prodMgPerDay.toLocaleString()} mg/day</span>
                      </p>
                      <p>
                        <strong>CO₂ Production (kg/day):</strong>
                        <span>{results.co2.prodKgPerDay.toFixed(2)} kg/day</span>
                      </p>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-info">Total Ammonia Nitrogen (TAN)</Card.Title>
                      <hr />
                      <p>
                        <strong>TAN Effluent Concentration:</strong>
                        <span>{results.tan.effluentConc.toFixed(2)} mg/L</span>
                      </p>
                      <p>
                        <strong>Max TAN (use):</strong>
                        <span>{results.tan.MAXTAN_use ?? '-'} mg/L</span>
                      </p>
                      <p>
                        <strong>TAN Production (mg/day):</strong>
                        <span>{results.tan.prodMgPerDay.toLocaleString()} mg/day</span>
                      </p>
                      <p>
                        <strong>TAN Production (kg/day):</strong>
                        <span>{results.tan.prodKgPerDay.toFixed(2)} kg/day</span>
                      </p>
                    </Card.Body>
                  </Card>
                </div>
              </div>
              {formData.basicStep6Results && formData.basicStep6Results.step_6 && (
                <div className="mt-3">
                  <h5 className="mb-3">Stage 6: Juvenile (Stage 1)</h5>
                  {(() => {
                    const s1 = formData.basicStep6Results.step_6 || {};
                    return (
                      <div className="row g-4">
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <Card.Title className="text-primary">Oxygen</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">L/min</span><strong>{s1.oxygen?.l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.oxygen?.m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <Card.Title className="text-primary">CO2</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">L/min</span><strong>{s1.co2?.l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.co2?.m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <Card.Title className="text-primary">TSS</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">L/min</span><strong>{s1.tss?.l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.tss?.m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <Card.Title className="text-primary">TAN</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row"><span className="label">L/min</span><strong>{s1.tan?.l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.tan?.m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {formData.basicLimitingFactor && (
                <div className="mt-3">
                  <h6 className="text-primary mb-2">Limiting Factor (Stage 1)</h6>
                  {(() => {
                    const lf = formData.basicLimitingFactor || {};
                    return (
                      <div className="row g-3">
                        <div className="col-md-6 col-lg-4">
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <Card.Title className="text-primary">Stage 1</Card.Title>
                              <div className="mt-2">
                                <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage1?.factor ?? '-'}</strong></div>
                                <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage1?.flow_l_per_min ?? 0}</strong></div>
                                <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage1?.flow_m3_per_hr ?? 0}</strong></div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="navigation-buttons">
              <Button 
                variant="outline-secondary" 
                size="sm"
                style={{ 
                  width: '100px', 
                  borderRadius: '8px', 
                  height: '30px',
                  padding: '0',
                  lineHeight: '30px',
                  textAlign: 'center'
                }}
                onClick={prevStep}
              >
                Back
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm"
                style={{ 
                  width: '250px', 
                  borderRadius: '8px', 
                  height: '30px',
                  padding: '0',
                  lineHeight: '30px',
                  textAlign: 'center',
                  marginLeft: 'auto',
                  marginRight: '10px'
                }}
                onClick={() => navigate('/dashboard')}
              >
                Save & Return to Dashboard
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                style={{ 
                  width: '100px', 
                  borderRadius: '8px', 
                  height: '30px',
                  padding: '0',
                  lineHeight: '30px',
                  textAlign: 'center'
                }}
                onClick={() => {
                  const doc = generateMassBalanceReport(formData, results);
                  doc.save(`mass-balance-report-${new Date().getTime()}.pdf`);
                }}
              >
                Download
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render Advanced 2-column layout
  const renderAdvancedLayout = () => {
    return (
      <div className="advanced-layout">
        {!showAdvancedFields ? (
          /* Initial step - show first */
          <div className="initial-section mb-4">
            <div className="text-center mb-4">
              <h3>Advanced Design System Setup</h3>
              <p className="text-muted">Configure your advanced aquaculture system parameters</p>
            </div>
            <div className="card">
              <div className="card-body">
                <h4>Initial Setup</h4>
                <div className="form-group">
                  {renderInputWithTooltip('designSystemName', 'Design System Name', '', 'text')}
                  {renderInputWithTooltip('projectName', 'Project Name', '', 'text')}
                  <Form.Group className="mb-3">
                    <Form.Label>System Purpose</Form.Label>
                    <Form.Select name="systemPurpose" value={formData.systemPurpose} onChange={handleInputChange} disabled={loading}>
                      <option value="Commercial aquaculture production (monoculture)">Commercial aquaculture production (monoculture)</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>System Type</Form.Label>
                    <Form.Select name="systemType" value={formData.systemType} onChange={handleInputChange} disabled={loading}>
                      <option value="RAS">RAS</option>
                      <option value="Flow-through" disabled>Flow-through (Coming Soon)</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Target Species</Form.Label>
                    <Form.Select
                      name="targetSpecies"
                      value={formData.targetSpecies}
                      onChange={handleInputChange}
                      disabled={loading || loadingSpecies}
                    >
                      <option value="">
                        {loadingSpecies ? 'Loading species...' : 'Select a species'}
                      </option>
                      {!loadingSpecies && speciesList.length === 0 && (
                        <option value="" disabled>No species available</option>
                      )}
                      {!loadingSpecies && speciesList.map((species, index) => (
                        <option key={`${species}-${index}`} value={species}>{species}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="useRecommendedValues"
                      label="Use Recommended Values"
                      name="useRecommendedValues"
                      checked={formData.useRecommendedValues}
                      onChange={handleInputChange}
                      disabled={loading || !formData.targetSpecies}
                    />
                  </Form.Group>
                </div>
                
                {/* Error Display */}
                {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {error}
                  </div>
                )}
                
                <div className="navigation-buttons">
                  <div className="button-group-left">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      style={{ width: '100px' }}
                      onClick={() => {
                        setShowAdvancedLayout(false);
                        setShowCalculationTypeSelection(true);
                        setDesignCreated(false);
                        // Clear form data to prevent duplicate creation
                        setFormData({
                          designSystemName: '',
                          projectName: '',
                          systemPurpose: 'Commercial aquaculture production (monoculture)',
                          systemType: 'RAS',
                          targetSpecies: '',
                          useRecommendedValues: false,
                          productionPhase: '',
                          waterTemp: '',
                          ph: '',
                          salinity: '',
                          siteElevation: '',
                          minDO: '',
                          maxCO2: '',
                          minTSS: '',
                          maxTAN: '',
                          targetMinO2Saturation: '',
                          alkalinity: '',
                          supplementPureO2: false,
                          initialWeightWiG: '',
                          targetFishWeight: '',
                          productionTarget_t: '',
                          harvestFrequency: 'Fortnightly',
                          FCR_Stage1: '',
                          FeedProtein_Stage1: '',
                          FCR_Stage2: '',
                          FeedProtein_Stage2: '',
                          FCR_Stage3: '',
                          FeedProtein_Stage3: '',
                          Estimated_mortality_Stage1: '',
                          Estimated_mortality_Stage2: '',
                          Estimated_mortality_Stage3: '',
                          tankVolume: '',
                          numTanks: '',
                          targetNumFish: '',
                          feedRate: '',
                          feedProtein: '',
                          o2Absorption: '',
                          tssRemoval: '',
                          co2Removal: '',
                          tanRemoval: ''
                        });
                        setError('');
                      }}
                      disabled={loading}
                    >
                      Back
                    </Button>
                  </div>
                  <div className="button-group-right">
                    <Button
                      variant="primary"
                      onClick={async () => {
                        // Check if design already created
                        if (designCreated) {
                          setShowAdvancedFields(true);
                          return;
                        }

                        try {
                          setLoading(true);
                          setError('');
                          
                          // Validate required fields for advanced flow
                          if (!formData.targetSpecies || formData.targetSpecies.trim() === '') {
                            setError('Please select a target species before proceeding.');
                            setLoading(false);
                            return;
                          }
                          
                          const apiData = {
                            designSystemName: formData.designSystemName,
                            projectName: formData.projectName,
                            systemPurpose: formData.systemPurpose,
                            systemType: formData.systemType,
                            targetSpecies: formData.targetSpecies,
                            useRecommendedValues: formData.useRecommendedValues
                          };

                          console.log('Creating design system for Advanced flow:', apiData);
                          console.log('Current designIds state:', designIds);
                          console.log('isUpdateFlow:', isUpdateFlow);
                          
                          // Check if we have existing IDs (back button scenario) or if this is a true update flow
                          const hasProjectId = designIds.projectId;
                          const hasDesignId = designIds.designId;
                          
                          // For back button scenario: use existing IDs if we have projectId (designId might be null initially)
                          // For update flow: use existing IDs if we have both projectId and designId
                          const shouldUseProjectId = hasProjectId && (isUpdateFlow ? hasDesignId : true);
                          const shouldUseDesignId = hasDesignId && (isUpdateFlow ? hasProjectId : true);
                          
                          console.log('Advanced flow API call debug:', {
                            isUpdateFlow,
                            hasProjectId,
                            hasDesignId,
                            shouldUseProjectId,
                            shouldUseDesignId,
                            designIds,
                            sendingDesignId: shouldUseDesignId ? designIds.designId : null,
                            sendingProjectId: shouldUseProjectId ? designIds.projectId : null
                          });
                          
                          const apiPayload = {
                            ...apiData,
                            isUpdateFlow: shouldUseProjectId, // Use projectId as the main indicator for updates
                            designId: shouldUseDesignId ? designIds.designId : null,
                            projectId: shouldUseProjectId ? designIds.projectId : null
                          };
                          
                          console.log('Advanced flow API payload being sent:', apiPayload);
                          
                          const response = await createDesignSystem(apiPayload);
                          console.log('Design system created:', response);
                          
                          if (response && response.project_id) {
                            setDesignIds(prev => ({ ...prev, projectId: response.project_id }));
                            console.log('Project ID stored:', response.project_id);
                            
                            // Also store design_id if available
                            if (response.design_id) {
                              setDesignIds(prev => ({ ...prev, designId: response.design_id }));
                              console.log('Design ID stored:', response.design_id);
                            }
                            
                            setDesignCreated(true);
                            setShowAdvancedFields(true); // Show 2-column layout
                            
                            // Note: Water quality POST API will only be called during final calculation (Calculate Advanced Report)
                          }
                          
                        } catch (error) {
                          console.error('Error creating design system:', error);
                          const message = error?.message || 'Failed to create design system';
                          await Swal.fire({
                            icon: 'error',
                            title: 'Could not create',
                            text: message,
                            confirmButtonColor: '#dc3545'
                          });
                          setError('Failed to create design system: ' + message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Creating Design...' : designCreated ? 'Continue' : 'Create & Continue'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Advanced Parameters Configuration */
          <>
            <div className="text-center mb-5">
              <div className="advanced-config-header">
                <div className="config-icon mb-3">
                  <i className="bi bi-gear-wide-connected text-primary"></i>
                </div>
                <h2 className="mb-3">Advanced Parameters Configuration</h2>
                <p className="text-muted lead">Configure comprehensive parameters for your advanced aquaculture system</p>
              </div>
            </div>

            {/* Clean Single-Page Layout */}
            <div className="advanced-config-container">
              <div className="config-content">

                {/* Stage 6: System Efficiency Section with Dynamic Outputs */}
                <div className="combined-inputs-page">
                  <Row className="g-4 align-items-start">
                    {/* Left Column - Stage 6 Inputs (equal width) */}
                    <Col lg={6}>
                      <div className="inputs-column">
                        <style>{`
                          /* Mirror basic dynamic inputs: single vertical column */
                          .stage6-onecol .row > [class^="col-"],
                          .stage6-onecol .row > [class*=" col-"] {
                            max-width: 100% !important;
                            flex: 0 0 100% !important;
                          }
                        `}</style>
                        {/* Water Quality Parameters */}
                        <div className="config-section mb-4">
                          <div className="section-header">
                            <h5><i className="bi bi-droplet text-primary me-2"></i>Water Quality Parameters</h5>
                            <p className="text-muted small">Essential water quality settings for optimal fish health</p>
                          </div>
                          
                          <div className="row g-3">
                            <div className="col-12">
                              {renderInputWithTooltip('waterTemp', 'Water Temperature', '°C')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('salinity', 'Salinity', '%')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('siteElevation', 'Site Elevation', 'm')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('minDO', 'Minimum Dissolved Oxygen (O₂)', 'mg/l')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('targetMinO2Saturation', 'Target Minimum O₂ Saturation', '%')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('ph', 'pH Level')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('alkalinity', 'Alkalinity', 'mg/L')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('minTSS', 'Maximum Total Suspended Solids (TSS)', 'mg/l')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('maxCO2', 'Maximum Dissolved Carbon Dioxide (CO₂)', 'mg/l')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('maxTAN', 'Maximum Total Ammonia (TAN)', 'mg/L')}
                            </div>
                            <div className="col-12">
                              <div className="checkbox-container">
                                <Form.Check
                                  type="checkbox"
                                  name="supplementPureO2"
                                  label="Supplement Pure O₂"
                                  checked={formData.supplementPureO2}
                                  onChange={handleInputChange}
                                  disabled={loading}
                                  className="custom-checkbox"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* System Efficiency Parameters */}
                        <div className="config-section mb-4">
                          <div className="section-header">
                            <h5><i className="bi bi-speedometer2 text-primary me-2"></i>System Efficiency Parameters</h5>
                            <p className="text-muted small">Configure system efficiency and removal rates</p>
                          </div>
                          
                          <div className="row g-3">
                            <div className="col-12">
                              {renderInputWithTooltip('o2Absorption', 'O₂ Absorption Efficiency', '%')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('co2Removal', 'CO₂ Removal Efficiency', '%')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('tssRemoval', 'TSS Removal Efficiency', '%')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('tanRemoval', 'TAN Removal Efficiency', '%')}
                            </div>
                          </div>
                        </div>

                        {/* Production Parameters */}
                        <div className="config-section mb-4">
                          <div className="section-header">
                            <h5><i className="bi bi-fish text-primary me-2"></i>Production Parameters</h5>
                            <p className="text-muted small">Define production targets and fish growth parameters</p>
                          </div>
                          
                          <div className="row g-3">
                            <div className="col-12">
                              {renderInputWithTooltip('productionTarget_t', 'Target production per year', 't', 'number')}
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('targetFishWeight', 'Target fish weight at harvest', 'g', 'number')}
                            </div>
                            <div className="col-12">
                              <Form.Group className="mb-3">
                                <Form.Label>Harvest frequency</Form.Label>
                                <Form.Select
                                  name="harvestFrequency"
                                  value={formData.harvestFrequency}
                                  onChange={handleInputChange}
                                  disabled={loading}
                                >
                                  <option value="">Select Frequency</option>
                                  <option value="Monthly">Monthly</option>
                                  <option value="Fortnightly">Fortnightly</option>
                                  <option value="Weekly">Weekly</option>
                                </Form.Select>
                              </Form.Group>
                            </div>
                            <div className="col-12">
                              {renderInputWithTooltip('initialWeightWiG', 'Initial weight', 'g', 'number')}
                            </div>
                            
                            {/* Mass Balance Production Parameters */}
                            <div className="col-12">
                              <h6 className="section-subtitle">
                                <i className="bi bi-calculator text-warning me-2"></i>
                                Mass Balance Production Parameters
                              </h6>
                              <div className="row g-3">
                                <div className="col-12">
                                  {renderInputWithTooltip('tankVolume', 'Tank Volume', 'm³', 'number')}
                                </div>
                                <div className="col-12">
                                  {renderInputWithTooltip('numTanks', 'Total Number of Tanks', '', 'number')}
                                </div>
                                <div className="col-12">
                                  {renderInputWithTooltip('targetNumFish', 'Target Max Stocking Density', 'kg/m³', 'number')}
                                </div>
                                <div className="col-12">
                                  {renderInputWithTooltip('feedRate', 'Feed rate', '% of biomass/day', 'number')}
                                </div>
                                <div className="col-12">
                                  {renderInputWithTooltip('feedConversionRatio', 'Feed Conversion Ratio (FCR)', '', 'number')}
                                </div>
                                <div className="col-12">
                                  {renderInputWithTooltip('feedProtein', 'Feed protein content', '%', 'number')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stage-wise Parameters */}
                        <div className="config-section mb-4">
                          <div className="section-header">
                            <h5><i className="bi bi-layers text-info me-2"></i>Stage-wise Feed Conversion & Mortality</h5>
                            <p className="text-muted small">Configure feed conversion ratios and mortality rates for each stage</p>
                          </div>
                          
                          <div className="row g-3">
                            <div className="col-12">
                              <div className="stage-card">
                                <h6 className="stage-title">Stage 1 (Juvenile)</h6>
                                <div className="stage-params">
                                  {renderInputWithTooltip('FCR_Stage1', 'FCR', '', 'number')}
                                  {renderInputWithTooltip('FeedProtein_Stage1', 'Feed protein', '%', 'number')}
                                  {renderInputWithTooltip('Estimated_mortality_Stage1', 'Mortality', '%', 'number')}
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="stage-card">
                                <h6 className="stage-title">Stage 2 (Fingerling)</h6>
                                <div className="stage-params">
                                  {renderInputWithTooltip('FCR_Stage2', 'FCR', '', 'number')}
                                  {renderInputWithTooltip('FeedProtein_Stage2', 'Feed protein', '%', 'number')}
                                  {renderInputWithTooltip('Estimated_mortality_Stage2', 'Mortality', '%', 'number')}
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="stage-card">
                                <h6 className="stage-title">Stage 3 (Growout)</h6>
                                <div className="stage-params">
                                  {renderInputWithTooltip('FCR_Stage3', 'FCR', '', 'number')}
                                  {renderInputWithTooltip('FeedProtein_Stage3', 'Feed protein', '%', 'number')}
                                  {renderInputWithTooltip('Estimated_mortality_Stage3', 'Mortality', '%', 'number')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                    
                    {/* Right Column - Dynamic Outputs (equal width) */}
                    <Col lg={6}>
                      <div className="outputs-column stage7-dynamic-panel">
                        <Stage6DynamicOutputsPanel
                          formData={formData}
                          liveOutputs={dynamicStage6}
                          onFieldUpdate={() => {}}
                          massBalanceData={dynamicStage6.massBalance?.data || advancedReport?.massBalanceData}
                          limitingFactor={dynamicStage6.limitingFactor?.data || limitingFactor}
                          stage8Report={dynamicStage6.stage8?.data || stage8Report}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
                  </div>

                {/* Additional Calculation Stages Selection */}
                <div className="config-section mb-5">
                  <div className="section-header">
                    <h4><i className="bi bi-calculator text-primary me-2"></i>Additional Calculation Stages</h4>
                    <p className="text-muted">Select additional calculation stages for comprehensive system analysis</p>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="stage-option-card">
                        <Form.Check
                          type="checkbox"
                          id="stage7-checkbox"
                          label="Calculate Bio Filter & Sump Size (Stage 7)"
                          checked={stage7Selected}
                          onChange={(e) => setStage7Selected(e.target.checked)}
                          className="stage-checkbox"
                        />
                        <p className="text-muted small mt-2">
                          Calculate optimal bio filter and sump sizing for your system
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Stage 8 Input Fields - Basic Pump Size */}
                {stage8Selected && (
                  <div className="config-section mb-5">
                    <div className="section-header">
                      <h4><i className="bi bi-gear text-primary me-2"></i>Stage 8: Basic Pump Size Parameters</h4>
                      <p className="text-muted">Configure parameters for basic pump sizing calculations</p>
                    </div>
                    
                    <div className="row g-3">
                      <div className="col-md-6 col-lg-4">
                        <Form.Group>
                          <Form.Label>Pump Flow Rate (L/min)</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Enter pump flow rate"
                            disabled
                            className="placeholder-input"
                          />
                          <Form.Text className="text-muted">
                            Placeholder - Parameters not ready
                          </Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <Form.Group>
                          <Form.Label>Pump Head (m)</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Enter pump head"
                            disabled
                            className="placeholder-input"
                          />
                          <Form.Text className="text-muted">
                            Placeholder - Parameters not ready
                          </Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <Form.Group>
                          <Form.Label>Pump Type</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter pump type"
                            disabled
                            className="placeholder-input"
                          />
                          <Form.Text className="text-muted">
                            Placeholder - Parameters not ready
                          </Form.Text>
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                )}

            {/* Single Calculate Button */}
            <div className="calculate-section">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="navigation-buttons">
                <div className="button-group-left">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    style={{ width: '100px' }}
                    onClick={() => {
                      setShowAdvancedFields(false);
                      setDesignCreated(false);
                    }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
                <div className="button-group-right">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      console.log('🚀 Advanced Calculate button clicked!');
                      try {
                        setLoading(true);
                        setError('');
                        
                        console.log('🔍 Checking for project ID...');
                        const currentProjectId = localStorage.getItem('currentProjectId');
                        console.log('🔍 Project ID found:', currentProjectId);
                        
                        if (!currentProjectId) {
                          throw new Error('Project ID not found. Please complete Initial Setup first.');
                        }

                        // Check if Stage 7 is selected first
                        if (stage7Selected) {
                          // Store Step 6 values temporarily and navigate to Stage 7 inputs page
                          // Don't call APIs yet - will be called from Stage 7 page
                          console.log('📦 Stage 7 selected - storing Step 6 values temporarily and navigating to Stage 7 page');
                          setTempStep6Values({
                            waterQuality: {
                              ph: formData.ph,
                              waterTemp: formData.waterTemp,
                              minDO: formData.minDO,
                              targetMinO2Saturation: formData.targetMinO2Saturation,
                              maxTAN: formData.maxTAN,
                              maxCO2: formData.maxCO2,
                              minTSS: formData.minTSS,
                              salinity: formData.salinity,
                              alkalinity: formData.alkalinity,
                              supplementPureO2: formData.supplementPureO2,
                              useRecommendedValues: formData.useRecommendedValues,
                              siteElevation: formData.siteElevation
                            },
                            production: {
                              targetSpecies: formData.targetSpecies,
                              initialWeight: formData.initialWeightWiG,
                              targetFishWeight: formData.targetFishWeight,
                              targetNumFish: formData.targetNumFish,
                              productionTarget_t: formData.productionTarget_t,
                              harvestFrequency: formData.harvestFrequency,
                              tankVolume: formData.tankVolume,
                              numTanks: formData.numTanks,
                              feedRate: formData.feedRate,
                              feedConversionRatio: formData.feedConversionRatio,
                              feedProtein: formData.feedProtein
                            },
                            stageWise: {
                              FCR_Stage1: formData.FCR_Stage1,
                              FeedProtein_Stage1: formData.FeedProtein_Stage1,
                              FCR_Stage2: formData.FCR_Stage2,
                              FeedProtein_Stage2: formData.FeedProtein_Stage2,
                              FCR_Stage3: formData.FCR_Stage3,
                              FeedProtein_Stage3: formData.FeedProtein_Stage3,
                              Estimated_mortality_Stage1: formData.Estimated_mortality_Stage1,
                              Estimated_mortality_Stage2: formData.Estimated_mortality_Stage2,
                              Estimated_mortality_Stage3: formData.Estimated_mortality_Stage3
                            },
                            systemEfficiency: {
                              o2Absorption: formData.o2Absorption,
                              tssRemoval: formData.tssRemoval,
                              co2Removal: formData.co2Removal,
                              tanRemoval: formData.tanRemoval
                            }
                          });
                          setShowStage7Inputs(true);
                        } else {
                          // Stage 7 NOT selected - call Step 6 APIs directly and go to reports
                          console.log('📊 Stage 7 NOT selected - calling Step 6 APIs directly');
                          
                          const advancedPayload = {
                            // Water quality parameters
                            ph: formData.ph ? parseFloat(formData.ph) : 7,
                            temperature: formData.waterTemp ? parseFloat(formData.waterTemp) : 27,
                            dissolved_O2_min: formData.minDO ? parseFloat(formData.minDO) : 3.0,
                            target_min_o2_saturation: formData.targetMinO2Saturation ? parseFloat(formData.targetMinO2Saturation) : 95,
                            TAN_max: formData.maxTAN ? parseFloat(formData.maxTAN) : 2,
                            dissolved_CO2_max: formData.maxCO2 ? parseFloat(formData.maxCO2) : 15,
                            TSS_max: formData.minTSS ? parseFloat(formData.minTSS) : 80,
                            salinity: formData.salinity ? parseFloat(formData.salinity) : 0,
                            alkalinity: formData.alkalinity ? parseFloat(formData.alkalinity) : 250,
                            supplement_pure_o2: formData.supplementPureO2 || false,
                            elevation_m: formData.siteElevation ? parseFloat(formData.siteElevation) : 500,

                            // System efficiency parameters
                            oxygen_injection_efficiency: formData.o2Absorption ? parseFloat(formData.o2Absorption) : 90,
                            tss_removal_efficiency: formData.tssRemoval ? parseFloat(formData.tssRemoval) : 80,
                            co2_removal_efficiency: formData.co2Removal ? parseFloat(formData.co2Removal) : 70,
                            tan_removal_efficiency: formData.tanRemoval ? parseFloat(formData.tanRemoval) : 80,

                            // Species and production parameters
                            species: formData.targetSpecies || "Nile tilapia",
                            // These three fields must ALWAYS be included in the request - null if empty
                            initial_weight_wi_g: (formData.initialWeightWiG && formData.initialWeightWiG.toString().trim() !== '') ? parseFloat(formData.initialWeightWiG) : null,
                            juvenile_size: (formData.juvenileSize && formData.juvenileSize.toString().trim() !== '') ? parseFloat(formData.juvenileSize) : null,
                            target_market_fish_size: (formData.targetFishWeight && formData.targetFishWeight.toString().trim() !== '') ? parseFloat(formData.targetFishWeight) : null,

                            production_target_t: formData.productionTarget_t ? parseFloat(formData.productionTarget_t) : 100,
                            harvest_frequency: formData.harvestFrequency || "Fortnightly",

                            // Feed parameters
                            fcr_stage1: formData.FCR_Stage1 ? parseFloat(formData.FCR_Stage1) : 1.1,
                            feed_protein_stage1: formData.FeedProtein_Stage1 ? parseFloat(formData.FeedProtein_Stage1) : 45,
                            fcr_stage2: formData.FCR_Stage2 ? parseFloat(formData.FCR_Stage2) : 1.2,
                            feed_protein_stage2: formData.FeedProtein_Stage2 ? parseFloat(formData.FeedProtein_Stage2) : 45,
                            fcr_stage3: formData.FCR_Stage3 ? parseFloat(formData.FCR_Stage3) : 1.3,
                            feed_protein_stage3: formData.FeedProtein_Stage3 ? parseFloat(formData.FeedProtein_Stage3) : 45,

                            // Mortality parameters
                            estimated_mortality_stage1: formData.Estimated_mortality_Stage1 ? parseFloat(formData.Estimated_mortality_Stage1) : 0,
                            estimated_mortality_stage2: formData.Estimated_mortality_Stage2 ? parseFloat(formData.Estimated_mortality_Stage2) : 0,
                            estimated_mortality_stage3: formData.Estimated_mortality_Stage3 ? parseFloat(formData.Estimated_mortality_Stage3) : 0
                          };

                          // Debug: Verify the three null parameters are always included
                          console.log('🔍 Null Parameters Check:');
                          console.log('  formData.initialWeightWiG:', formData.initialWeightWiG);
                          console.log('  formData.initialWeightWiG type:', typeof formData.initialWeightWiG);
                          console.log('  formData.initialWeightWiG trim:', formData.initialWeightWiG ? formData.initialWeightWiG.toString().trim() : 'undefined');
                          console.log('  formData keys containing weight:', Object.keys(formData).filter(key => key.toLowerCase().includes('weight')));
                          console.log('  formData keys containing initial:', Object.keys(formData).filter(key => key.toLowerCase().includes('initial')));
                          console.log('  initial_weight_wi_g:', advancedPayload.initial_weight_wi_g);
                          console.log('  target_market_fish_size:', advancedPayload.target_market_fish_size);
                          console.log('📤 Advanced Calculate Payload:', advancedPayload);
                          console.log('🌐 Calling postAdvancedParameters API...');
                          const response = await postAdvancedParameters(currentProjectId, { ...advancedPayload, type: 'advanced' });
                          console.log('✅ Advanced Calculate Response:', response);

                          // Fetch report results or fallback to zeros
                          let reportData = null;
                          try {
                            console.log('📊 Fetching Advanced Step 6 Results...');
                            reportData = await getAdvancedStep6Results(currentProjectId);
                            console.log('✅ Advanced Step 6 Results:', reportData);
                          } catch (fetchErr) {
                            console.warn('Advanced report API not ready; using zero report');
                            reportData = buildZeroAdvancedReport(currentProjectId);
                          }

                          // Fetch Limiting Factor (with safe fallback)
                          let lf = null;
                          try {
                            console.log('📊 Fetching Advanced Limiting Factor...');
                            lf = await getAdvancedLimitingFactor(currentProjectId);
                            console.log('✅ Advanced Limiting Factor:', lf);
                          } catch (e) {
                            console.warn('Limiting Factor API not available; using zero values');
                            lf = {
                              project_id: Number(currentProjectId) || 0,
                              stage1: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                              stage2: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                              stage3: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                              status: 'success'
                            };
                          }

                          // Fetch Mass Balance Data (non-blocking)
                          let massBalanceData = null;
                          try {
                            console.log('📊 Fetching Mass Balance Data...');
                            
                            // Prepare water quality parameters for mass balance
                            console.log('[CalculateAdvancedReport] formData.ph value:', formData.ph);
                            const waterQualityData = {
                              waterTemp: formData.waterTemp || 27,
                              salinity: formData.salinity || 0,
                              siteElevation: formData.siteElevation || 0,
                              minDO: formData.minDO || 6,
                              ph: formData.ph || 7,
                              maxCO2: formData.maxCO2 || 10,
                              maxTAN: formData.maxTAN || 1,
                              minTSS: formData.minTSS || 20,
                              targetSpecies: formData.targetSpecies || 'Nile tilapia',
                              useRecommendedValues: formData.useRecommendedValues || false,
                              type: 'advanced',
                              // Production parameters for mass balance
                              tankVolume: formData.tankVolume || 0,
                              numTanks: formData.numTanks || 0,
                              targetFishWeight: formData.targetFishWeight || 0,
                              targetNumFish: formData.targetNumFish || 0,
                              feedRate: formData.feedRate || 0,
                              feedConversionRatio: formData.feedConversionRatio || 0,
                              feedProtein: formData.feedProtein || 0,
                              // Include efficiency parameters
                              o2Absorption: formData.o2Absorption || 0,
                              co2Removal: formData.co2Removal || 0,
                              tanRemoval: formData.tanRemoval || 0,
                              tssRemoval: formData.tssRemoval || 0
                            };
                            
                            console.log('[CalculateAdvancedReport] Water quality payload:', waterQualityData);
                            // Call Water Quality API (same as basic calculation)
                            await createWaterQualityParameters(waterQualityData);
                            
                          // Call Production API (same as basic calculation)
                          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                          const productionResponse = await fetch(`/backend/formulas/api/projects/${currentProjectId}/production-calculations`, {
                              method: 'GET',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                              }
                            });
                            
                            if (productionResponse.ok) {
                            const raw = await productionResponse.json();
                            // Normalize to UI-expected shape
                            massBalanceData = {
                              oxygen: {
                                saturationAdjustedMgL: raw.o2_saturation_adjusted_mg_l ?? raw.o2_saturation_adjusted?.value ?? null,
                                MINDO_use: raw.min_do_use_mg_l ?? raw.min_do_mg_l ?? null,
                                effluentMgL: raw.oxygen_effluent_concentration_mg_l ?? raw.oxygen_effluent_concentration?.value ?? null,
                                consMgPerDay: raw.oxygen_consumption_production_mg_per_day ?? raw.oxygen_consumption_production?.value ?? null,
                                consKgPerDay: (raw.oxygen_consumption_production_mg_per_day ?? raw.oxygen_consumption_production?.value ?? 0) / 1_000_000
                              },
                              tss: {
                                effluentMgL: raw.tss_effluent_concentration_mg_l ?? raw.tss_effluent_concentration?.value ?? null,
                                prodMgPerDay: raw.tss_production_mg ?? raw.tss_production?.value ?? null,
                                prodKgPerDay: (raw.tss_production_mg ?? raw.tss_production?.value ?? 0) / 1_000_000,
                                MAXTSS_use: raw.max_tss_use_mg_l ?? null
                              },
                              co2: {
                                effluentMgL: raw.co2_effluent_concentration_mg_l ?? raw.co2_effluent_concentration?.value ?? null,
                                prodMgPerDay: raw.co2_production_mg_per_day ?? raw.co2_production?.value ?? null,
                                prodKgPerDay: (raw.co2_production_mg_per_day ?? raw.co2_production?.value ?? 0) / 1_000_000,
                                MAXCO2_use: raw.max_co2_use_mg_l ?? null
                              },
                              tan: {
                                effluentMgL: raw.tan_effluent_concentration_mg_l ?? raw.tan_effluent_concentration?.value ?? null,
                                prodMgPerDay: raw.tan_production_mg_per_day ?? raw.tan_production?.value ?? null,
                                prodKgPerDay: (raw.tan_production_mg_per_day ?? raw.tan_production?.value ?? 0) / 1_000_000,
                                MAXTAN_use: raw.max_tan_use_mg_l ?? null
                              }
                            };
                            console.log('✅ Mass Balance Data (normalized):', massBalanceData);
                            } else {
                              throw new Error(`Production API failed: ${productionResponse.status}`);
                            }
                          } catch (massBalanceError) {
                            console.warn('Mass balance APIs failed (non-blocking):', massBalanceError);
                            // Continue with advanced calculation - only Stage 6 results
                          }

                          // Go directly to reports (Stage 6 + Mass Balance)
                          setAdvancedReport({
                            step6Results: reportData,
                            massBalanceData: massBalanceData,
                            stage7Results: null,
                            stage8Results: null
                          });
                          setLimitingFactor(lf);
                          setIsAdvancedReportView(true);
                        }
                        
                      } catch (err) {
                        console.error('❌ Error in Advanced Calculation:', err);
                        console.error('❌ Error details:', err.message, err.stack);
                        setError(err.message);
                      } finally {
                        console.log('🏁 Advanced calculation process finished');
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Calculating...' : stage7Selected ? 'Continue' : 'Calculate Advanced Report'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render calculation type selection for all users
  const renderCalculationTypeSelection = () => {
    if (!showCalculationTypeSelection) return null;

    return (
      <div className="calculation-type-selection">
        <div className="text-center mb-5">
          <div className="selection-header">
          
            <h2 className="mb-3">Choose Your Calculation Type</h2>
            <p className="text-muted lead">Select the type of calculation that best fits your needs</p>
           
          </div>
        </div>
        
        <div className="row g-5 mb-4">
          {/* Basic Calculation Card */}
          <div className="col-md-6">
            <Card 
              className={`calculation-card h-100 ${calculationType === 'basic' ? 'selected' : ''}`}
              onClick={() => setCalculationType('basic')}
            >
              <Card.Body className="text-center">
                <div className="calculation-icon mb-3">
                  <i className="fas fa-calculator fa-3x text-primary"></i>
                </div>
                <Card.Title className="h4 mb-3">Basic Calculation</Card.Title>
                <Card.Text className="text-muted mb-4">
                  Standard calculations with essential parameters for basic aquaculture design. 
                  Perfect for getting started with fundamental system planning and basic 
                  mass balance calculations.
                </Card.Text>
                <div className="features-list mb-4">
                  <div className="feature-item">
                    <i className="fas fa-check text-success me-2"></i>
                    Essential water quality parameters
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-check text-success me-2"></i>
                    Basic mass balance calculations
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-check text-success me-2"></i>
                    Standard production planning
                  </div>
                </div>
                <button
                  type="button"
                  className="card-continue-btn"
                  onClick={(e) => { e.stopPropagation(); setCalculationType('basic'); setShowCalculationTypeSelection(false); }}
                  aria-label="Continue with Basic Calculation"
                >
                  <span className="label">Continue</span>
                  <span className="arrow">→</span>
                </button>
              </Card.Body>
            </Card>
          </div>

          {/* Advanced Calculation Card */}
          <div className="col-md-6">
            <Card 
              className={`calculation-card h-100 ${calculationType === 'advanced' ? 'selected' : ''} ${((planLoaded && userPlan === 'Free') || (!planLoaded && initialFree)) ? 'disabled-card' : ''}`}
              onClick={() => {
                if (!planLoaded) {
                  setCalculationType('advanced');
                  return;
                }
                if (userPlan !== 'Free') setCalculationType('advanced');
              }}
              style={{ 
                opacity: ((planLoaded && userPlan === 'Free') || (!planLoaded && initialFree)) ? 0.6 : 1,
                cursor: ((planLoaded && userPlan === 'Free') || (!planLoaded && initialFree)) ? 'not-allowed' : 'pointer'
              }}
            >
              <Card.Body className="text-center">
                <div className="calculation-icon mb-3">
                  <i className="fas fa-cogs fa-3x text-secondary"></i>
                </div>
                <Card.Title className="h4 mb-3">Advanced Calculation</Card.Title>
                <Card.Text className="text-muted mb-4">
                  Enhanced calculations with advanced parameters and sophisticated modeling. 
                  Includes advanced water quality analysis, detailed system optimization, 
                  and comprehensive reporting features.
                </Card.Text>
                <div className="features-list mb-4">
                  <div className="feature-item">
                    <i className="fas fa-check text-success me-2"></i>
                    Advanced water quality modeling
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-check text-success me-2"></i>
                    System optimisation algorithms
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-check text-success me-2"></i>
                    Comprehensive reporting
                  </div>
                </div>
                <button
                  type="button"
                  className="card-continue-btn"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!planLoaded) {
                      setCalculationType('advanced');
                      setShowCalculationTypeSelection(false);
                      setShowAdvancedLayout(true);
                      return;
                    }
                    if (userPlan !== 'Free') {
                      setCalculationType('advanced');
                      setShowCalculationTypeSelection(false);
                      setShowAdvancedLayout(true);
                    }
                  }}
                  disabled={(planLoaded && userPlan === 'Free') || (!planLoaded && initialFree)}
                >
                  <span className="label">Continue</span>
                  <span className="arrow">→</span>
                </button>
              </Card.Body>
            </Card>
          </div>
        </div>
        
        
      </div>
    );
  };

  return (
    <div className="create-ds-container">
      <Navbar />
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="container create-ds-content">
        {isAdvancedReportView ? (
          <div className="step-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Advanced Report</h4>
            </div>
            {/* Modern Tab Navigation - Always show for advanced reports */}
              <div className="modern-tab-container mb-4">
                <div className="tab-nav">
                  <div 
                    className={`tab-item ${activeReportTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveReportTab('all')}
                  >
                    <span className="tab-icon">📊</span>
                    <span className="tab-label">All Reports</span>
                  </div>
                <div 
                  className={`tab-item ${activeReportTab === 'massBalance' ? 'active' : ''}`}
                  onClick={() => setActiveReportTab('massBalance')}
                >
                  <span className="tab-icon">⚖️</span>
                  <span className="tab-label">Mass Balance & Controlling Flow Rate</span>
                  </div>
                  {stage7Report && (
                    <div 
                      className={`tab-item ${activeReportTab === 'stage7' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('stage7')}
                    >
                      <span className="tab-icon">🔧</span>
                      <span className="tab-label">Biofilter & Sump Sizing</span>
                    </div>
                  )}
                  {stage8Report && (
                    <div 
                      className={`tab-item ${activeReportTab === 'stage8' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('stage8')}
                    >
                      <span className="tab-icon">⚙️</span>
                      <span className="tab-label">Pump Sizing</span>
                    </div>
                  )}
                </div>
              </div>

            {/* Mass Balance Report - Render in Mass Balance tab or All (even if data pending) */}
            {(activeReportTab === 'all' || activeReportTab === 'massBalance') && (
            <div className="report-cards">
                <h4 className="mb-4 text-primary">Mass Balance & Controlling Flow Rate Report</h4>
                
                {/* Display Stage 6 Inputs */}
                {advancedInputs && (
                  <div className="mb-4">
                    <h5 className="mb-3 text-info">Mass Balance & Controlling Flow Rate Input Parameters</h5>
                    <InputsDisplay inputs={advancedInputs} />
                  </div>
                )}
                <div className="row g-4">
                  {(() => {
                    const massBalance = advancedReport?.massBalanceData || {};
                    return (
                      <>
                        {/* Oxygen */}
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm oxygen-card">
                            <Card.Body>
                              <Card.Title className="text-primary">Oxygen</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row">
                                  <span className="label">O₂ Saturation Adjusted</span>
                                  <strong>{massBalance.oxygen?.saturationAdjustedMgL ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Min DO (use)</span>
                                  <strong>{massBalance.oxygen?.MINDO_use ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Effluent Conc.</span>
                                  <strong>{massBalance.oxygen?.effluentMgL ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Consumption (mg/day)</span>
                                  <strong>{massBalance.oxygen?.consMgPerDay ?? '-'} mg/day</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Consumption (kg/day)</span>
                                  <strong>{massBalance.oxygen?.consKgPerDay ?? '-'} kg/day</strong>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>

                        {/* TSS */}
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm tss-card">
                            <Card.Body>
                              <Card.Title className="text-primary">Total Suspended Solids (TSS)</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row">
                                  <span className="label">Max TSS (use)</span>
                                  <strong>{massBalance.tss?.MAXTSS_use ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Effluent Conc.</span>
                                  <strong>{massBalance.tss?.effluentMgL ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Production (mg/day)</span>
                                  <strong>{massBalance.tss?.prodMgPerDay ?? '-'} mg/day</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Production (kg/day)</span>
                                  <strong>{massBalance.tss?.prodKgPerDay ?? '-'} kg/day</strong>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>

                        {/* CO2 */}
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm co2-card">
                            <Card.Body>
                              <Card.Title className="text-primary">Carbon Dioxide (CO₂)</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row">
                                  <span className="label">Max CO₂ (use)</span>
                                  <strong>{massBalance.co2?.MAXCO2_use ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Effluent Conc.</span>
                                  <strong>{massBalance.co2?.effluentMgL ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Production (mg/day)</span>
                                  <strong>{massBalance.co2?.prodMgPerDay ?? '-'} mg/day</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Production (kg/day)</span>
                                  <strong>{massBalance.co2?.prodKgPerDay ?? '-'} kg/day</strong>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>

                        {/* TAN */}
                        <div className="col-md-6">
                          <Card className="h-100 shadow-sm tan-card">
                            <Card.Body>
                              <Card.Title className="text-primary">Total Ammonia Nitrogen (TAN)</Card.Title>
                              <div className="mt-3">
                                <div className="metric-row">
                                  <span className="label">Max TAN (use)</span>
                                  <strong>{massBalance.tan?.MAXTAN_use ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Effluent Conc.</span>
                                  <strong>{massBalance.tan?.effluentMgL ?? '-'} mg/L</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Production (mg/day)</span>
                                  <strong>{massBalance.tan?.prodMgPerDay ?? '-'} mg/day</strong>
                                </div>
                                <div className="metric-row">
                                  <span className="label">Production (kg/day)</span>
                                  <strong>{massBalance.tan?.prodKgPerDay ?? '-'} kg/day</strong>
                                </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
                </div>
                
                {/* Stage 6 Section */}
                {advancedReport?.step6Results && (
                  <div className="mt-4">
                    <h5 className="mb-3">Stage 6: Controlling Flow Rate</h5>

              {/* Stage 1 */}
                    <h6 className="mb-3">Stage 1</h6>
              <div className="row g-4 mb-4">
                {(() => {
                        const s1 = advancedReport.step6Results.step_6 || {};
                  return (
                    <>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm oxygen-card">
                          <Card.Body>
                            <Card.Title className="text-primary">Oxygen</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.oxygen?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.oxygen?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm co2-card">
                          <Card.Body>
                            <Card.Title className="text-primary">CO2</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.co2?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.co2?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tss-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TSS</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.tss?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.tss?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tan-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TAN</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.tan?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.tan?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Stage 2 */}
                    <h6 className="mb-3">Stage 2</h6>
              <div className="row g-4 mb-4">
                {(() => {
                        const s1 = advancedReport.step6Results.step_6 || {};
                  return (
                    <>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm oxygen-card">
                          <Card.Body>
                            <Card.Title className="text-primary">Oxygen (Stage 2)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage2_oxygen?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage2_oxygen?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm co2-card">
                          <Card.Body>
                            <Card.Title className="text-primary">CO2 (Stage 2)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage2_co2?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage2_co2?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tss-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TSS (Stage 2)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage2_tss?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage2_tss?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tan-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TAN (Stage 2)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage2_tan?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage2_tan?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Stage 3 */}
                    <h6 className="mb-3">Stage 3</h6>
                    <div className="row g-4 mb-4">
                {(() => {
                        const s1 = advancedReport.step6Results.step_6 || {};
                  return (
                    <>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm oxygen-card">
                          <Card.Body>
                            <Card.Title className="text-primary">Oxygen (Stage 3)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage3_oxygen?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage3_oxygen?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm co2-card">
                          <Card.Body>
                            <Card.Title className="text-primary">CO2 (Stage 3)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage3_co2?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage3_co2?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tss-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TSS (Stage 3)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage3_tss?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage3_tss?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tan-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TAN (Stage 3)</Card.Title>
                            <div className="mt-3">
                                    <div className="metric-row">
                                      <span className="label">L/min</span>
                                      <strong>{s1.stage3_tan?.l_per_min ?? 0}</strong>
                                    </div>
                                    <div className="metric-row">
                                      <span className="label">m³/hr</span>
                                      <strong>{s1.stage3_tan?.m3_per_hr ?? 0}</strong>
                                    </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Limiting Factor */}
                    <h6 className="mb-3">Limiting Factor</h6>
              <div className="row g-4">
                {(() => {
                  const lf = limitingFactor || {
                    stage1: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                    stage2: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 },
                    stage3: { factor: '-', flow_l_per_min: 0, flow_m3_per_hr: 0 }
                  };
                  return (
                    <>
                      <div className="col-md-4">
                        <Card className="h-100 shadow-sm">
                          <Card.Body>
                            <Card.Title className="text-primary">Stage 1</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage1?.factor ?? '-'}</strong></div>
                              <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage1?.flow_l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage1?.flow_m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-4">
                        <Card className="h-100 shadow-sm">
                          <Card.Body>
                            <Card.Title className="text-primary">Stage 2</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage2?.factor ?? '-'}</strong></div>
                              <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage2?.flow_l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage2?.flow_m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-4">
                        <Card className="h-100 shadow-sm">
                          <Card.Body>
                            <Card.Title className="text-primary">Stage 3</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">Factor</span><strong>{lf.stage3?.factor ?? '-'}</strong></div>
                              <div className="metric-row"><span className="label">Flow (L/min)</span><strong>{lf.stage3?.flow_l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Flow (m³/hr)</span><strong>{lf.stage3?.flow_m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
                </div>
            </div>
            )}
            </div>
            )}
              
              {/* Download Buttons - Only show in report view and when Mass Balance & Controlling Flow Rate tab is visible */}
              {isAdvancedReportView && (activeReportTab === 'all' || activeReportTab === 'massBalance') && (
                <div className="text-center mb-4 mt-4">
                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    style={{ 
                        minWidth: '140px', 
                      borderRadius: '8px', 
                        height: '35px',
                        padding: '6px 12px',
                        lineHeight: '23px',
                        textAlign: 'center'
                      }}
                      onClick={() => {
                        try {
                          const doc = generateAdvancedReportPdf(formData, advancedReport, limitingFactor);
                          const fileName = `MassBalance_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                          doc.save(fileName);
                        } catch (error) {
                          console.error('Error generating Mass Balance PDF:', error);
                          alert('Error generating Mass Balance PDF. Please try again.');
                        }
                      }}
                    >
                      📊 Download Mass Balance
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      style={{ 
                        minWidth: '140px', 
                        borderRadius: '8px', 
                        height: '35px',
                        padding: '6px 12px',
                        lineHeight: '23px',
                      textAlign: 'center'
                    }}
                    onClick={() => {
                      try {
                        const doc = generateAdvancedReportPdf(formData, advancedReport, limitingFactor);
                        const fileName = `Stage6_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                      } catch (error) {
                        console.error('Error generating Stage 6 PDF:', error);
                        alert('Error generating Stage 6 PDF. Please try again.');
                      }
                    }}
                  >
                      ⚡ Download Stage 6
                  </Button>
                  </div>
                </div>
              )}

            {/* Stage 7 Report - Bio Filter & Sump Size */}
            {stage7Report && (activeReportTab === 'all' || activeReportTab === 'stage7') && (
              <div className="report-cards">
                {/* Stage 7 Title */}
                <h4 className="mb-4 text-primary">Stage 7: Bio Filter & Sump Size</h4>
                
                {/* Display Stage 7 Inputs */}
                {stage7Inputs && (
                  <div className="mb-4">
                    <h5 className="mb-3 text-info">Stage 7 Input Parameters</h5>
                    <InputsDisplay inputs={stage7Inputs} showOnlyStage7Specific={true} />
                  </div>
                )}
                {!stage7Inputs && (
                  <div className="mb-4">
                    <p className="text-muted">Loading Stage 7 inputs...</p>
                  </div>
                )}
                
                <h5 className="mb-3">Bio Filter Parameters</h5>
                
                {/* Bio Filter Parameters */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm bio-filter-card">
                      <Card.Body>
                        <Card.Title className="text-primary">Bio Filter Parameters</Card.Title>
                        <div className="mt-3">
                          <div className="metric-row"><span className="label">VTR Used</span><strong>{stage7Report.bioVTR_use ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">VTR Compensation</span><strong>{stage7Report['bio.VTR_compensation'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Shape</span><strong>{stage7Report['bio.shape'] ?? 'N/A'}</strong></div>
                          <div className="metric-row"><span className="label">Temperature Used</span><strong>{stage7Report.temperature_used ?? 0}°C</strong></div>
                          <div className="metric-row"><span className="label">Temp Compensation Factor</span><strong>{stage7Report.temp_compensation_factor ?? 0}</strong></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6">
                    <Card className="h-100 shadow-sm sump-card">
                      <Card.Body>
                        <Card.Title className="text-primary">System Overview</Card.Title>
                        <div className="mt-3">
                          <div className="metric-row"><span className="label">Project ID</span><strong>{stage7Report.project_id ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Status</span><strong>{stage7Report.status ?? 'N/A'}</strong></div>
                          <div className="metric-row"><span className="label">Biofilter Parameters</span><strong>{Object.keys(stage7Report.biofilter_parameters || {}).length} items</strong></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                {/* Stage 1, 2, 3 Results */}
                <div className="row g-4 mb-4">
                  {/* Stage 1 */}
                  <div className="col-md-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-success">Stage 1 (Juvenile)</Card.Title>
                        <div className="mt-3">
                          {/* Daily TAN Production */}
                          <h6 className="text-muted mb-2">Daily TAN Production Rate</h6>
                          <div className="metric-row"><span className="label">Total (g/day)</span><strong>{stage7Report.DailyTAN_gday_Stage1 ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">After Passive Nitrification (g/day)</span><strong>{stage7Report.DailyTANpassive_gday_Stage1 ?? 0}</strong></div>
                          
                          {/* Design VTR */}
                          <h6 className="text-muted mb-2 mt-3">Design VTR</h6>
                          <div className="metric-row"><span className="label">Design VTR</span><strong>{stage7Report['design.VTR_Stage1'] ?? 0}</strong></div>
                          
                          {/* Media Volume Required */}
                          <h6 className="text-muted mb-2 mt-3">Media Volume Required</h6>
                          <div className="metric-row"><span className="label">Media Required (m³)</span><strong>{stage7Report['biomedia.Required_Stage1'] ?? 0}</strong></div>
                          
                          {/* MBBR Volume */}
                          <h6 className="text-muted mb-2 mt-3">MBBR Volume</h6>
                          <div className="metric-row"><span className="label">MBBR Volume (m³)</span><strong>{stage7Report['MBBR.vol_Stage1'] ?? 0}</strong></div>
                          
                          {/* Round Vessel */}
                          <h6 className="text-muted mb-2 mt-3">Round Vessel</h6>
                          <div className="metric-row"><span className="label">Vessel Diameter (m)</span><strong>{stage7Report['MBBR.dia_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{stage7Report['MBBR.high_Stage1'] ?? 0}</strong></div>
                          
                          {/* Rectangular Vessel */}
                          <h6 className="text-muted mb-2 mt-3">Rectangular Vessel</h6>
                          <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{stage7Report['MBBR.highRect_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Width (m)</span><strong>{stage7Report['MBBR.wid_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Length (m)</span><strong>{stage7Report['MBBR.len_Stage1'] ?? 0}</strong></div>
                          
                          {/* Aeration */}
                          <h6 className="text-muted mb-2 mt-3">Aeration</h6>
                          <div className="metric-row"><span className="label">Volume Air Required for Mixing (x5 vol)</span><strong>{stage7Report['MBBR.air_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Volume Air Required (with 50% spare capacity)</span><strong>{stage7Report['MBBR.air_Stage1_spare'] ?? 0}</strong></div>
                          
                          {/* Sump Sizing */}
                          <h6 className="text-muted mb-2 mt-3">Sump Sizing</h6>
                          <div className="metric-row"><span className="label">3 min Full Flow (m³)</span><strong>{stage7Report['sump.Size_3min_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">5 min Full Flow (m³)</span><strong>{stage7Report['sump.Size_5min_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Sump Total Volume (m³)</span><strong>{stage7Report['sump.totvol_Stage1'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Total System Volume (m³)</span><strong>{stage7Report['vol.TotalSyst_Stage1'] ?? 0}</strong></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  {/* Stage 2 */}
                  <div className="col-md-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-warning">Stage 2 (Fingerling)</Card.Title>
                        <div className="mt-3">
                          {/* Daily TAN Production */}
                          <h6 className="text-muted mb-2">Daily TAN Production Rate</h6>
                          <div className="metric-row"><span className="label">Total (g/day)</span><strong>{stage7Report.DailyTAN_gday_Stage2 ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">After Passive Nitrification (g/day)</span><strong>{stage7Report.DailyTANpassive_gday_Stage2 ?? 0}</strong></div>
                          
                          {/* Design VTR */}
                          <h6 className="text-muted mb-2 mt-3">Design VTR</h6>
                          <div className="metric-row"><span className="label">Design VTR</span><strong>{stage7Report['design.VTR_Stage2'] ?? 0}</strong></div>
                          
                          {/* Media Volume Required */}
                          <h6 className="text-muted mb-2 mt-3">Media Volume Required</h6>
                          <div className="metric-row"><span className="label">Media Required (m³)</span><strong>{stage7Report['biomedia.Required_Stage2'] ?? 0}</strong></div>
                          
                          {/* MBBR Volume */}
                          <h6 className="text-muted mb-2 mt-3">MBBR Volume</h6>
                          <div className="metric-row"><span className="label">MBBR Volume (m³)</span><strong>{stage7Report['MBBR.vol_Stage2'] ?? 0}</strong></div>
                          
                          {/* Round Vessel */}
                          <h6 className="text-muted mb-2 mt-3">Round Vessel</h6>
                          <div className="metric-row"><span className="label">Vessel Diameter (m)</span><strong>{stage7Report['MBBR.dia_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{stage7Report['MBBR.high_Stage2'] ?? 0}</strong></div>
                          
                          {/* Rectangular Vessel */}
                          <h6 className="text-muted mb-2 mt-3">Rectangular Vessel</h6>
                          <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{stage7Report['MBBR.highRect_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Width (m)</span><strong>{stage7Report['MBBR.wid_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Length (m)</span><strong>{stage7Report['MBBR.len_Stage2'] ?? 0}</strong></div>
                          
                          {/* Aeration */}
                          <h6 className="text-muted mb-2 mt-3">Aeration</h6>
                          <div className="metric-row"><span className="label">Volume Air Required for Mixing (x5 vol)</span><strong>{stage7Report['MBBR.air_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Volume Air Required (with 50% spare capacity)</span><strong>{stage7Report['MBBR.air_Stage2_spare'] ?? 0}</strong></div>
                          
                          {/* Sump Sizing */}
                          <h6 className="text-muted mb-2 mt-3">Sump Sizing</h6>
                          <div className="metric-row"><span className="label">3 min Full Flow (m³)</span><strong>{stage7Report['sump.Size_3min_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">5 min Full Flow (m³)</span><strong>{stage7Report['sump.Size_5min_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Sump Total Volume (m³)</span><strong>{stage7Report['sump.totvol_Stage2'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Total System Volume (m³)</span><strong>{stage7Report['vol.TotalSyst_Stage2'] ?? 0}</strong></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  {/* Stage 3 */}
                  <div className="col-md-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="text-danger">Stage 3 (Growout)</Card.Title>
                        <div className="mt-3">
                          {/* Daily TAN Production */}
                          <h6 className="text-muted mb-2">Daily TAN Production Rate</h6>
                          <div className="metric-row"><span className="label">Total (g/day)</span><strong>{stage7Report.DailyTAN_gday_Stage3 ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">After Passive Nitrification (g/day)</span><strong>{stage7Report.DailyTANpassive_gday_Stage3 ?? 0}</strong></div>
                          
                          {/* Design VTR */}
                          <h6 className="text-muted mb-2 mt-3">Design VTR</h6>
                          <div className="metric-row"><span className="label">Design VTR</span><strong>{stage7Report['design.VTR_Stage3'] ?? 0}</strong></div>
                          
                          {/* Media Volume Required */}
                          <h6 className="text-muted mb-2 mt-3">Media Volume Required</h6>
                          <div className="metric-row"><span className="label">Media Required (m³)</span><strong>{stage7Report['biomedia.Required_Stage3'] ?? 0}</strong></div>
                          
                          {/* MBBR Volume */}
                          <h6 className="text-muted mb-2 mt-3">MBBR Volume</h6>
                          <div className="metric-row"><span className="label">MBBR Volume (m³)</span><strong>{stage7Report['MBBR.vol_Stage3'] ?? 0}</strong></div>
                          
                          {/* Round Vessel */}
                          <h6 className="text-muted mb-2 mt-3">Round Vessel</h6>
                          <div className="metric-row"><span className="label">Vessel Diameter (m)</span><strong>{stage7Report['MBBR.dia_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{stage7Report['MBBR.high_Stage3'] ?? 0}</strong></div>
                          
                          {/* Rectangular Vessel */}
                          <h6 className="text-muted mb-2 mt-3">Rectangular Vessel</h6>
                          <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{stage7Report['MBBR.highRect_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Width (m)</span><strong>{stage7Report['MBBR.wid_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Vessel Length (m)</span><strong>{stage7Report['MBBR.len_Stage3'] ?? 0}</strong></div>
                          
                          {/* Aeration */}
                          <h6 className="text-muted mb-2 mt-3">Aeration</h6>
                          <div className="metric-row"><span className="label">Volume Air Required for Mixing (x5 vol)</span><strong>{stage7Report['MBBR.air_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Volume Air Required (with 50% spare capacity)</span><strong>{stage7Report['MBBR.air_Stage3_spare'] ?? 0}</strong></div>
                          
                          {/* Sump Sizing */}
                          <h6 className="text-muted mb-2 mt-3">Sump Sizing</h6>
                          <div className="metric-row"><span className="label">3 min Full Flow (m³)</span><strong>{stage7Report['sump.Size_3min_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">5 min Full Flow (m³)</span><strong>{stage7Report['sump.Size_5min_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Sump Total Volume (m³)</span><strong>{stage7Report['sump.totvol_Stage3'] ?? 0}</strong></div>
                          <div className="metric-row"><span className="label">Total System Volume (m³)</span><strong>{stage7Report['vol.TotalSyst_Stage3'] ?? 0}</strong></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
                {/* Stage 7 Download Button */}
                <div className="text-center mb-4">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    style={{ 
                      width: '150px', 
                      borderRadius: '8px', 
                      height: '30px',
                      padding: '0',
                      lineHeight: '30px',
                      textAlign: 'center'
                    }}
                    onClick={() => {
                      try {
                        const doc = generateStage7ReportPdf(formData, stage7Report);
                        const fileName = `Stage7_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                      } catch (error) {
                        console.error('Error generating Stage 7 PDF:', error);
                        alert('Error generating Stage 7 PDF. Please try again.');
                      }
                    }}
                  >
                    Download Stage 7
                  </Button>
                </div>
              </div>
            )}

            {/* Stage 8 Report - Basic Pump Size */}
            {stage8Report && (activeReportTab === 'all' || activeReportTab === 'stage8') && (
              <div className="report-cards">
                <h5 className="mb-3">Stage 8: Basic Pump Size</h5>
                
                {/* Stage 1 */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Stage 1</h6>
                  <div className="row g-3">
                    <div className="col-12">
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <Card.Title className="text-primary">Stage 1 Parameters</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">Limiting Flow Rate</span><strong>{stage8Report?.stage1?.limitingFlowRateStage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Q_l.s_Stage1</span><strong>{stage8Report?.stage1?.Q_l_s_Stage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Total Dynamic Head Pressure</span><strong>{stage8Report?.stage1?.pump_Head_Stage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Pump Efficiency</span><strong>{stage8Report?.stage1?.n_Pump_Stage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Motor Efficiency</span><strong>{stage8Report?.stage1?.n_Motor_Stage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Hydraulic Power</span><strong>{stage8Report?.stage1?.pump_HydPower_Stage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Required Shaft Power</span><strong>{stage8Report?.stage1?.pump_PowerkW_Stage1 ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Stage 2</h6>
                  <div className="row g-3">
                    <div className="col-12">
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <Card.Title className="text-primary">Stage 2 Parameters</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">Limiting Flow Rate</span><strong>{stage8Report?.stage2?.limitingFlowRateStage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Q_l.s_Stage2</span><strong>{stage8Report?.stage2?.Q_l_s_Stage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Total Dynamic Head Pressure</span><strong>{stage8Report?.stage2?.pump_Head_Stage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Pump Efficiency</span><strong>{stage8Report?.stage2?.n_Pump_Stage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Motor Efficiency</span><strong>{stage8Report?.stage2?.n_Motor_Stage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Hydraulic Power</span><strong>{stage8Report?.stage2?.pump_HydPower_Stage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Required Shaft Power</span><strong>{stage8Report?.stage2?.pump_PowerkW_Stage2 ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Stage 3</h6>
                  <div className="row g-3">
                    <div className="col-12">
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <Card.Title className="text-primary">Stage 3 Parameters</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">Limiting Flow Rate</span><strong>{stage8Report?.stage3?.limitingFlowRateStage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Q_l.s_Stage3</span><strong>{stage8Report?.stage3?.Q_l_s_Stage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Total Dynamic Head Pressure</span><strong>{stage8Report?.stage3?.pump_Head_Stage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Pump Efficiency</span><strong>{stage8Report?.stage3?.n_Pump_Stage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Motor Efficiency</span><strong>{stage8Report?.stage3?.n_Motor_Stage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Hydraulic Power</span><strong>{stage8Report?.stage3?.pump_HydPower_Stage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Required Shaft Power</span><strong>{stage8Report?.stage3?.pump_PowerkW_Stage3 ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Stage 8 Download Button */}
                <div className="text-center mb-4">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    style={{ 
                      width: '150px', 
                      borderRadius: '8px', 
                      height: '30px',
                      padding: '0',
                      lineHeight: '30px',
                      textAlign: 'center'
                    }}
                    onClick={() => {
                      try {
                        const doc = generateStage8ReportPdf(formData, stage8Report);
                        const fileName = `Stage8_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                      } catch (error) {
                        console.error('Error generating Stage 8 PDF:', error);
                        alert('Error generating Stage 8 PDF. Please try again.');
                      }
                    }}
                  >
                    Download Stage 8
                  </Button>
                </div>
              </div>
            )}

            <div className="navigation-buttons mt-3">
              <div className="button-group-left">
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    // Navigate back page by page based on which stages were selected
                    if (stage7Report) {
                      // If Stage 7 was calculated, go back to Stage 7 inputs page
                      setIsAdvancedReportView(false);
                      setShowStage7Inputs(true);
                    } else {
                      // If only Stage 6 was calculated, go back to Stage 6 page
                      setIsAdvancedReportView(false);
                    }
                  }}
                >
                  Back
                </Button>
              </div>
              <div className="button-group-right">
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '6px 25px'
                  }}
                >
                  Save & Return to Dashboard
                </Button>
                {/* Only show Download All Report button if Stage 7 is calculated AND in report view */}
                {stage7Report && isAdvancedReportView && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    style={{ 
                      width: '200px', 
                      borderRadius: '8px', 
                      height: '30px',
                      padding: '6px 32px',
                      lineHeight: '18px',
                      textAlign: 'center',
                      marginLeft: '10px'
                    }}
                    onClick={() => {
                      try {
                        const doc = generateCompleteAdvancedReportPdf(formData, advancedReport, limitingFactor, stage7Report, stage8Report);
                        const fileName = `Complete_Report_${formData.designSystemName || 'Design'}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                      } catch (error) {
                        console.error('Error generating complete PDF:', error);
                        alert('Error generating complete PDF. Please try again.');
                      }
                    }}
                  >
                    Download All Report
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : showStage7Inputs && !isAdvancedReportView ? (
          /* Stage 7 Inputs Page */
          <div className="step-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Stage 7: Bio Filter & Sump Size Parameters</h4>
            </div>
            
            {/* Stage 7 Input Fields */}
            <div className="combined-inputs-page">
              <Row className="g-4">
                {/* Left Column - Stage 7 Inputs (equal width) */}
                <Col lg={6}>
                  <div className="inputs-column">
                    <style>{`
                      /* Mirror basic dynamic inputs: single vertical column */
                      .stage7-onecol .row > [class^="col-"],
                      .stage7-onecol .row > [class*=" col-"] {
                        max-width: 100% !important;
                        flex: 0 0 100% !important;
                      }
                    `}</style>
                <div className="config-section mb-5 stage7-onecol">
              <div className="section-header">
                <h4><i className="bi bi-filter text-primary me-2"></i>Bio Filter & Sump Size Parameters</h4>
                <p className="text-muted">Configure parameters for bio filter and sump sizing calculations</p>
              </div>
              
              {/* BIOFILTER SIZING */}
              <h5 className="mt-2 mb-3">BIOFILTER SIZING</h5>
              <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>MBBR location</Form.Label>
                    <Form.Select 
                      name="mbbr_location"
                      value={stage7FormData.mbbr_location}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, mbbr_location: e.target.value}));
                        handleInputChange(e);
                      }}
                    >
                      <option value="Integrated">Integrated</option>
                      <option value="Standalone">Standalone</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Media:water volume ratio</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="media_to_water_volume_ratio"
                      placeholder="Media:water volume ratio" 
                      value={stage7FormData.media_to_water_volume_ratio || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, media_to_water_volume_ratio: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Passive nitrification rate (Stage 1)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="passive_nitrification_rate_stage1_percent"
                      placeholder="Passive nitrification rate (Stage 1)" 
                      value={stage7FormData.passive_nitrification_rate_stage1_percent || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, passive_nitrification_rate_stage1_percent: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Passive nitrification rate (Stage 2)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="passive_nitrification_rate_stage2_percent"
                      placeholder="Passive nitrification rate (Stage 2)" 
                      value={stage7FormData.passive_nitrification_rate_stage2_percent || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, passive_nitrification_rate_stage2_percent: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Passive nitrification rate (Stage 3)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="passive_nitrification_rate_stage3_percent"
                      placeholder="Passive nitrification rate (Stage 3)" 
                      value={stage7FormData.passive_nitrification_rate_stage3_percent || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, passive_nitrification_rate_stage3_percent: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Pump-stop-overflow vol</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="pump_stop_overflow_volume"
                      placeholder="Pump-stop-overflow vol" 
                      value={stage7FormData.pump_stop_overflow_volume || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, pump_stop_overflow_volume: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Height-diameter ratio of cylindrical tank</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="standalone_height_diameter_ratio"
                      placeholder="Height-diameter ratio of cylindrical tank" 
                      value={stage7FormData.standalone_height_diameter_ratio || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, standalone_height_diameter_ratio: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Volumetric nitrification rate (VTR; Leave blank if unknown)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="volumetric_nitrification_rate_vtr"
                      placeholder="Volumetric nitrification rate (VTR)" 
                      value={stage7FormData.volumetric_nitrification_rate_vtr || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, volumetric_nitrification_rate_vtr: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
              </div>

              {/* TANK DESIGN */}
              <h5 className="mt-4 mb-3">TANK DESIGN</h5>
              
              {/* Stage 1 Tank Design */}
              <h6 className="mt-3 mb-2">Stage 1</h6>
              <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Number of tanks (Stage 1)</Form.Label>
                    <Form.Control 
                      type="number" 
                      name="num_tanks_stage1"
                      placeholder="Number of tanks (Stage 1)" 
                      value={stage7FormData.num_tanks_stage1 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, num_tanks_stage1: parseInt(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Tank diameter:depth ratio (Stage 1)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="tank_dd_ratio_stage1"
                      placeholder="Tank diameter:depth ratio (Stage 1)" 
                      value={stage7FormData.tank_dd_ratio_stage1 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, tank_dd_ratio_stage1: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Tank freeboard (Stage 1)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="tank_freeboard_stage1"
                      placeholder="Tank freeboard (Stage 1)" 
                      value={stage7FormData.tank_freeboard_stage1 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, tank_freeboard_stage1: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
              </div>

              {/* Stage 2 Tank Design */}
              <h6 className="mt-3 mb-2">Stage 2</h6>
              <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Number of tanks (Stage 2)</Form.Label>
                    <Form.Control 
                      type="number" 
                      name="num_tanks_stage2"
                      placeholder="Number of tanks (Stage 2)" 
                      value={stage7FormData.num_tanks_stage2 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, num_tanks_stage2: parseInt(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Tank diameter:depth ratio (Stage 2)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="tank_dd_ratio_stage2"
                      placeholder="Tank diameter:depth ratio (Stage 2)" 
                      value={stage7FormData.tank_dd_ratio_stage2 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, tank_dd_ratio_stage2: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Tank freeboard (Stage 2)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="tank_freeboard_stage2"
                      placeholder="Tank freeboard (Stage 2)" 
                      value={stage7FormData.tank_freeboard_stage2 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, tank_freeboard_stage2: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
              </div>

              {/* Growout (Stage 3) Tank Design */}
              <h6 className="mt-3 mb-2">Growout (Stage 3)</h6>
              <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Number of tanks (Stage 3)</Form.Label>
                    <Form.Control 
                      type="number" 
                      name="num_tanks_stage3"
                      placeholder="Number of tanks (Stage 3)" 
                      value={stage7FormData.num_tanks_stage3 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, num_tanks_stage3: parseInt(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Tank diameter:depth ratio (Stage 3)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="tank_dd_ratio_stage3"
                      placeholder="Tank diameter:depth ratio (Stage 3)" 
                      value={stage7FormData.tank_dd_ratio_stage3 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, tank_dd_ratio_stage3: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 col-lg-4">
                  <Form.Group>
                    <Form.Label>Tank freeboard (Stage 3)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      name="tank_freeboard_stage3"
                      placeholder="Tank freeboard (Stage 3)" 
                      value={stage7FormData.tank_freeboard_stage3 || ''}
                      onChange={(e) => {
                        setStage7FormData(prev => ({...prev, tank_freeboard_stage3: parseFloat(e.target.value) || 0}));
                        handleInputChange(e);
                      }}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>

            {/* Stage 8 Selection */}
            <div className="config-section mb-4">
              <div className="section-header">
                <h4><i className="bi bi-gear text-primary me-2"></i>Additional Calculations</h4>
                <p className="text-muted">Select additional calculation stages</p>
              </div>
              
            </div>
                  </div>
                </Col>
                
                {/* Right Column - Dynamic Outputs (equal width) */}
                <Col lg={6}>
                  <div className="outputs-column">
                    <Stage7DynamicOutputsPanel 
                      formData={stage7FormData} 
                      liveOutputs={dynamicStage7}
                      step4Data={dynamicStage6?.step4Data}
                      onFieldUpdate={() => {}}
                    />
                  </div>
                </Col>
              </Row>
            </div>
            
            {/* Stage 8 Checkbox - moved outside two-column layout */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="stage-option-card">
                  <Form.Check
                    type="checkbox"
                    id="stage8-checkbox"
                    label="Calculate Basic Pump Size (Stage 8)"
                    checked={stage8Selected}
                    onChange={(e) => setStage8Selected(e.target.checked)}
                    className="stage-checkbox"
                  />
                  <p className="text-muted small mt-2">
                    Calculate basic pump sizing parameters including flow rate, head pressure, and power requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 7 Calculate Button - moved outside two-column layout */}
            <div className="calculate-section mt-4">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="navigation-buttons">
                <div className="button-group-left">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    style={{ width: '100px' }}
                    onClick={() => {
                      setShowStage7Inputs(false);
                      setStage7Selected(false); // Reset Stage 7 selection when going back
                    }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
                <div className="button-group-right">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      console.log('🚀 Stage 7 Calculate button clicked!');
                      try {
                        setLoading(true);
                        setError('');
                        
                        console.log('🔍 Checking for project ID...');
                        const currentProjectId = localStorage.getItem('currentProjectId');
                        console.log('🔍 Project ID found:', currentProjectId);
                        
                        if (!currentProjectId) {
                          throw new Error('No project ID found. Please create a project first.');
                        }
                        
                        console.log('🚀 Starting Stage 7 calculation process...');
                        console.log('📊 Stage 7 Form Data:', stage7FormData);
                        console.log('📊 Stage 8 Selected:', stage8Selected);
                        console.log('📊 Stored Step 6 Values:', tempStep6Values);
                        console.log('🔍 Initial Weight Debug:', {
                          tempStep6Values_production: tempStep6Values?.production,
                          initialWeight: tempStep6Values?.production?.initialWeight,
                          initialWeightWiG: tempStep6Values?.production?.initialWeightWiG,
                          formData_initialWeightWiG: formData.initialWeightWiG
                        });
                        
                        // First, call Step 6 APIs with stored values
                        let step6Data = null;
                        let limitingFactor = null;
                        let massBalanceData = null;
                        
                        try {
                          console.log('📊 Calling Step 6 APIs with stored values...');
                          
                          // Call Step 6 POST API
                          const step6Payload = {
                            // Water quality parameters
                            ph: tempStep6Values.waterQuality.ph ? parseFloat(tempStep6Values.waterQuality.ph) : 7,
                            temperature: tempStep6Values.waterQuality.waterTemp ? parseFloat(tempStep6Values.waterQuality.waterTemp) : 27,
                            dissolved_O2_min: tempStep6Values.waterQuality.minDO ? parseFloat(tempStep6Values.waterQuality.minDO) : 3.0,
                            target_min_o2_saturation: tempStep6Values.waterQuality.targetMinO2Saturation ? parseFloat(tempStep6Values.waterQuality.targetMinO2Saturation) : 95,
                            TAN_max: tempStep6Values.waterQuality.maxTAN ? parseFloat(tempStep6Values.waterQuality.maxTAN) : 2,
                            dissolved_CO2_max: tempStep6Values.waterQuality.maxCO2 ? parseFloat(tempStep6Values.waterQuality.maxCO2) : 15,
                            TSS_max: tempStep6Values.waterQuality.minTSS ? parseFloat(tempStep6Values.waterQuality.minTSS) : 80,
                            salinity: tempStep6Values.waterQuality.salinity ? parseFloat(tempStep6Values.waterQuality.salinity) : 0,
                            alkalinity: tempStep6Values.waterQuality.alkalinity ? parseFloat(tempStep6Values.waterQuality.alkalinity) : 250,
                            supplement_pure_o2: tempStep6Values.waterQuality.supplementPureO2 || false,
                            elevation_m: tempStep6Values.waterQuality.siteElevation ? parseFloat(tempStep6Values.waterQuality.siteElevation) : 500,

                            // System efficiency parameters
                            oxygen_injection_efficiency: tempStep6Values.systemEfficiency.o2Absorption ? parseFloat(tempStep6Values.systemEfficiency.o2Absorption) : 90,
                            tss_removal_efficiency: tempStep6Values.systemEfficiency.tssRemoval ? parseFloat(tempStep6Values.systemEfficiency.tssRemoval) : 80,
                            co2_removal_efficiency: tempStep6Values.systemEfficiency.co2Removal ? parseFloat(tempStep6Values.systemEfficiency.co2Removal) : 70,
                            tan_removal_efficiency: tempStep6Values.systemEfficiency.tanRemoval ? parseFloat(tempStep6Values.systemEfficiency.tanRemoval) : 80,

                            // Species and production parameters
                            species: tempStep6Values.production.targetSpecies || "Nile tilapia",
                            initial_weight_wi_g: (tempStep6Values.production.initialWeight && tempStep6Values.production.initialWeight.toString().trim() !== '') ? parseFloat(tempStep6Values.production.initialWeight) : null,
                            juvenile_size: (tempStep6Values.production.juvenileSize && tempStep6Values.production.juvenileSize.toString().trim() !== '') ? parseFloat(tempStep6Values.production.juvenileSize) : null,
                            target_market_fish_size: (tempStep6Values.production.targetFishWeight && tempStep6Values.production.targetFishWeight.toString().trim() !== '') ? parseFloat(tempStep6Values.production.targetFishWeight) : null,

                            production_target_t: tempStep6Values.production.productionTarget_t ? parseFloat(tempStep6Values.production.productionTarget_t) : 100,
                            harvest_frequency: tempStep6Values.production.harvestFrequency || "Fortnightly",

                            // Feed parameters
                            fcr_stage1: tempStep6Values.stageWise.FCR_Stage1 ? parseFloat(tempStep6Values.stageWise.FCR_Stage1) : 1.1,
                            feed_protein_stage1: tempStep6Values.stageWise.FeedProtein_Stage1 ? parseFloat(tempStep6Values.stageWise.FeedProtein_Stage1) : 45,
                            fcr_stage2: tempStep6Values.stageWise.FCR_Stage2 ? parseFloat(tempStep6Values.stageWise.FCR_Stage2) : 1.2,
                            feed_protein_stage2: tempStep6Values.stageWise.FeedProtein_Stage2 ? parseFloat(tempStep6Values.stageWise.FeedProtein_Stage2) : 45,
                            fcr_stage3: tempStep6Values.stageWise.FCR_Stage3 ? parseFloat(tempStep6Values.stageWise.FCR_Stage3) : 1.3,
                            feed_protein_stage3: tempStep6Values.stageWise.FeedProtein_Stage3 ? parseFloat(tempStep6Values.stageWise.FeedProtein_Stage3) : 45,

                            // Mortality parameters
                            estimated_mortality_stage1: tempStep6Values.stageWise.Estimated_mortality_Stage1 ? parseFloat(tempStep6Values.stageWise.Estimated_mortality_Stage1) : 0,
                            estimated_mortality_stage2: tempStep6Values.stageWise.Estimated_mortality_Stage2 ? parseFloat(tempStep6Values.stageWise.Estimated_mortality_Stage2) : 0,
                            estimated_mortality_stage3: tempStep6Values.stageWise.Estimated_mortality_Stage3 ? parseFloat(tempStep6Values.stageWise.Estimated_mortality_Stage3) : 0
                          };

                          console.log('🔍 Step 6 Payload initial_weight_wi_g:', step6Payload.initial_weight_wi_g);
                          console.log('🔍 Full Step 6 Payload:', step6Payload);
                          const response = await postAdvancedParameters(currentProjectId, { ...step6Payload, type: 'advanced' });
                          console.log('✅ Step 6 POST Success:', response);

                          // Fetch Step 6 results
                          step6Data = await getAdvancedStep6Results(currentProjectId);
                          console.log('✅ Step 6 Results:', step6Data);

                          // Fetch Limiting Factor
                          limitingFactor = await getAdvancedLimitingFactor(currentProjectId);
                          console.log('✅ Limiting Factor:', limitingFactor);

                          // Fetch Mass Balance Data
                          const waterQualityData = {
                            waterTemp: tempStep6Values.waterQuality.waterTemp,
                            salinity: tempStep6Values.waterQuality.salinity,
                            siteElevation: tempStep6Values.waterQuality.siteElevation,
                            minDO: tempStep6Values.waterQuality.minDO,
                            ph: tempStep6Values.waterQuality.ph,
                            maxCO2: tempStep6Values.waterQuality.maxCO2,
                            maxTAN: tempStep6Values.waterQuality.maxTAN,
                            minTSS: tempStep6Values.waterQuality.minTSS,
                            targetSpecies: tempStep6Values.production.targetSpecies,
                            useRecommendedValues: formData.useRecommendedValues,
                            type: 'advanced',
                            tankVolume: tempStep6Values.production.tankVolume,
                            numTanks: tempStep6Values.production.numTanks,
                            targetFishWeight: tempStep6Values.production.targetFishWeight,
                            targetNumFish: tempStep6Values.production.targetNumFish,
                            feedRate: tempStep6Values.production.feedRate,
                            feedConversionRatio: tempStep6Values.production.feedConversionRatio,
                            feedProtein: tempStep6Values.production.feedProtein,
                            // Include efficiency parameters
                            o2Absorption: tempStep6Values.systemEfficiency.o2Absorption,
                            co2Removal: tempStep6Values.systemEfficiency.co2Removal,
                            tanRemoval: tempStep6Values.systemEfficiency.tanRemoval,
                            tssRemoval: tempStep6Values.systemEfficiency.tssRemoval
                          };
                          
                          await createWaterQualityParameters(waterQualityData);
                          
                          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                          const productionResponse = await fetch(`/backend/formulas/api/projects/${currentProjectId}/production-calculations`, {
                            method: 'GET',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Accept': 'application/json'
                            }
                          });
                          
                          if (productionResponse.ok) {
                            const raw = await productionResponse.json();
                            massBalanceData = {
                              oxygen: {
                                saturationAdjustedMgL: raw.o2_saturation_adjusted_mg_l ?? raw.o2_saturation_adjusted?.value ?? null,
                                MINDO_use: raw.min_do_use_mg_l ?? raw.min_do_mg_l ?? null,
                                effluentMgL: raw.oxygen_effluent_concentration_mg_l ?? raw.oxygen_effluent_concentration?.value ?? null,
                                consMgPerDay: raw.oxygen_consumption_production_mg_per_day ?? raw.oxygen_consumption_production?.value ?? null,
                                consKgPerDay: (raw.oxygen_consumption_production_mg_per_day ?? raw.oxygen_consumption_production?.value ?? 0) / 1_000_000
                              },
                              tss: {
                                effluentMgL: raw.tss_effluent_concentration_mg_l ?? raw.tss_effluent_concentration?.value ?? null,
                                prodMgPerDay: raw.tss_production_mg ?? raw.tss_production?.value ?? null,
                                prodKgPerDay: (raw.tss_production_mg ?? raw.tss_production?.value ?? 0) / 1_000_000,
                                MAXTSS_use: raw.max_tss_use_mg_l ?? null
                              },
                              co2: {
                                effluentMgL: raw.co2_effluent_concentration_mg_l ?? raw.co2_effluent_concentration?.value ?? null,
                                prodMgPerDay: raw.co2_production_mg_per_day ?? raw.co2_production?.value ?? null,
                                prodKgPerDay: (raw.co2_production_mg_per_day ?? raw.co2_production?.value ?? 0) / 1_000_000,
                                MAXCO2_use: raw.max_co2_use_mg_l ?? null
                              },
                              tan: {
                                effluentMgL: raw.tan_effluent_concentration_mg_l ?? raw.tan_effluent_concentration?.value ?? null,
                                prodMgPerDay: raw.tan_production_mg_per_day ?? raw.tan_production?.value ?? null,
                                prodKgPerDay: (raw.tan_production_mg_per_day ?? raw.tan_production?.value ?? 0) / 1_000_000,
                                MAXTAN_use: raw.max_tan_use_mg_l ?? null
                              }
                            };
                            console.log('✅ Mass Balance Data:', massBalanceData);
                          }
                        } catch (step6Err) {
                          console.warn('Step 6 API error:', step6Err);
                        }

                        // Call Stage 7 POST API
                        let stage7Data = null;
                        try {
                          console.log('📊 Calling Stage 7 POST API...');
                          const postResult = await postStage7Parameters(currentProjectId, stage7FormData);
                          if (postResult.status === 'success') {
                            stage7Data = postResult.data;
                            console.log('✅ Stage 7 POST Success:', stage7Data);
                          } else {
                            throw new Error(postResult.message || 'Stage 7 API call failed');
                          }
                        } catch (stage7Err) {
                          console.warn('Stage 7 API error:', stage7Err);
                          stage7Data = await getStage7Results(currentProjectId);
                        }

                        // Check if Stage 8 is selected
                        let stage8Data = null;
                        if (stage8Selected) {
                          try {
                            console.log('📊 Calling Stage 8 GET API...');
                            const stage8Results = await getStage8Results(currentProjectId);
                            if (stage8Results.status === 'success') {
                              stage8Data = stage8Results.data;
                              console.log('✅ Stage 8 Results:', stage8Data);
                            } else {
                              throw new Error(stage8Results.message || 'Stage 8 results API call failed');
                            }
                          } catch (stage8Err) {
                            console.warn('Stage 8 API error:', stage8Err);
                            stage8Data = await getStage8Results(currentProjectId);
                          }
                        }

                        // Set all report data
                        setAdvancedReport({
                          step6Results: step6Data,
                          massBalanceData: massBalanceData,
                          stage7Results: stage7Data,
                          stage8Results: stage8Data
                        });
                        setLimitingFactor(limitingFactor);
                        setStage7Report(stage7Data);
                        if (stage8Data) {
                          setStage8Report(stage8Data);
                        }
                        setShowStage7Inputs(false);
                        setIsAdvancedReportView(true);
                        
                      } catch (err) {
                        console.error('❌ Error in Stage 7 Calculation:', err);
                        console.error('❌ Error details:', err.message, err.stack);
                        setError(err.message);
                      } finally {
                        console.log('🏁 Stage 7 calculation process finished');
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Calculating...' : 'Calculate Advanced Report'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {renderCalculationTypeSelection()}
            {!showCalculationTypeSelection && showAdvancedLayout && (
              renderAdvancedLayout()
            )}
            {!showCalculationTypeSelection && !showAdvancedLayout && (
              <>
                <Stepper 
                  currentStep={step} 
                  type={calculationType === 'basic' ? 'basic' : 'advanced'} 
                />
                {(calculationType === 'basic' && step === 2) ? (
                  <CombinedInputsPage
                    formData={formData}
                    liveOutputs={liveOutputs}
                    handleInputChange={handleInputChange}
                    renderInputWithTooltip={renderInputWithTooltip}
                    loading={loading}
                    error={error}
                    onBack={handleCombinedInputsBack}
                    onCalculateMassBalance={handleCombinedInputsCalculate}
                  />
                ) : showCombinedInputs ? (
                  <CombinedInputsPage
                    formData={formData}
                    liveOutputs={liveOutputs}
                    handleInputChange={handleInputChange}
                    renderInputWithTooltip={renderInputWithTooltip}
                    loading={loading}
                    error={error}
                    onBack={handleCombinedInputsBack}
                    onCalculateMassBalance={handleCombinedInputsCalculate}
                  />
                ) : (
                  renderStep()
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreateDesignSystem;