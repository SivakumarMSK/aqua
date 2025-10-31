import React, { useEffect, useState } from 'react';
import { Card, Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllDesignSystems } from '../services/designSystemService.jsx';
import Toast from './Toast';
import './AllProjects.css';

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [basicProjects, setBasicProjects] = useState([]);
  const [advancedProjects, setAdvancedProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [filterType, setFilterType] = useState('basic'); // 'basic', 'advanced'
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectType = searchParams.get('type'); // 'basic', 'advanced', or null for all

  // Project classification function - use type field from API
  const classifyProject = (project) => {
    // Use the type field from the API response
    return project.type === 'advanced' ? 'advanced' : 'basic';
  };

  useEffect(() => {
    let mounted = true;

    const processDesigns = (designs) => {
      if (!mounted) return;

      // Remove duplicates based on design_id and name/project combination
      const uniqueDesigns = designs.reduce((acc, current) => {
        const exists = acc.find(item => 
          item.design_id === current.design_id || 
          (item.design_system_name === current.design_system_name && 
           item.project_name === current.project_name)
        );
        if (!exists) {
          return [...acc, current];
        }
        return acc;
      }, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Extract unique projects and classify them
      const uniqueProjects = uniqueDesigns
        .filter(design => design.projects && design.projects.length > 0)
        .reduce((acc, design) => {
          const project = design.projects[0];
          const exists = acc.find(p => 
            p.id === project.id || 
            (p.name === project.name && p.species_names === project.species_names)
          );
          if (!exists) {
            return [...acc, { 
              ...project, 
              design_system_name: design.design_system_name,
              design_system: design // Store reference to design for classification
            }];
          }
          return acc;
        }, []);

      // Classify projects into basic and advanced
      const basicProjectsList = [];
      const advancedProjectsList = [];

      uniqueProjects.forEach(project => {
        const projectType = classifyProject(project);
        if (projectType === 'basic') {
          basicProjectsList.push(project);
        } else {
          advancedProjectsList.push(project);
        }
      });

      setProjects(uniqueProjects);
      setBasicProjects(basicProjectsList);
      setAdvancedProjects(advancedProjectsList);
      setLoading(false);
    };

    const loadDesigns = async () => {
      try {
        setLoading(true);
        const designs = await getAllDesignSystems();
        
        if (!mounted) return;

        processDesigns(designs);
      } catch (err) {
        if (!mounted) return;
        
        console.error('Error fetching designs:', err);
        setToast({
          show: true,
          message: err.message,
          type: 'error'
        });
        setLoading(false);
      }
    };

    loadDesigns();
    
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Filter projects based on filter type
  useEffect(() => {
    if (filterType === 'basic') {
      setFilteredProjects(basicProjects);
    } else if (filterType === 'advanced') {
      setFilteredProjects(advancedProjects);
    }
  }, [filterType, basicProjects, advancedProjects]);

  // Initialize filter type based on URL parameter
  useEffect(() => {
    if (projectType === 'basic') {
      setFilterType('basic');
    } else if (projectType === 'advanced') {
      setFilterType('advanced');
    } else {
      setFilterType('basic'); // Default to basic when no URL parameter
    }
  }, [projectType]);

  // Handle basic project update - navigate to design system with pre-filled data
  const handleBasicProjectUpdate = (project) => {
    localStorage.setItem('updateProjectId', project.id);
    localStorage.setItem('updateProjectType', 'basic');
    localStorage.setItem('updateProjectName', project.name);
    localStorage.setItem('updateProjectSpecies', project.species_names || '');
    navigate('/design-systems/new?update=true&type=basic');
  };

  // Handle advanced project update - navigate to design system with pre-filled data
  const handleAdvancedProjectUpdate = (project) => {
    localStorage.setItem('updateProjectId', project.id);
    localStorage.setItem('updateProjectType', 'advanced');
    localStorage.setItem('updateProjectName', project.name);
    localStorage.setItem('updateProjectSpecies', project.species_names || '');
    navigate('/design-systems/new?update=true&type=advanced');
  };

  const handleProjectClick = async (project) => {
    // Determine project type
    const projectType = classifyProject(project);
    
    if (projectType === 'basic') {
      await handleBasicProjectClick(project);
    } else {
      await handleAdvancedProjectClick(project);
    }
  };

  // Handle basic project click - use production calculations API
  const handleBasicProjectClick = async (project) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`/backend/formulas/api/projects/${project.id}/production-calculations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch basic calculations: ${response.status}`);
      }

      const calcData = await response.json();
      console.log('Basic calculation API response:', calcData);

      // Map API response to our expected format
      const outputs = {
        oxygen: {
          bestInletMgL: calcData.o2_saturation_adjusted?.value || calcData.o2_saturation_adjusted_mg_l || 0,
          minSatPct: calcData.o2_saturation_adjusted?.value || calcData.o2_saturation_adjusted_mg_l || 0,
          saturationAdjustedMgL: calcData.o2_saturation_adjusted_mg_l || 0,
          MINDO_use: calcData.min_do_mg_l ?? calcData.min_do_use_mg_l ?? null,
          effluentMgL: calcData.oxygen_effluent_concentration?.value || calcData.oxygen_effluent_concentration_mg_l || 0,
          consMgPerDay: calcData.oxygen_consumption_production?.value || calcData.oxygen_consumption_production_mg_per_day || 0,
          consKgPerDay: (calcData.oxygen_consumption_production?.value || calcData.oxygen_consumption_production_mg_per_day || 0) / 1000000
        },
        tss: {
          effluentMgL: calcData.tss_effluent_concentration?.value || calcData.tss_effluent_concentration_mg_l || 0,
          prodMgPerDay: calcData.tss_production?.value || calcData.tss_production_mg || 0,
          prodKgPerDay: (calcData.tss_production?.value || calcData.tss_production_mg || 0) / 1000000,
          MAXTSS_use: calcData.max_tss_use_mg_l ?? null
        },
        co2: {
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

      // Try to fetch Stage 6 results (for Juvenile Stage 1 display in basic report)
      try {
        const step6Res = await fetch(`/backend/advanced/formulas/api/projects/${project.id}/step_6_results`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (step6Res.ok) {
          const step6Data = await step6Res.json();
          outputs.step6Results = step6Data;
        }
        // Fetch limiting factor (Stage 1) for basic report
        const lfRes = await fetch(`/backend/advanced/formulas/api/projects/${project.id}/limiting_factor`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (lfRes.ok) {
          const lfData = await lfRes.json();
          outputs.limitingFactor = lfData;
        }
      } catch (e) {
        // Non-blocking for basic flow
        console.warn('Stage 6 results not available for basic project:', e);
      }

      // Fetch real inputs using water quality GET API
      let inputs = {
        waterTemp: 25,
        salinity: 0,
        siteElevation: 0,
        minDO: 6,
        pH: 7,
        maxCO2: 10,
        maxTAN: 1,
        minTSS: 20,
        tankVolume: 100,
        numTanks: 1,
        targetFishWeight: 500,
        targetNumFish: 1000,
        feedRate: 2,
        feedProtein: 40,
        o2Absorption: 80,
        co2Removal: 70,
        tssRemoval: 80,
        tanRemoval: 60,
        targetSpecies: project.species_names || 'Tilapia'
      };

      try {
        const inputsResponse = await fetch(`/backend/new_design/api/projects/${project.id}/water-quality-parameters`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (inputsResponse.ok) {
          const inputsData = await inputsResponse.json();
          const p = inputsData.parameters || {};
          inputs = {
            waterTemp: p.temperature ?? 25,
            salinity: p.salinity ?? 0,
            siteElevation: p.elevation_m ?? 0,
            minDO: p.dissolved_O2_min ?? 6,
            ph: (p.ph ?? p.pH ?? 7),
            maxCO2: p.dissolved_CO2_max ?? 10,
            maxTAN: p.TAN_max ?? 1,
            minTSS: p.TSS_max ?? 20,
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
            targetSpecies: p.species || project.species_names || 'Tilapia',
            supplementPureO2: Boolean(p.supplement_pure_o2),
            alkalinity: p.alkalinity ?? 0,
            targetMinO2Saturation: p.target_min_o2_saturation ?? 0,
            productionTarget_t: p.production_target_t ?? 0,
            harvestFrequency: p.harvest_frequency ?? '',
            initialWeight: p.initial_weight_wi_g ?? 0,
            // Stage-wise parameters
            FCR_Stage1: p.fcr_stage1 ?? 0,
            FCR_Stage2: p.fcr_stage2 ?? 0,
            FCR_Stage3: p.fcr_stage3 ?? 0,
            FeedProtein_Stage1: p.feed_protein_stage1 ?? 0,
            FeedProtein_Stage2: p.feed_protein_stage2 ?? 0,
            FeedProtein_Stage3: p.feed_protein_stage3 ?? 0,
            Estimated_mortality_Stage1: p.estimated_mortality_stage1 ?? 0,
            Estimated_mortality_Stage2: p.estimated_mortality_stage2 ?? 0,
            Estimated_mortality_Stage3: p.estimated_mortality_stage3 ?? 0
          };
        }
      } catch (error) {
        console.warn('Failed to fetch water quality parameters:', error);
      }
      
      // Navigate to ProjectReport with the calculated results
      navigate('/project-reports/' + project.id, {
        state: {
          inputs: inputs,
          outputs: outputs,
          projectType: 'basic'
        }
      });
    } catch (err) {
      console.error('Error loading basic project:', err);
      setToast({
        show: true,
        message: 'Failed to load basic project calculations: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle advanced project click - use step6results, limiting factor, stage7, and stage8 APIs
  const handleAdvancedProjectClick = async (project) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Call all advanced APIs simultaneously
      const [step6Response, limitingFactorResponse, stage3Response, stage4Response, stage7Response, stage8Response] = await Promise.all([
        fetch(`/backend/advanced/formulas/api/projects/${project.id}/step_6_results`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${project.id}/limiting_factor`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${project.id}/step3`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${project.id}/step4`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${project.id}/step7`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${project.id}/step8`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      ]);

      // Handle Stage 6 and Limiting Factor (required)
      if (!step6Response.ok) {
        throw new Error(`Failed to fetch step6 results: ${step6Response.status}`);
      }
      if (!limitingFactorResponse.ok) {
        throw new Error(`Failed to fetch limiting factor: ${limitingFactorResponse.status}`);
      }

      let step6Data = await step6Response.json();
      const limitingFactorData = await limitingFactorResponse.json();
      
      console.log('Advanced step6 API response:', step6Data);
      console.log('Advanced limiting factor API response:', limitingFactorData);

      // Mass Balance: GET existing parameters and then GET production-calculations
      try {
        const paramsRes = await fetch(`/backend/new_design/api/projects/${project.id}/water-quality-parameters`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (!paramsRes.ok) {
          console.warn('Mass balance params GET non-blocking error (AllProjects):', paramsRes.status);
        }
        const mbRes = await fetch(`/backend/formulas/api/projects/${project.id}/production-calculations`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (mbRes.ok) {
          const raw = await mbRes.json();
          var massBalanceData = {
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
          // Attach to step6Data so downstream view can consume (no reassignment of const)
          if (step6Data && typeof step6Data === 'object') {
            step6Data.massBalanceData = massBalanceData;
          }
        }
      } catch (e) {
        console.warn('Mass balance (AllProjects view) non-blocking error:', e);
      }

      // Handle Stage 3 and Stage 4 (optional - may not exist for all projects)
      let stage3Data = null;
      let stage4Data = null;
      if (stage3Response.ok) {
        stage3Data = await stage3Response.json();
        console.log('Advanced stage3 API response:', stage3Data);
      } else {
        console.log('Stage 3 data not available for this project');
      }
      if (stage4Response.ok) {
        stage4Data = await stage4Response.json();
        console.log('Advanced stage4 API response:', stage4Data);
      } else {
        console.log('Stage 4 data not available for this project');
      }

      // Handle Stage 7 and Stage 8 (optional - may not exist for all projects)
      // IMPORTANT: Stage 8 should only be available if Stage 7 exists
      let stage7Data = null;
      let stage8Data = null;
      
      if (stage7Response.ok) {
        stage7Data = await stage7Response.json();
        console.log('Advanced stage7 API response:', stage7Data);
        if (stage8Response.ok) {
          stage8Data = await stage8Response.json();
          console.log('Advanced stage8 API response:', stage8Data);
        } else {
          console.log('Stage 8 data not available for this project');
        }
      } else {
        console.log('Stage 7 data not available for this project');
        // Explicitly ignore Stage 8 if Stage 7 is not available
        stage8Data = null;
      }

      // Build advancedReport and navigate into CreateDesignSystem renderer
      const advancedReport = {
        step6Results: step6Data,
        massBalanceData: (step6Data && step6Data.massBalanceData) ? step6Data.massBalanceData : null,
        stage3Results: stage3Data,
        stage4Results: stage4Data,
        stage7Results: stage7Data,
        stage8Results: stage8Data
      };

      // Fetch real inputs using water quality GET API
      let inputs = {
        waterTemp: 25,
        salinity: 0,
        siteElevation: 0,
        minDO: 6,
        pH: 7,
        maxCO2: 10,
        maxTAN: 1,
        minTSS: 20,
        tankVolume: 100,
        numTanks: 1,
        targetFishWeight: 500,
        targetNumFish: 1000,
        feedRate: 2,
        feedProtein: 40,
        o2Absorption: 80,
        co2Removal: 70,
        tssRemoval: 80,
        tanRemoval: 60,
        targetSpecies: project.species_names || 'Tilapia'
      };

      try {
        const inputsResponse = await fetch(`/backend/new_design/api/projects/${project.id}/water-quality-parameters`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (inputsResponse.ok) {
          const inputsData = await inputsResponse.json();
          const p = inputsData.parameters || {};
          inputs = {
            waterTemp: p.temperature ?? 25,
            salinity: p.salinity ?? 0,
            siteElevation: p.elevation_m ?? 0,
            minDO: p.dissolved_O2_min ?? 6,
            ph: p.pH ?? 7,
            maxCO2: p.dissolved_CO2_max ?? 10,
            maxTAN: p.TAN_max ?? 1,
            minTSS: p.TSS_max ?? 20,
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
            targetSpecies: p.species || project.species_names || 'Tilapia',
            supplementPureO2: Boolean(p.supplement_pure_o2),
            alkalinity: p.alkalinity ?? 0,
            targetMinO2Saturation: p.target_min_o2_saturation ?? 0,
            productionTarget_t: p.production_target_t ?? 0,
            harvestFrequency: p.harvest_frequency ?? '',
            initialWeight: p.initial_weight_wi_g ?? 0,
            // Stage 7 specific fields
            mbbrLocation: p.mbbr_location ?? 'Inside tank',
            mediaToWaterVolumeRatio: p.media_to_water_volume_ratio ?? 0.1,
            volumetricNitrificationRateVtr: p.volumetric_nitrification_rate_vtr ?? 0.5,
            standaloneHeightDiameterRatio: p.standalone_height_diameter_ratio ?? 2.0,
            pumpStopOverflowVolume: p.pump_stop_overflow_volume ?? 0.1,
            // Stage 4 tank design fields (also part of Stage 7 parameters)
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
        }
      } catch (error) {
        console.warn('Failed to fetch water quality parameters:', error);
      }

      // Navigate to ProjectReport with the calculated results (same as basic projects)
      navigate('/project-reports/' + project.id, {
        state: {
          inputs: inputs,
          outputs: {
            step6Results: step6Data,
            limitingFactor: limitingFactorData,
            stage3Results: stage3Data,
            stage4Results: stage4Data,
            stage7Results: stage7Data,
            stage8Results: stage8Data,
            massBalanceData: (step6Data && step6Data.massBalanceData) ? step6Data.massBalanceData : null
          },
          projectType: 'advanced',
          advancedInputs: inputs,
          stage7Inputs: inputs
        }
      });
    } catch (err) {
      console.error('Error loading advanced project:', err);
      setToast({
        show: true,
        message: 'Failed to load advanced project calculations: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }


  return (
    <div className="all-projects-container">
      <Container>
        <div className="header-section">
          <div className="back-button-container">
            <button 
              className="btn btn-outline-primary rounded-circle back-button"
              onClick={() => navigate('/dashboard')}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
          </div>
          <h1 className="d-flex align-items-center justify-content-center gap-2">
            <i className={`bi ${!projectType ? 'bi-briefcase' : (filterType === 'basic' ? 'bi-layers text-primary' : 'bi-gear-wide-connected text-success')}`}></i>
            <span>{filterType === 'basic' ? 'Basic Projects' : 'Advanced Projects'}</span>
          </h1>
          <p className="text-muted">
            {filterType === 'basic' ? 'Browse and manage your basic projects' : 'Browse and manage your advanced projects'}
          </p>
        </div>
        
        {/* Project Type Filter Buttons - Only show when not coming from specific project type pages */}
        {!projectType && (
          <div className="project-type-buttons d-flex gap-2 mb-3">
            <button
              onClick={() => setFilterType('basic')}
              className={`project-filter-btn ${filterType === 'basic' ? 'active' : 'inactive'}`}
            >
              Basic Projects
            </button>
            <button
              onClick={() => setFilterType('advanced')}
              className={`project-filter-btn ${filterType === 'advanced' ? 'active' : 'inactive'}`}
            >
              Advanced Projects
            </button>
          </div>
        )}
        
        <div className="projects-grid">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-5">
              <i className={`bi ${filterType === 'basic' ? 'bi-gear' : 'bi-cpu'} text-muted mb-3`} style={{fontSize: '3rem'}}></i>
              <h4>
                {filterType === 'basic' ? 'No Basic Projects Found' : 'No Advanced Projects Found'}
              </h4>
              <p className="text-muted">
                {filterType === 'basic' ? 'No basic projects found.' : 'No advanced projects found.'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const projectType = classifyProject(project, project.design_system);
              return (
                <Card 
                  key={project.id}
                  className={`project-card ${projectType === 'basic' ? 'basic-project-card' : 'advanced-project-card'}`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-2 d-flex align-items-center gap-2">
                          <i className={`bi ${projectType === 'basic' ? 'bi-folder2-open text-primary' : 'bi-folder text-success'}`}></i>
                          <span>{project.name}</span>
                        </h5>
                        <div className="project-details">
                          <div className="kv-row">
                            <span className="kv-key text-muted">Species</span>
                            <span className="kv-value species-names">{project.species_names || 'N/A'}</span>
                          </div>
                          <div className="kv-row">
                            <span className="kv-key text-muted">Type</span>
                            <span className="kv-value">
                              <span className={`badge ${projectType === 'basic' ? 'bg-primary' : 'bg-success'}`}>
                                {projectType === 'basic' ? 'Basic' : 'Advanced'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-cta-br">
                      <span 
                        className="eye-btn" 
                        title={`View ${projectType} project details`} 
                        aria-label={`View ${projectType} project details`} 
                        onClick={() => handleProjectClick(project)}
                      >
                        <i className="bi bi-eye"></i>
                      </span>
                      <span 
                        className="update-btn" 
                        title={`Update ${projectType} project`} 
                        aria-label={`Update ${projectType} project`} 
                        onClick={() => projectType === 'basic' ? handleBasicProjectUpdate(project) : handleAdvancedProjectUpdate(project)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          )}
        </div>
      </Container>
      {/* Temporarily disable Toast to test corner alert issue */}
      {toast.show && (
        <Toast 
          show={toast.show} 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default AllProjects;