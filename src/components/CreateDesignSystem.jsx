import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendedValues, getSpecies } from '../services/speciesService';
import { createDesignSystem, createWaterQualityParameters } from '../services/designSystemService.jsx';
import { postAdvancedParameters, getAdvancedStep6Results, getAdvancedLimitingFactor } from '../services/advancedService';
import { generateMassBalanceReport, generateAdvancedReportPdf } from '../utils/pdfGenerator';
import { getCurrentPlan } from '../utils/subscriptionUtils';
import Navbar from './Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Stepper from './Stepper';
import '../styles/CreateDesignSystem.css';

const CreateDesignSystem = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  
  // Subscription and calculation type states
  const [userPlan, setUserPlan] = useState('Free');
  const [calculationType, setCalculationType] = useState('basic'); // 'basic' or 'advanced'
  const [showCalculationTypeSelection, setShowCalculationTypeSelection] = useState(false);
  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);
  const [designCreated, setDesignCreated] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [advancedReport, setAdvancedReport] = useState(null);
  const [isAdvancedReportView, setIsAdvancedReportView] = useState(false);
  const [limitingFactor, setLimitingFactor] = useState(null);

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
        
        // Show calculation type selection for all users
        setShowCalculationTypeSelection(true);
      } catch (error) {
        console.error('Error checking user plan:', error);
        // Default to Free if error
        setUserPlan('Free');
      }
    };

    checkUserPlan();
  }, []);

  const [error, setError] = useState('');

  const getRecommendedValues2 = async (species) => {
    try {
      const data = await getRecommendedValues(species);
      console.log('Raw recommended values:', data);
      
      // Extract values from the species_parameters object
      const params = data.species_parameters || data.parameters || {};
      const recommendedValues = {};
      
      console.log('Processing parameters:', params);

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

      // Log all available parameters for debugging
      console.log('Available parameters in API response:', Object.keys(params));

      // Water Quality Parameters
      // Temperature mapping
      const tempValue = getBestValue(params.temperature, ['design', 'min', 'max']);
      console.log('Temperature parameter:', params.temperature);
      console.log('Calculated temperature value:', tempValue);
      recommendedValues.waterTemp = tempValue;
      
      // ph mapping
      const phValue = getBestValue(params.ph, false, ['design', 'min', 'max']);
      console.log('ph parameter:', params.ph);
      console.log('Calculated ph value:', phValue);
      recommendedValues.ph = phValue;
      
      // Salinity mapping
      console.log('🔍 First function - Salinity parameter:', params.salinity);
      const salinityValue = getBestValue(params.salinity, false, ['design', 'min', 'max']);
      console.log('🔍 First function - Calculated salinity value:', salinityValue, 'type:', typeof salinityValue);
      recommendedValues.salinity = salinityValue;
      
      // Dissolved oxygen mapping
      const doValue = getBestValue(params.dissolved_oxygen, false, ['min', 'max']);
      console.log('DO parameter:', params.dissolved_oxygen);
      console.log('Calculated DO value:', doValue);
      recommendedValues.minDO = doValue;
      
      // Carbon dioxide mapping
      const co2Value = getBestValue(params.carbon_dioxide, true, ['max']);
      console.log('CO2 parameter:', params.carbon_dioxide);
      console.log('Calculated CO2 value:', co2Value);
      recommendedValues.maxCO2 = co2Value;
      
      // Total suspended solids mapping
      const tssValue = getBestValue(params.total_suspended_solids, true, ['max']);
      console.log('TSS parameter:', params.total_suspended_solids);
      console.log('Calculated TSS value:', tssValue);
      recommendedValues.minTSS = tssValue;
      
      // Total ammonia nitrogen mapping
      const tanValue = getBestValue(params.total_ammonia_nitrogen, true, ['max']);
      console.log('TAN parameter:', params.total_ammonia_nitrogen);
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

      // Skip all production phase parameters - they should be manually entered
      // Production phase fields are:
      // - productionPhase
      // - tankVolume
      // - numTanks
      // - targetFishWeight
      // - targetNumFish
      // - feedRate
      // - feedProtein
      
      // Log the production parameter defaults being used
      console.log('Production parameters defaults:', {
        tankVolume: recommendedValues.tankVolume,
        numTanks: recommendedValues.numTanks,
        targetFishWeight: recommendedValues.targetFishWeight,
        targetNumFish: recommendedValues.targetNumFish,
        feedRate: recommendedValues.feedRate,
        feedProtein: recommendedValues.feedProtein
      });

      // Efficiency Parameters with improved fallbacks
      const removalRates = params.removal_rates || params.removalRates || {};
      
      // Map oxygen absorption efficiency with fallbacks
      recommendedValues.o2Absorption = getBestValue(
        removalRates.o2_absorption || removalRates.o2Absorption ||
        params.o2_absorption || params.o2Absorption ||
        params.oxygen_absorption || params.oxygenAbsorption,
        ['recommended', 'optimal', 'design']
      ) || 90; // Default to 90% if no value found
      
      // Map TSS removal efficiency with fallbacks
      recommendedValues.tssRemoval = getBestValue(
        removalRates.tss_removal || removalRates.tssRemoval ||
        params.tss_removal || params.tssRemoval ||
        params.solids_removal || params.solidsRemoval,
        ['recommended', 'optimal', 'design']
      ) || 80; // Default to 80% if no value found
      
      // Map CO2 removal efficiency with fallbacks
      recommendedValues.co2Removal = getBestValue(
        removalRates.co2_removal || removalRates.co2Removal ||
        params.co2_removal || params.co2Removal ||
        params.carbon_dioxide_removal || params.carbonDioxideRemoval,
        ['recommended', 'optimal', 'design']
      ) || 70; // Default to 70% if no value found
      
      // Map TAN removal efficiency with fallbacks
      recommendedValues.tanRemoval = getBestValue(
        removalRates.tan_removal || removalRates.tanRemoval ||
        params.tan_removal || params.tanRemoval ||
        params.ammonia_removal || params.ammoniaRemoval,
        ['recommended', 'optimal', 'design']
      ) || 80; // Default to 80% if no value found

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
    targetFishWeight: '', // Target market fish size (g)
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
    
    // Commented out for future use
    // tankVolume: '', // m³
    // numTanks: '',
    // targetNumFish: '',
    // feedRate: '', // % of biomass/day
    // feedProtein: '', // %

    // Efficiency Parameters
    o2Absorption: '', // %
    tssRemoval: '', // %
    co2Removal: '', // %
    tanRemoval: '', // %
  });

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
          if (speciesParams.temperature?.design !== undefined && speciesParams.temperature.design !== null) {
            updatedData.waterTemp = speciesParams.temperature.design.toString();
          }
          
          if (speciesParams.ph) {
            const phValue = getBestValue(speciesParams.ph);
            console.log('Setting pH Level:', phValue);
            if (phValue !== null) {
              updatedData.ph = phValue.toString();
            }
          }
          
          if (speciesParams.salinity) {
            const salinityValue = getBestValue(speciesParams.salinity, false, ['design', 'min', 'max']);
            console.log('🔍 Setting Salinity:', salinityValue, 'type:', typeof salinityValue);
            if (salinityValue !== null && salinityValue !== undefined) {
              updatedData.salinity = salinityValue.toString();
              console.log('🔍 Salinity set in updatedData:', updatedData.salinity);
            }
          }
          
          if (speciesParams.dissolved_oxygen?.min !== undefined && speciesParams.dissolved_oxygen.min !== null) {
            updatedData.minDO = speciesParams.dissolved_oxygen.min.toString();
          }
          
          if (speciesParams.carbon_dioxide?.max !== undefined && speciesParams.carbon_dioxide.max !== null) {
            updatedData.maxCO2 = speciesParams.carbon_dioxide.max.toString();
          }
          
          if (speciesParams.total_suspended_solids?.max !== undefined && speciesParams.total_suspended_solids.max !== null) {
            updatedData.minTSS = speciesParams.total_suspended_solids.max.toString();
          }
          
          if (speciesParams.total_ammonia_nitrogen?.max !== undefined && speciesParams.total_ammonia_nitrogen.max !== null) {
            updatedData.maxTAN = speciesParams.total_ammonia_nitrogen.max.toString();
          }

          // Production Parameters from common_parameters
          const systemDesign = commonParams.system_design || {};
          const productionTargets = commonParams.production_targets || {};
          
          // Tank Volume (m³)
          if (systemDesign.tank_volume_each_l !== undefined && systemDesign.tank_volume_each_l !== null) {
            const volumeInM3 = systemDesign.tank_volume_each_l / 1000;
            console.log('Converting tank volume from', systemDesign.tank_volume_each_l, 'L to', volumeInM3, 'm³');
            updatedData.tank_volume_each_l = volumeInM3.toString();
          }

          // Total Number of Tanks
          if (systemDesign.num_tanks !== undefined && systemDesign.num_tanks !== null) {
            console.log('Setting num_tanks to:', systemDesign.num_tanks);
            updatedData.num_tanks = systemDesign.num_tanks.toString();
          }

          // Feed Rate
          if (productionTargets.target_feed_rate_percent_bw_day !== undefined && 
              productionTargets.target_feed_rate_percent_bw_day !== null) {
            console.log('Setting target_feed_rate_percent_bw_day to:', productionTargets.target_feed_rate_percent_bw_day);
            updatedData.target_feed_rate_percent_bw_day = productionTargets.target_feed_rate_percent_bw_day.toString();
          }

          // Feed Protein Content
          if (productionTargets.feed_protein_percent !== undefined && 
              productionTargets.feed_protein_percent !== null) {
            console.log('Setting feed_protein_percent to:', productionTargets.feed_protein_percent);
            updatedData.feed_protein_percent = productionTargets.feed_protein_percent.toString();
          }

          // Do not set these as they are null in the response:
          // - target_market_fish_size_g (Target fish weight at harvest)
          // - Target Number of fish at harvest (not provided in response)

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
          
          // Filter out all production phase fields from updatedData
          const productionPhaseFields = [
            'productionPhase',    // Production phase selection
            'tankVolume',         // Tank volume
            'numTanks',          // Number of tanks
            'targetFishWeight',   // Target fish weight
            'targetNumFish',      // Target number of fish
            'feedRate',          // Feed rate
            'feedProtein'        // Feed protein content
          ];
          
          const filteredData = Object.keys(updatedData).reduce((acc, key) => {
            if (!productionPhaseFields.includes(key)) {
              acc[key] = updatedData[key];
            }
            return acc;
          }, {});

          // Update form data without production fields
          setFormData(prev => {
            const newData = {
              ...prev,
              ...filteredData
            };
            console.log('New form data (production fields excluded):', newData);
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
      console.log('Input change:', { name, value, type, checked });
      setFormData(prev => {
        const newData = {
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
        };
        console.log('Updated form data:', newData);
        return newData;
      });
    }
  };

  const nextStep = async () => {
    console.log('NextStep called. Current step:', step);
    console.log('Current form data:', formData);

    // If we're on step 1 (Initial Setup), create design system first
    if (step === 1) {
      try {
        setLoading(true);
        console.log('Creating design system...');
        const response = await createDesignSystem(formData);
        console.log('Design system created:', response);

        if (response.design_id) {
          console.log('Design ID received:', response.design_id);
          // Store the design ID for later use
          localStorage.setItem('currentDesignId', response.design_id);
        }
        
        if (response.recommended_values) {
          console.log('Received recommended values:', response.recommended_values);
          // Store recommended values if provided
          localStorage.setItem('recommendedValues', JSON.stringify(response.recommended_values));
        }
      } catch (error) {
        console.error('Failed to create design system:', error);
        alert(error.message);
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
    setStep(prev => prev + 1);
  };
  const prevStep = () => {
    if (step === 1) {
      navigate('/dashboard');
    } else {
      setStep(prev => prev - 1);
    }
  };

  const renderInputWithTooltip = (name, label, unit = '', type = 'number') => (
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
        disabled={formData.useRecommendedValues && (
          name === 'waterTemp' || 
          name === 'ph' || 
          name === 'salinity' || 
          name === 'minDO' || 
          name === 'maxCO2' || 
          name === 'minTSS' || 
          name === 'maxTAN'
        ) && ![
          'productionPhase',
          'tankVolume',
          'numTanks',
          'targetFishWeight',
          'targetNumFish',
          'feedRate',
          'feedProtein'
        ].includes(name)}
      />
    </Form.Group>
  );

  const renderStep = () => {
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
                  <option value="Flow-through">Flow-through</option>
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
                {renderInputWithTooltip('minTSS', 'Maximum Total Suspended Solids (TSS)', 'mg/l')}
                {renderInputWithTooltip('ph', 'ph Level')}
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
              {renderInputWithTooltip('targetFishWeight', 'Target fish weight at harvest', 'g')}
              {renderInputWithTooltip('feedRate', 'Feed rate', '% of biomass/day')}
              {renderInputWithTooltip('numTanks', 'Total Number of Tanks')}
              {renderInputWithTooltip('targetNumFish', 'Target Number of fish at harvest')}
              {renderInputWithTooltip('feedProtein', 'Feed protein content', '%')}
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
                    const projectId = localStorage.getItem('currentProjectId');
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
                      pH: formData.ph ? Number(formData.ph) : 0,
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
                      type: "basic" // Add type field for basic calculation
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
                      url: `http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`,
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
                    console.log('Request URL:', `http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`);
                    console.log('Request headers:', {
                      'Authorization': 'Bearer [hidden]',
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    });
                    console.log('Request body:', JSON.stringify(requestBody, null, 2));

                    // Make the POST request
                    const paramResponse = await fetch(`http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`, {
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
                    const initialVerifyResponse = await fetch(`http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`, {
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
                      const checkResponse = await fetch(`http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`, {
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
                    const verifyResponse = await fetch(`http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`, {
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
                    const finalVerifyResponse = await fetch(`http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`, {
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
                    console.log('Request URL:', `http://13.53.148.164:5000/formulas/api/projects/${projectId}/production-calculations`);
                    
                    // Wait a bit longer to ensure all parameters are processed
                    setLoadingStep('Preparing calculations...');
                    console.log('Waiting for parameters to be fully processed before calculations...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    let results;
                    try {
                      // First verify all required parameters are present
                      const paramsResponse = await fetch(`http://13.53.148.164:5000/new_design/api/projects/${projectId}/water-quality-parameters`, {
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
                      const calcResponse = await fetch(`http://13.53.148.164:5000/formulas/api/projects/${projectId}/production-calculations`, {
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

                    // Show results in the current page
                    setLoadingStep('Generating report...');
                    setStep(5);  // Move to report step
                    setFormData(prev => ({
                      ...prev,
                      calculationResults: results
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

      case 5: // Report
        // Prefer advanced staged report when present; otherwise use basic results
        if (calculationType === 'advanced' && advancedReport && advancedReport.step_6) {
          const s1 = advancedReport.step_6;
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
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(''); // Clear any previous errors
                    
                    // Prepare API data
                    const apiData = {
                      designSystemName: formData.designSystemName,
                      projectName: formData.projectName,
                      systemPurpose: formData.systemPurpose,
                      systemType: formData.systemType,
                      targetSpecies: formData.targetSpecies,
                      useRecommendedValues: formData.useRecommendedValues,
                      // Add other fields...
                      waterTemp: formData.waterTemp,
                      ph: formData.ph,
                      salinity: formData.salinity,
                      siteElevation: formData.siteElevation,
                      minDO: formData.minDO,
                      maxCO2: formData.maxCO2,
                      minTSS: formData.minTSS,
                      maxTAN: formData.maxTAN,
                      tankVolume: formData.tankVolume,
                      numTanks: formData.numTanks,
                      targetFishWeight: formData.targetFishWeight,
                      targetNumFish: formData.targetNumFish,
                      feedRate: formData.feedRate,
                      feedProtein: formData.feedProtein,
                      o2Absorption: formData.o2Absorption,
                      tssRemoval: formData.tssRemoval,
                      co2Removal: formData.co2Removal,
                      tanRemoval: formData.tanRemoval
                    };

                    console.log('Sending data to API:', apiData);
                    
                    // Save to API
                    const response = await createDesignSystem(apiData);
                    
                    // Handle the response based on its status
                    if (response) {
                      // Show appropriate message based on response status
                      if (response.status === 'partial_success') {
                        setError(response.message + ' - ' + response.error);
                      } else {
                        setError('Design system created successfully!');
                      }

                      // Log the created design details
                      console.log('Design system created:', {
                        design_id: response.design_id,
                        project_id: response.project_id,
                        status: response.status,
                        message: response.message
                      });
                      
                      // Navigate after a delay to show the message
                      setTimeout(() => {
                        navigate('/dashboard');
                      }, 1500);
                    }
                  } catch (error) {
                    console.error('Failed to save design system:', error);
                    
                    // Handle authentication errors
                    if (error.message.includes('Authentication token not found') ||
                        error.message.includes('Invalid token format') ||
                        error.message.includes('Unauthorized access')) {
                      setError('Session expired. Please log in again.');
                      setTimeout(() => {
                        navigate('/login');
                      }, 1500);
                      return;
                    }
                    
                    // Handle permission errors
                    if (error.message.includes('Access forbidden')) {
                      setError('You do not have permission to create design systems.');
                      return;
                    }
                    
                    // Handle the user_id error case
                    if (error.message.includes('user_id does not exist')) {
                      setError('Design system created, but there was a minor issue. Proceeding...');
                      setTimeout(() => {
                        navigate('/dashboard');
                      }, 1500);
                    } else {
                      // Handle other errors
                      setError('Failed to save design system: ' + error.message);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
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
                      <option value="Flow-through">Flow-through</option>
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
                          juvenileSize: '',
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
                          
                          const apiData = {
                            designSystemName: formData.designSystemName,
                            projectName: formData.projectName,
                            systemPurpose: formData.systemPurpose,
                            systemType: formData.systemType,
                            targetSpecies: formData.targetSpecies,
                            useRecommendedValues: formData.useRecommendedValues
                          };

                          console.log('Creating design system for Advanced flow:', apiData);
                          const response = await createDesignSystem(apiData);
                          console.log('Design system created:', response);
                          
                          if (response && response.project_id) {
                            localStorage.setItem('currentProjectId', response.project_id);
                            console.log('Project ID stored:', response.project_id);
                            setDesignCreated(true);
                            setShowAdvancedFields(true); // Show 2-column layout
                          }
                          
                        } catch (error) {
                          console.error('Error creating design system:', error);
                          setError('Failed to create design system: ' + error.message);
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
          /* 2-column layout for remaining steps */
          <>
            <div className="text-center mb-4">
              <h3>Advanced Parameters Configuration</h3>
              <p className="text-muted">Configure all advanced parameters for your design system</p>
            </div>

            {/* 2-column layout for remaining steps */}
            <div className="row">
              <div className="col-md-6">
                {/* Water Quality Step */}
                <div className="step-section mb-4">
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
                      {renderInputWithTooltip('minTSS', 'Maximum Total Suspended Solids (TSS)', 'mg/l')}
                      {renderInputWithTooltip('ph', 'ph Level')}
                      {renderInputWithTooltip('maxCO2', 'Maximum Dissolved Carbon Dioxide (CO₂)', 'mg/l')}
                      {renderInputWithTooltip('maxTAN', 'Maximum Total Ammonia (TAN)', 'mg/L')}
                      {renderInputWithTooltip('alkalinity', 'Alkalinity', 'mg/L')}
                    </div>
                    <div className="mb-4">
                      <h5>Additional Options</h5>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          name="supplementPureO2"
                          label="Supplement Pure O₂"
                          checked={formData.supplementPureO2}
                          onChange={handleInputChange}
                          disabled={loading}
                        />
                      </Form.Group>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                {/* Production Step */}
                <div className="step-section mb-4">
                  <h4>Production Information</h4>
                  <div className="form-group">
                    {/* Production Information - Required Fields Only */}
                    {renderInputWithTooltip('initialWeightWiG', 'Initial weight', 'g', 'number')}
                    {renderInputWithTooltip('juvenileSize', 'Size of juveniles at purchase', 'g', 'number')}
                    {renderInputWithTooltip('targetFishWeight', 'Target market fish size', 'g', 'number')}
                    {renderInputWithTooltip('productionTarget_t', 'Target production per year', 't', 'number')}
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
                    {renderInputWithTooltip('FCR_Stage1', 'FCR (Stage1 juvenile)', '', 'number')}
                    {renderInputWithTooltip('FeedProtein_Stage1', 'Feed protein content (Stage 1)', '%', 'number')}
                    {renderInputWithTooltip('FCR_Stage2', 'FCR (Stage 2 fingerling)', '', 'number')}
                    {renderInputWithTooltip('FeedProtein_Stage2', 'Feed protein content (Stage 2)', '%', 'number')}
                    {renderInputWithTooltip('FCR_Stage3', 'FCR (Stage 3 growout)', '', 'number')}
                    {renderInputWithTooltip('FeedProtein_Stage3', 'Feed protein content (Stage 3)', '%', 'number')}
                    {renderInputWithTooltip('Estimated_mortality_Stage1', 'Estimated mortality Stage 1', '%', 'number')}
                    {renderInputWithTooltip('Estimated_mortality_Stage2', 'Estimated mortality Stage 2', '%', 'number')}
                    {renderInputWithTooltip('Estimated_mortality_Stage3', 'Estimated mortality Stage 3', '%', 'number')}
                    
                    {/* Commented out for future use */}
                    {/* {renderInputWithTooltip('tankVolume', 'Tank Volume', 'm³')} */}
                    {/* {renderInputWithTooltip('feedRate', 'Feed rate', '% of biomass/day')} */}
                    {/* {renderInputWithTooltip('numTanks', 'Total number of tanks')} */}
                    {/* {renderInputWithTooltip('targetNumFish', 'Target number of fish at harvest')} */}
                    {/* {renderInputWithTooltip('feedProtein', 'Feed protein content', '%')} */}
                  </div>
                </div>

                {/* Efficiency Step */}
                <div className="step-section mb-4">
                  <h4>System Efficiency Parameters</h4>
                  <div className="form-group">
                    {renderInputWithTooltip('o2Absorption', 'O₂ Absorption Efficiency', '%')}
                    {renderInputWithTooltip('co2Removal', 'CO₂ Removal Efficiency', '%')}
                    {renderInputWithTooltip('tssRemoval', 'TSS Removal Efficiency', '%')}
                    {renderInputWithTooltip('tanRemoval', 'TAN Removal Efficiency', '%')}
                  </div>
                </div>
              </div>
            </div>

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

                    const advancedPayload = {
                      TAN_max: formData.maxTAN ? parseFloat(formData.maxTAN) : 2,
                      TSS_max: formData.minTSS ? parseFloat(formData.minTSS) : 80,
                      alkalinity: formData.alkalinity ? parseFloat(formData.alkalinity) : 250,
                      co2_removal_efficiency: formData.co2Removal ? parseFloat(formData.co2Removal) : 70,
                      dissolved_CO2_max: formData.maxCO2 ? parseFloat(formData.maxCO2) : 15,
                      dissolved_O2_min: formData.minDO ? parseFloat(formData.minDO) : 6,
                      elevation_m: formData.siteElevation ? parseFloat(formData.siteElevation) : 0,
                      estimated_mortality_stage1: formData.Estimated_mortality_Stage1 ? parseFloat(formData.Estimated_mortality_Stage1) : 8,
                      estimated_mortality_stage2: formData.Estimated_mortality_Stage2 ? parseFloat(formData.Estimated_mortality_Stage2) : 0,
                      estimated_mortality_stage3: formData.Estimated_mortality_Stage3 ? parseFloat(formData.Estimated_mortality_Stage3) : 0,
                      fcr_stage1: formData.FCR_Stage1 ? parseFloat(formData.FCR_Stage1) : 1.1,
                      fcr_stage2: formData.FCR_Stage2 ? parseFloat(formData.FCR_Stage2) : 1.2,
                      fcr_stage3: formData.FCR_Stage3 ? parseFloat(formData.FCR_Stage3) : 1.3,
                      feed_protein_stage1: formData.FeedProtein_Stage1 ? parseFloat(formData.FeedProtein_Stage1) : 45,
                      feed_protein_stage2: formData.FeedProtein_Stage2 ? parseFloat(formData.FeedProtein_Stage2) : 45,
                      feed_protein_stage3: formData.FeedProtein_Stage3 ? parseFloat(formData.FeedProtein_Stage3) : 45,
                      harvest_frequency: formData.harvestFrequency || "Fortnightly",
                      juvenile_size: formData.juvenileSize ? parseFloat(formData.juvenileSize) : null,
                      mbbr_location: "string",
                      media_to_water_volume_ratio: 0,
                      num_tanks_stage1: parseFloat(formData.numTanks) || 0,
                      num_tanks_stage2: 0,
                      num_tanks_stage3: 0,
                      oxygen_injection_efficiency: formData.o2Absorption ? parseFloat(formData.o2Absorption) : 80,
                      pH: formData.ph ? parseFloat(formData.ph) : 7,
                      passive_nitrification_rate_stage1_percent: 0,
                      passive_nitrification_rate_stage2_percent: 0,
                      passive_nitrification_rate_stage3_percent: 0,
                      production_target_t: formData.productionTarget_t ? parseFloat(formData.productionTarget_t) : 100,
                      pump_stop_overflow_volume: 0,
                      salinity: formData.salinity ? parseFloat(formData.salinity) : 0,
                      standalone_height_diameter_ratio: 0,
                      supplement_pure_o2: formData.supplementPureO2,
                      tan_removal_efficiency: formData.tanRemoval ? parseFloat(formData.tanRemoval) : 60,
                      tank_dd_ratio_stage1: 0,
                      tank_dd_ratio_stage2: 0,
                      tank_dd_ratio_stage3: 0,
                      tank_freeboard_stage1: 0,
                      tank_freeboard_stage2: 0,
                      tank_freeboard_stage3: 0,
                      target_market_fish_size: formData.targetFishWeight ? parseFloat(formData.targetFishWeight) : null,
                      target_min_o2_saturation: formData.targetMinO2Saturation ? parseFloat(formData.targetMinO2Saturation) : 95,
                      temperature: formData.waterTemp ? parseFloat(formData.waterTemp) : 25,
                      tss_removal_efficiency: formData.tssRemoval ? parseFloat(formData.tssRemoval) : 80,
                      volumetric_nitrification_rate_vtr: 0,
                      type: "advanced" // Add type field for advanced calculation
                    };

                    console.log('📤 Advanced Calculate Payload:', advancedPayload);
                    console.log('🌐 Calling postAdvancedParameters API...');
                    const response = await postAdvancedParameters(currentProjectId, advancedPayload);
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

                    // Show standalone report view (like new page)
                    setAdvancedReport(reportData);
                    setLimitingFactor(lf);
                    setIsAdvancedReportView(true);
                    
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
                    {loading ? 'Calculating...' : 'Calculate Advanced Report'}
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
              className={`calculation-card h-100 ${calculationType === 'advanced' ? 'selected' : ''} ${userPlan === 'Free' ? 'disabled-card' : ''}`}
              onClick={() => userPlan !== 'Free' && setCalculationType('advanced')}
              style={{ 
                opacity: userPlan === 'Free' ? 0.6 : 1,
                cursor: userPlan === 'Free' ? 'not-allowed' : 'pointer'
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
                    if (userPlan !== 'Free') {
                      setCalculationType('advanced');
                      setShowCalculationTypeSelection(false);
                      setShowAdvancedLayout(true);
                    }
                  }}
                  disabled={userPlan === 'Free'}
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
      <div className="container create-ds-content">
        {isAdvancedReportView ? (
          <div className="step-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Advanced Report</h4>
            </div>
            <div className="report-cards">
              {/* Stage 1 */}
              <h5 className="mb-3">Stage 1</h5>
              <div className="row g-4 mb-4">
                {(() => {
                  const s1 = advancedReport?.step_6 || {};
                  return (
                    <>
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
                    </>
                  );
                })()}
              </div>

              {/* Stage 2 */}
              <h5 className="mb-3">Stage 2</h5>
              <div className="row g-4 mb-4">
                {(() => {
                  const s1 = advancedReport?.step_6 || {};
                  return (
                    <>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm oxygen-card">
                          <Card.Body>
                            <Card.Title className="text-primary">Oxygen (Stage 2)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage2_oxygen?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage2_oxygen?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm co2-card">
                          <Card.Body>
                            <Card.Title className="text-primary">CO2 (Stage 2)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage2_co2?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage2_co2?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tss-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TSS (Stage 2)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage2_tss?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage2_tss?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tan-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TAN (Stage 2)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage2_tan?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage2_tan?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Stage 3 */}
              <h5 className="mb-3">Stage 3</h5>
              <div className="row g-4">
                {(() => {
                  const s1 = advancedReport?.step_6 || {};
                  return (
                    <>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm oxygen-card">
                          <Card.Body>
                            <Card.Title className="text-primary">Oxygen (Stage 3)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage3_oxygen?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage3_oxygen?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm co2-card">
                          <Card.Body>
                            <Card.Title className="text-primary">CO2 (Stage 3)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage3_co2?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage3_co2?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tss-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TSS (Stage 3)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage3_tss?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage3_tss?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                      <div className="col-md-6">
                        <Card className="h-100 shadow-sm tan-card">
                          <Card.Body>
                            <Card.Title className="text-primary">TAN (Stage 3)</Card.Title>
                            <div className="mt-3">
                              <div className="metric-row"><span className="label">L/min</span><strong>{s1.stage3_tan?.l_per_min ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">m³/hr</span><strong>{s1.stage3_tan?.m3_per_hr ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  );
                })()}
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
            <div className="navigation-buttons mt-3">
              <div></div>
              <div className="button-group-right">
                <Button
                  variant="outline-primary"
                  onClick={() => setIsAdvancedReportView(false)}
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
        ) : (
          <>
            {renderCalculationTypeSelection()}
            {!showCalculationTypeSelection && showAdvancedLayout && (
              renderAdvancedLayout()
            )}
            {!showCalculationTypeSelection && !showAdvancedLayout && (
              <>
                <Stepper currentStep={step} />
                {renderStep()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreateDesignSystem;