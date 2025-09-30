import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useNavigate } from 'react-router-dom';
import { getAllDesignSystems } from '../services/designSystemService.jsx';
import { getProjectById, calculateMassBalance } from '../services/projectService';
import { getCurrentPlan, getCurrentPlanSync, hasUserChosenPlan, hasActivePaidSubscriptionSync, markUserHasChosenPlan } from '../utils/subscriptionUtils';
import Toast from './Toast';
import DesignCreationDropdown from './DesignCreationDropdown';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Define getVisibleCards first
  const getVisibleCards = () => {
    if (windowWidth >= 1400) return 3;
    if (windowWidth >= 768) return 2;
    return 1;
  };

  // Then use it in other initializations
  const [designSystems, setDesignSystems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [basicProjects, setBasicProjects] = useState([]);
  const [advancedProjects, setAdvancedProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [projectsPage, setProjectsPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [currentPlan, setCurrentPlan] = useState('Free');
  const itemsPerPage = getVisibleCards();

  // Project classification function - use type field from API
  const classifyProject = (project) => {
    // Use the type field from the API response
    return project.type === 'advanced' ? 'advanced' : 'basic';
  };

  // Load current plan on component mount and listen for changes
  useEffect(() => {
    // Check if user has chosen a plan OR has an active paid subscription, if not redirect to plans page
    if (!hasUserChosenPlan() && !hasActivePaidSubscriptionSync()) {
      navigate('/plans');
      return;
    }

    const loadCurrentPlan = async () => {
      try {
        const plan = await getCurrentPlan();
        setCurrentPlan(plan);
        
        // If user has a paid plan, mark that they have chosen a plan
        if (plan === 'Paid' && !hasUserChosenPlan()) {
          markUserHasChosenPlan();
        }
      } catch (error) {
        console.error('Error loading current plan:', error);
        // Fallback to localStorage
        const plan = getCurrentPlanSync();
        setCurrentPlan(plan);
        
        // If user has a paid plan, mark that they have chosen a plan
        if (plan === 'Paid' && !hasUserChosenPlan()) {
          markUserHasChosenPlan();
        }
      }
    };

    loadCurrentPlan();

    // Listen for storage changes (when plan is updated from another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === 'currentPlan') {
        setCurrentPlan(e.newValue || 'Free');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (when plan is updated in same tab)
    const handlePlanChange = async () => {
      try {
        const plan = await getCurrentPlan();
        setCurrentPlan(plan);
      } catch (error) {
        console.error('Error loading current plan:', error);
        // Fallback to localStorage
        const plan = getCurrentPlanSync();
        setCurrentPlan(plan);
      }
    };

    window.addEventListener('planChanged', handlePlanChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('planChanged', handlePlanChange);
    };
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    // Reset fetch ref when token changes
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setDesignSystems([]);
      setProjects([]);
      return;
    }

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

      setDesignSystems(uniqueDesigns);
      setProjects(uniqueProjects);
      setBasicProjects(basicProjectsList);
      setAdvancedProjects(advancedProjectsList);
      setLoading(false);
    };

    const loadDesigns = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pass callback to handle cached data
        const designs = await getAllDesignSystems((cachedData) => {
          if (cachedData.length > 0) {
            processDesigns(cachedData);
          }
        });
        
        if (!mounted) return;

        processDesigns(designs);
      } catch (err) {
        if (!mounted) return;
        clearTimeout(timeoutId);
        
        console.error('Error fetching designs:', err);
        setError(err.message);
        setToast({
          show: true,
          message: err.message,
          type: 'error'
        });
        if (err.message.includes('Unauthorized')) {
          navigate('/login');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDesigns();

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Reset pages when screen size changes to prevent empty views
      setCurrentPage(0);
      setProjectsPage(0);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [navigate]);

  const totalPages = Math.max(0, designSystems.length - getVisibleCards() + 1);

  const getSlideOffset = (currentPageValue) => {
    const cardWidth = windowWidth <= 576 ? 260 : 280; // Adjust card width for mobile
    const cardGap = windowWidth <= 767 ? 16 : 24; // Adjust gap for mobile
    // Slide one card at a time
    const slideAmount = currentPageValue * (cardWidth + cardGap);
    const maxSlide = (designSystems.length - getVisibleCards()) * (cardWidth + cardGap);
    return Math.min(slideAmount, maxSlide);
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

      // Create dummy inputs for the report
      const inputs = {
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
        targetSpecies: 'Tilapia'
      };
      
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

  // Handle advanced project click - use step6results and limiting factor APIs
  const handleAdvancedProjectClick = async (project) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
            // Call both advanced APIs
            const [step6Response, limitingFactorResponse] = await Promise.all([
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
              })
            ]);

      if (!step6Response.ok) {
        throw new Error(`Failed to fetch step6 results: ${step6Response.status}`);
      }
      if (!limitingFactorResponse.ok) {
        throw new Error(`Failed to fetch limiting factor: ${limitingFactorResponse.status}`);
      }

      const step6Data = await step6Response.json();
      const limitingFactorData = await limitingFactorResponse.json();
      
      console.log('Advanced step6 API response:', step6Data);
      console.log('Advanced limiting factor API response:', limitingFactorData);

      // Map API response to our expected format
      const outputs = {
        step6Results: step6Data,
        limitingFactor: limitingFactorData,
        // Add any other advanced-specific data mapping here
      };

      // Create dummy inputs for the report
      const inputs = {
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
        targetSpecies: 'Tilapia'
      };
      
      // Navigate to ProjectReport with the calculated results
      navigate('/project-reports/' + project.id, {
        state: {
          inputs: inputs,
          outputs: outputs,
          projectType: 'advanced'
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
      <div className="dashboard-container">
        <Navbar />
        <div className="container dashboard-content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="container dashboard-content">
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
        {/* Welcome Section */}
          <div className="welcome-section text-center py-4">
            <h2 className="mb-3">Welcome to Dashboard</h2>
            <p className="lead mb-4">Manage your aquaculture designs and projects efficiently</p>
            <div className="d-flex justify-content-center">
              <button className="btn btn-secondary rounded-pill px-4 py-2 fw-semibold shadow-sm w-auto" to="/consultation">
                Book a Consultation
              </button>
            </div>
          </div>

        {/* Plan Status Section - Step 1 Result */}
        <div className="plan-status-section mb-4">
          <Card className="plan-status-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div className="plan-info">
                <h5 className="mb-1"><i className="bi bi-award text-warning me-2"></i>Current Plan: <span className={`plan-badge ${currentPlan.toLowerCase()}`}>{currentPlan}</span></h5>
                <p className="text-muted mb-0">
                  {currentPlan === 'Free' 
                    ? 'Basic features available. Upgrade for advanced capabilities.' 
                    : 'Full access to all features. Thank you for your subscription!'
                  }
                </p>
              </div>
              <div className="plan-actions">
                {/* Step 1 Result: Show button based on plan status */}
                {currentPlan === 'Free' ? (
                  <Button 
                    variant="primary" 
                    className="rounded-pill px-4"
                    onClick={() => navigate('/plans')}
                  >
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button 
                    variant="outline-primary" 
                    className="rounded-pill px-4"
                    onClick={() => navigate('/plans')}
                  >
                    Manage Plan
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Design Systems Section */}
        <div className="section">
          <div className="section-header">
            <h3 className="d-flex align-items-center gap-2"><i className="bi bi-diagram-3 text-primary"></i><span>Your Design Systems</span></h3>
            {designSystems.length > 0 && (
              <Button 
                variant="primary" 
                href="/design-systems/new" 
                className="add-button rounded-pill"
              >
                <i className="bi bi-plus-circle-fill me-2"></i>
                Add New Design
              </Button>
            )}
          </div>
          <div className="card-list">
            {designSystems.length === 0 ? (
              <Card className="empty-state-card">
                <Card.Body>
                  <div className="empty-state-content">
                    <h4>No Design Systems Yet</h4>
                    <p>Create your first design system to get started.</p>
                    <Button 
                      variant="primary" 
                      href="/design-systems/new" 
                      className="add-button rounded-pill"
                    >
                      <i className="bi bi-plus-circle-fill me-2"></i>
                      Add New Design System
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <div className="cards-container position-relative">
                {/* Cards */}
                <div 
                  className="cards-wrapper" 
                >
                  {designSystems.slice(0, designSystems.length >= 5 ? 3 : 4).map((system) => (
                    <Card 
                      key={system.id} 
                      className="design-system-card"
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1"><i className="bi bi-boxes text-primary me-2"></i>{system.design_system_name}</h5>
                            <p className="text-muted mb-2">{system.project_name}</p>
                            <p className="text-muted small mb-0">{formatDate(system.created_at)}</p>
                          </div>
                          
                        </div>
                        <div className="card-cta-br"><span className="eye-btn" aria-label="View details" onClick={() => navigate(`/design-systems/${system.id}`)}><i className="bi bi-eye"></i></span></div>
                      </Card.Body>
                    </Card>
                  ))}
                  {designSystems.length >= 5 ? (
                    <Card 
                      className="design-system-card view-all-card" 
                      onClick={() => navigate('/all-designs')}
                    >
                      <Card.Body>
                        <div className="d-flex flex-column justify-content-center align-items-center h-100">
                          <h5 className="mb-2">View All Designs</h5>
                          <p className="text-muted mb-0">{designSystems.length - 3} more designs</p>
                          <i className="bi bi-grid-3x3-gap-fill mt-2 fs-4"></i>
                        </div>
                      </Card.Body>
                    </Card>
                  ) : designSystems.length === 4 && (
                    <Card 
                      key={designSystems[3].id} 
                      className="design-system-card" 
                      onClick={() => navigate(`/design-systems/${designSystems[3].id}`)}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">{designSystems[3].design_system_name}</h5>
                            <p className="text-muted mb-2">{designSystems[3].project_name}</p>
                            <p className="text-muted small mb-0">{formatDate(designSystems[3].created_at)}</p>
                          </div>
                          
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Your Projects Section */}
        <div className="section">
          <div className="section-header">
            <h3 className="d-flex align-items-center gap-2"><i className="bi bi-briefcase text-primary"></i><span>Your Projects</span></h3>
            {(basicProjects.length > 0 || (currentPlan !== 'Free' && advancedProjects.length > 0)) && (
              <DesignCreationDropdown />
            )}
          </div>
          
          {/* Basic Projects Sub-container - Show for all plans */}
          <div className="projects-subsection mb-4">
              <div className="subsection-header d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0 d-flex align-items-center gap-2"><i className="bi bi-layers text-primary"></i><span>Basic Projects</span></h4>
              </div>
              <div className="card-list">
                {basicProjects.length === 0 ? (
                  <Card className="empty-state-card">
                    <Card.Body>
                      <div className="empty-state-content">
                        <h4>No Basic Projects Yet</h4>
                        <p>Create your first basic project to get started.</p>
                        <Button 
                          variant="primary" 
                          href="/design-systems/new?type=basic" 
                          className="add-button rounded-pill"
                        >
                          <i className="bi bi-plus-circle-fill me-2"></i>
                          Add New Basic Project
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ) : (
                  <div className="cards-container">
                    <div className="cards-wrapper">
                      {basicProjects.slice(0, 3).map((project) => (
                        <Card 
                          key={project.id} 
                          className="project-card basic-project-card"
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h5 className="mb-2 d-flex align-items-center gap-2"><i className="bi bi-folder2-open text-primary"></i><span>{project.name}</span></h5>
                                <div className="project-details">
                                  <div className="kv-row">
                                    <span className="kv-key text-muted">Species</span>
                                    <span className="kv-value species-names">{project.species_names || 'N/A'}</span>
                                  </div>
                                  <div className="kv-row">
                                    <span className="kv-key text-muted">Type</span>
                                    <span className="kv-value">
                                      <span className="badge bg-primary">Basic</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="card-cta-br">
                              <span 
                                className="eye-btn" 
                                aria-label="View basic project details" 
                                onClick={() => handleBasicProjectClick(project)}
                              >
                                <i className="bi bi-eye"></i>
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      {basicProjects.length > 3 && (
                        <Card 
                          className="project-card view-all-card" 
                          onClick={() => navigate('/all-projects?type=basic')}
                        >
                          <Card.Body>
                            <div className="d-flex flex-column justify-content-center align-items-center h-100">
                              <h5 className="mb-2">View All Basic Projects</h5>
                              <p className="text-muted mb-0">{basicProjects.length - 3} more projects</p>
                              <i className="bi bi-grid-3x3-gap-fill mt-2 fs-4"></i>
                            </div>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Advanced Projects Sub-container - Only show for paid plans */}
          {currentPlan !== 'Free' && (
            <div className="projects-subsection">
            <div className="subsection-header d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 d-flex align-items-center gap-2"><i className="bi bi-gear-wide-connected text-success"></i><span>Advanced Projects</span></h4>
            </div>
            <div className="card-list">
              {advancedProjects.length === 0 ? (
                <Card className="empty-state-card">
                  <Card.Body>
                    <div className="empty-state-content">
                      <h4>No Advanced Projects Yet</h4>
                      <p>Create your first advanced project to get started.</p>
                      <Button 
                        variant="primary" 
                        href="/design-systems/new?type=advanced" 
                        className="add-button rounded-pill"
                      >
                        <i className="bi bi-plus-circle-fill me-2"></i>
                        Add New Advanced Project
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <div className="cards-container">
                  <div className="cards-wrapper">
                    {advancedProjects.slice(0, 3).map((project) => (
                      <Card 
                        key={project.id} 
                        className="project-card advanced-project-card"
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h5 className="mb-2 d-flex align-items-center gap-2"><i className="bi bi-folder text-success"></i><span>{project.name}</span></h5>
                              <div className="project-details">
                                <div className="kv-row">
                                  <span className="kv-key text-muted">Species</span>
                                  <span className="kv-value species-names">{project.species_names || 'N/A'}</span>
                                </div>
                                <div className="kv-row">
                                  <span className="kv-key text-muted">Type</span>
                                  <span className="kv-value">
                                    <span className="badge bg-success">Advanced</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="card-cta-br">
                            <span 
                              className="eye-btn" 
                              aria-label="View advanced project details" 
                              onClick={() => handleAdvancedProjectClick(project)}
                            >
                              <i className="bi bi-eye"></i>
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                    {advancedProjects.length > 3 && (
                      <Card 
                        className="project-card view-all-card" 
                        onClick={() => navigate('/all-projects?type=advanced')}
                      >
                        <Card.Body>
                          <div className="d-flex flex-column justify-content-center align-items-center h-100">
                            <h5 className="mb-2">View All Advanced Projects</h5>
                            <p className="text-muted mb-0">{advancedProjects.length - 3} more projects</p>
                            <i className="bi bi-grid-3x3-gap-fill mt-2 fs-4"></i>
                          </div>
                        </Card.Body>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;