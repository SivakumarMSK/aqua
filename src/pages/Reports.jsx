import React, { useEffect, useMemo, useState } from 'react';
import ListLayout from '../components/ListLayout';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import { getAllDesignSystems } from '../services/designSystemService.jsx';
import { deleteProject } from '../services/projectService.jsx';
import { useNavigate } from 'react-router-dom';
import { generateMassBalanceCardsPdf, generateAdvancedReportPdf, generateStage7ReportPdf, generateCompleteAdvancedReportPdf } from '../utils/pdfGenerator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Toast from '../components/Toast';
import Swal from 'sweetalert2';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [page, setPage] = useState(1);
  const [reportType, setReportType] = useState('basic'); // 'basic', 'advanced'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [stageAvailability, setStageAvailability] = useState({});
  const [downloadingProjectId, setDownloadingProjectId] = useState(null);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const designs = await getAllDesignSystems();
        if (!mounted) return;
        const built = (Array.isArray(designs) ? designs : [])
          .filter(d => d)
          .flatMap(d => {
            const createdAt = d.created_at || new Date().toISOString();
            const designName = d.design_system_name || d.project_name || 'Design';
            const projs = Array.isArray(d.projects) && d.projects.length ? d.projects : [];
            if (projs.length === 0) {
              return [{
                id: d.id || `design-${createdAt}`,
                name: d.project_name || 'Project',
                createdAt,
                species: d.target_species || 'Unknown',
                designSystemName: designName,
                projectName: d.project_name || 'Project',
                type: 'basic' // Default to basic for design-only entries
              }];
            }
            return projs.map(p => ({
              id: p.id || d.id,
              name: p.name || 'Project',
              createdAt: p.created_at || createdAt,
              species: p.species_names || 'Unknown',
              designSystemName: designName,
              projectName: p.name || 'Project',
              type: p.type || 'basic' // Add type field, default to 'basic'
            }));
          });
        // Ensure unique projects by name (keep latest by createdAt)
        const uniqueByName = Object.values(
          built.reduce((acc, item) => {
            const key = (item.projectName || item.name).toLowerCase();
            if (!acc[key] || new Date(item.createdAt) > new Date(acc[key].createdAt)) {
              acc[key] = item;
            }
            return acc;
          }, {})
        );
        setReports(uniqueByName);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const speciesOptions = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.species).filter(Boolean))).sort();
  }, [reports]);

  // Project classification function - use type field from API
  const classifyProject = (report) => {
    // Use the type field from the API response
    return report.type === 'advanced' ? 'advanced' : 'basic';
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = reports.filter(r => {
      const matchesQuery = !q || r.name.toLowerCase().includes(q);
      const matchesSpecies = species === 'ALL' || r.species === species;
      const matchesDateFrom = !dateFrom || new Date(r.createdAt) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(r.createdAt) <= new Date(dateTo);
      const matchesReportType = classifyProject(r) === reportType;
      
      return matchesQuery && matchesSpecies && matchesDateFrom && matchesDateTo && matchesReportType;
    });
    data.sort((a, b) => {
      switch (sort) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'created_asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created_desc':
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return data;
  }, [reports, query, species, dateFrom, dateTo, sort, reportType]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filteredSorted.slice(start, start + pageSize);

  const handleViewReport = async (report) => {
    try {
      setLoading(true);
      
      // Determine project type
      const projectType = classifyProject(report);
      
      if (projectType === 'basic') {
        await handleBasicReport(report);
      } else {
        await handleAdvancedReport(report);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  // Handle basic report - use production calculations API
  const handleBasicReport = async (report) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const response = await fetch(`/backend/formulas/api/projects/${report.id}/production-calculations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch calculations: ${response.status}`);
    }
    const calcData = await response.json();
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
      targetSpecies: report.species || 'Tilapia'
    };
    
    // Navigate to ProjectReport with basic data
    navigate('/project-reports/' + report.id, {
      state: {
        inputs: inputs,
        outputs: outputs,
        projectType: 'basic'
      }
    });
  };

  // Handle advanced report - use step6results, limiting factor, stage7, and stage8 APIs
  const handleAdvancedReport = async (report) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // Call all advanced APIs simultaneously
    const [step6Response, limitingFactorResponse, stage7Response, stage8Response] = await Promise.all([
      fetch(`/backend/advanced/formulas/api/projects/${report.id}/step_6_results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`/backend/advanced/formulas/api/projects/${report.id}/limiting_factor`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`/backend/advanced/formulas/api/projects/${report.id}/step7`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`/backend/advanced/formulas/api/projects/${report.id}/step8`, {
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

    const step6Data = await step6Response.json();
    const limitingFactorData = await limitingFactorResponse.json();
    
    // Handle Stage 7 and Stage 8 (optional - may not exist for all projects)
    let stage7Data = null;
    let stage8Data = null;
    
    if (stage7Response.ok) {
      stage7Data = await stage7Response.json();
    }
    
    if (stage8Response.ok) {
      stage8Data = await stage8Response.json();
    }
    
    // Map API response to our expected format
    const outputs = {
      step6Results: step6Data,
      limitingFactor: limitingFactorData,
      stage7Results: stage7Data,
      stage8Results: stage8Data,
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
      targetSpecies: report.species || 'Tilapia'
    };
    
    // Navigate to ProjectReport with advanced data
    navigate('/project-reports/' + report.id, {
      state: {
        inputs: inputs,
        outputs: outputs,
        projectType: 'advanced'
      }
    });
  };

  const handleDownloadReport = async (report) => {
    try {
      setLoading(true);
      
      // Determine project type
      const projectType = classifyProject(report);
      
      if (projectType === 'basic') {
        await downloadBasicReport(report);
      } else {
        await downloadAdvancedReport(report);
      }
    } catch (e) {
      setError(e?.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  // Download basic report - use production calculations API
  const downloadBasicReport = async (report) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const response = await fetch(`/backend/formulas/api/projects/${report.id}/production-calculations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch calculations: ${response.status}`);
    }
    const calcData = await response.json();
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
      targetSpecies: report.species || 'Tilapia'
    };
    
    // Generate basic report PDF
    const doc = generateMassBalanceCardsPdf(inputs, outputs);
    const name = (report.projectName || report.name || 'basic-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`${name}-${report.id}.pdf`);
  };

  // Download advanced report - use step6results and limiting factor APIs
  const downloadAdvancedReport = async (report) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // Call both advanced APIs
    const [step6Response, limitingFactorResponse] = await Promise.all([
      fetch(`/backend/advanced/formulas/api/projects/${report.id}/step_6_results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`/backend/advanced/formulas/api/projects/${report.id}/limiting_factor`, {
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
    
    // Create form data for advanced report (similar to CreateDesignSystem)
    const formData = {
      designSystemName: report.designSystemName || report.name || 'Advanced Design',
      targetSpecies: report.species || 'Tilapia',
      // Add other form fields as needed for the PDF generation
    };
    
    // Generate advanced report PDF
    const doc = generateAdvancedReportPdf(formData, step6Data, limitingFactorData);
    const name = (report.projectName || report.name || 'advanced-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `Advanced_Report_${name}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Check stage availability for advanced projects
  const checkStageAvailability = async (projectId) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const [stage7Response, stage8Response] = await Promise.all([
      fetch(`/backend/advanced/formulas/api/projects/${projectId}/step7`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`/backend/advanced/formulas/api/projects/${projectId}/step8`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
    ]);
    
    return {
      hasStage7: stage7Response.ok,
      hasStage8: stage8Response.ok
    };
  };

  // Handle dropdown positioning for fixed dropdowns
  const handleDropdownToggle = async (isOpen, report) => {
    if (isOpen && !stageAvailability[report.id]) {
      try {
        const availability = await checkStageAvailability(report.id);
        setStageAvailability(prev => ({
          ...prev,
          [report.id]: availability
        }));
      } catch (error) {
        console.error('Error checking stage availability:', error);
        setStageAvailability(prev => ({
          ...prev,
          [report.id]: { hasStage7: false, hasStage8: false }
        }));
      }
    }
    
    // Add/remove class to card when dropdown is open/closed
    setTimeout(() => {
      const cardElement = document.querySelector(`[data-report-id="${report.id}"]`);
      if (cardElement) {
        if (isOpen) {
          cardElement.classList.add('dropdown-open');
        } else {
          cardElement.classList.remove('dropdown-open');
        }
      }
    }, 10);
  };

  // Download Stage 6 report only
  const downloadStage6Report = async (report) => {
    try {
      setDownloadingProjectId(report.id);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Call Stage 6 APIs
      const [step6Response, limitingFactorResponse] = await Promise.all([
        fetch(`/backend/advanced/formulas/api/projects/${report.id}/step_6_results`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${report.id}/limiting_factor`, {
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
      
      // Create form data for report
      const formData = {
        designSystemName: report.designSystemName || report.name || 'Advanced Design',
        targetSpecies: report.species || 'Tilapia',
      };
      
      // Generate Stage 6 report PDF
      const doc = generateAdvancedReportPdf(formData, step6Data, limitingFactorData);
      const name = (report.projectName || report.name || 'advanced-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `Stage6_Report_${name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error downloading Stage 6 report:', error);
      setToast({
        show: true,
        message: `Failed to download Stage 6 report: ${error.message}`,
        type: 'error'
      });
    } finally {
      setDownloadingProjectId(null);
    }
  };

  // Download Stage 7 report only
  const downloadStage7Report = async (report) => {
    try {
      setDownloadingProjectId(report.id);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Call Stage 7 API
      const stage7Response = await fetch(`/backend/advanced/formulas/api/projects/${report.id}/step7`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!stage7Response.ok) {
        throw new Error(`Failed to fetch stage7 results: ${stage7Response.status}`);
      }

      const stage7Data = await stage7Response.json();
      
      // Create form data for report
      const formData = {
        designSystemName: report.designSystemName || report.name || 'Advanced Design',
        targetSpecies: report.species || 'Tilapia',
      };
      
      // Generate Stage 7 report PDF
      const doc = generateStage7ReportPdf(formData, stage7Data);
      const name = (report.projectName || report.name || 'advanced-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `Stage7_Report_${name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error downloading Stage 7 report:', error);
      setToast({
        show: true,
        message: `Failed to download Stage 7 report: ${error.message}`,
        type: 'error'
      });
    } finally {
      setDownloadingProjectId(null);
    }
  };

  // Download Stage 8 report only
  const downloadStage8Report = async (report) => {
    try {
      setDownloadingProjectId(report.id);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Call Stage 8 API
      const stage8Response = await fetch(`/backend/advanced/formulas/api/projects/${report.id}/step8`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!stage8Response.ok) {
        throw new Error(`Failed to fetch stage8 results: ${stage8Response.status}`);
      }

      const stage8Data = await stage8Response.json();
      
      // Create form data for report
      const formData = {
        designSystemName: report.designSystemName || report.name || 'Advanced Design',
        targetSpecies: report.species || 'Tilapia',
      };
      
      // Create a custom Stage 8 PDF with all the detailed data
      const doc = new jsPDF();
      let yPos = 20;
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(0, 89, 255);
      doc.text('Stage 8: Basic Pump Size Report', 20, yPos);
      yPos += 15;
      
      // Add timestamp
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 20, yPos);
      yPos += 20;
      
      // Add project info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project: ${formData.designSystemName}`, 20, yPos);
      yPos += 8;
      doc.text(`Species: ${formData.targetSpecies}`, 20, yPos);
      yPos += 15;
      
      // Helper function to format numbers
      const formatNum = (n, digits = 2) => 
        (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';
      
      // Stage 1 Data
      if (stage8Data.stage1) {
        doc.setFontSize(14);
        doc.setTextColor(0, 89, 255);
        doc.text('Stage 1 (Juvenile)', 20, yPos);
        yPos += 10;
        
        const stage1Data = [
          ['Parameter', 'Value'],
          ['Limiting Flow Rate', formatNum(stage8Data.stage1.limitingFlowRateStage1)],
          ['Q_l.s_Stage1', formatNum(stage8Data.stage1.Q_l_s_Stage1)],
          ['Total Dynamic Head Pressure', formatNum(stage8Data.stage1.pump_Head_Stage1)],
          ['Pump Efficiency', formatNum(stage8Data.stage1.n_Pump_Stage1)],
          ['Motor Efficiency', formatNum(stage8Data.stage1.n_Motor_Stage1)],
          ['Hydraulic Power', formatNum(stage8Data.stage1.pump_HydPower_Stage1)],
          ['Required Shaft Power', formatNum(stage8Data.stage1.pump_PowerkW_Stage1)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [stage1Data[0]],
          body: stage1Data.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [0, 89, 255], textColor: [255, 255, 255] },
          margin: { left: 20 }
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }
      
      // Stage 2 Data
      if (stage8Data.stage2) {
        doc.setFontSize(14);
        doc.setTextColor(0, 89, 255);
        doc.text('Stage 2 (Fingerling)', 20, yPos);
        yPos += 10;
        
        const stage2Data = [
          ['Parameter', 'Value'],
          ['Limiting Flow Rate', formatNum(stage8Data.stage2.limitingFlowRateStage2)],
          ['Q_l.s_Stage2', formatNum(stage8Data.stage2.Q_l_s_Stage2)],
          ['Total Dynamic Head Pressure', formatNum(stage8Data.stage2.pump_Head_Stage2)],
          ['Pump Efficiency', formatNum(stage8Data.stage2.n_Pump_Stage2)],
          ['Motor Efficiency', formatNum(stage8Data.stage2.n_Motor_Stage2)],
          ['Hydraulic Power', formatNum(stage8Data.stage2.pump_HydPower_Stage2)],
          ['Required Shaft Power', formatNum(stage8Data.stage2.pump_PowerkW_Stage2)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [stage2Data[0]],
          body: stage2Data.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [0, 89, 255], textColor: [255, 255, 255] },
          margin: { left: 20 }
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }
      
      // Stage 3 Data
      if (stage8Data.stage3) {
        doc.setFontSize(14);
        doc.setTextColor(0, 89, 255);
        doc.text('Stage 3 (Growout)', 20, yPos);
        yPos += 10;
        
        const stage3Data = [
          ['Parameter', 'Value'],
          ['Limiting Flow Rate', formatNum(stage8Data.stage3.limitingFlowRateStage3)],
          ['Q_l.s_Stage3', formatNum(stage8Data.stage3.Q_l_s_Stage3)],
          ['Total Dynamic Head Pressure', formatNum(stage8Data.stage3.pump_Head_Stage3)],
          ['Pump Efficiency', formatNum(stage8Data.stage3.n_Pump_Stage3)],
          ['Motor Efficiency', formatNum(stage8Data.stage3.n_Motor_Stage3)],
          ['Hydraulic Power', formatNum(stage8Data.stage3.pump_HydPower_Stage3)],
          ['Required Shaft Power', formatNum(stage8Data.stage3.pump_PowerkW_Stage3)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [stage3Data[0]],
          body: stage3Data.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [0, 89, 255], textColor: [255, 255, 255] },
          margin: { left: 20 }
        });
      }
      
      const name = (report.projectName || report.name || 'advanced-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `Stage8_Report_${name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error downloading Stage 8 report:', error);
      setToast({
        show: true,
        message: `Failed to download Stage 8 report: ${error.message}`,
        type: 'error'
      });
    } finally {
      setDownloadingProjectId(null);
    }
  };

  // Download Complete report (all available stages)
  const downloadCompleteReport = async (report) => {
    try {
      setDownloadingProjectId(report.id);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Call all APIs
      const [step6Response, limitingFactorResponse, stage7Response, stage8Response] = await Promise.all([
        fetch(`/backend/advanced/formulas/api/projects/${report.id}/step_6_results`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${report.id}/limiting_factor`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${report.id}/step7`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`/backend/advanced/formulas/api/projects/${report.id}/step8`, {
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

      const step6Data = await step6Response.json();
      const limitingFactorData = await limitingFactorResponse.json();
      
      // Handle Stage 7 and Stage 8 (optional)
      let stage7Data = null;
      let stage8Data = null;
      
      if (stage7Response.ok) {
        stage7Data = await stage7Response.json();
      }
      
      if (stage8Response.ok) {
        stage8Data = await stage8Response.json();
      }
      
      // Create form data for report
      const formData = {
        designSystemName: report.designSystemName || report.name || 'Advanced Design',
        targetSpecies: report.species || 'Tilapia',
      };
      
      // Generate complete report PDF
      const doc = generateCompleteAdvancedReportPdf(formData, step6Data, limitingFactorData, stage7Data, stage8Data);
      const name = (report.projectName || report.name || 'advanced-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `Complete_Report_${name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error downloading complete report:', error);
      setToast({
        show: true,
        message: `Failed to download complete report: ${error.message}`,
        type: 'error'
      });
    } finally {
      setDownloadingProjectId(null);
    }
  };

  const handleDeleteProject = async (report) => {
    // Show beautiful confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${report.projectName || report.name}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup-custom',
        title: 'swal2-title-custom',
        content: 'swal2-content-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    });
    
    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingProjectId(report.id);
      
      // Call the delete API
      await deleteProject(report.id);
      
      // Remove the project from the local state
      setReports(prevReports => 
        prevReports.filter(r => r.id !== report.id)
      );
      
      // Show success alert
      await Swal.fire({
        title: 'Deleted!',
        text: `"${report.projectName || report.name}" has been deleted successfully.`,
        icon: 'success',
        confirmButtonColor: '#28a745',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error('Error deleting project:', error);
      
      // Show error alert
      await Swal.fire({
        title: 'Error!',
        text: `Failed to delete project: ${error.message}`,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Render download dropdown for advanced projects
  const renderDownloadDropdown = (report) => {
    const projectType = classifyProject(report);
    
    if (projectType === 'basic') {
      // For basic projects, keep the simple download button
      return (
        <Button 
          variant="light" 
          size="sm" 
          onClick={() => handleDownloadReport(report)} 
          title="Download"
          disabled={downloadingProjectId === report.id}
        >
          {downloadingProjectId === report.id ? (
            <i className="bi bi-hourglass-split"></i>
          ) : (
            <i className="bi bi-download"></i>
          )}
        </Button>
      );
    }

    // For advanced projects, show dropdown
    return (
      <Dropdown onToggle={(isOpen) => handleDropdownToggle(isOpen, report)}>
        <Dropdown.Toggle 
          variant="light" 
          size="sm" 
          disabled={downloadingProjectId === report.id}
          title="Download Reports"
        >
          {downloadingProjectId === report.id ? (
            <i className="bi bi-hourglass-split"></i>
          ) : (
            <i className="bi bi-download"></i>
          )}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => downloadStage6Report(report)}>
            <i className="bi bi-calculator me-2"></i>Stage 6 Report
          </Dropdown.Item>
          {stageAvailability[report.id]?.hasStage7 && (
            <Dropdown.Item onClick={() => downloadStage7Report(report)}>
              <i className="bi bi-gear me-2"></i>Stage 7 Report
            </Dropdown.Item>
          )}
          {stageAvailability[report.id]?.hasStage7 && stageAvailability[report.id]?.hasStage8 && (
            <Dropdown.Item onClick={() => downloadStage8Report(report)}>
              <i className="bi bi-lightning me-2"></i>Stage 8 Report
            </Dropdown.Item>
          )}
          {stageAvailability[report.id]?.hasStage7 && (
            <Dropdown.Divider />
          )}
          {stageAvailability[report.id]?.hasStage7 && (
            <Dropdown.Item onClick={() => downloadCompleteReport(report)}>
              <i className="bi bi-grid-3x3-gap-fill me-2"></i>Complete Report
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderReportCard = (report) => (
    <Card key={report.id} className="item-card" data-report-id={report.id}>
      <Card.Body>
        <div className="card-top">
          <h5 className="mb-1">{report.projectName || report.name}</h5>
        </div>
        <div className="text-muted small mb-2">{report.designSystemName}</div>
        <div className="card-meta">
          <p>Created: {new Date(report.createdAt).toLocaleDateString()}</p>
          <p>Species: {report.species}</p>
        </div>
        <div className="card-actions">
          <Button variant="light" size="sm" onClick={() => handleViewReport(report)} title="View">
            <i className="bi bi-eye"></i>
          </Button>
          {renderDownloadDropdown(report)}
          <Button variant="light" size="sm" onClick={() => window.alert('Share link copied')} title="Share">
            <i className="bi bi-share"></i>
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={() => handleDeleteProject(report)} 
            title="Delete Project"
            disabled={deletingProjectId === report.id}
          >
            {deletingProjectId === report.id ? (
              <i className="bi bi-hourglass-split"></i>
            ) : (
              <i className="bi bi-trash"></i>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <ListLayout
        title="Reports"
        items={visible}
        renderItem={renderReportCard}
        renderControls={() => (
          <>
            {/* Report Type Filter Buttons */}
            <div className="report-type-buttons d-flex gap-2 mb-3">
              <button
                onClick={() => { setPage(1); setReportType('basic'); }}
                className={`report-filter-btn ${reportType === 'basic' ? 'active' : 'inactive'}`}
              >
                Basic Reports
              </button>
              <button
                onClick={() => { setPage(1); setReportType('advanced'); }}
                className={`report-filter-btn ${reportType === 'advanced' ? 'active' : 'inactive'}`}
              >
                Advanced Reports
              </button>
            </div>
            
            <InputGroup className="search-bar">
              <Form.Control
                placeholder="Search reports..."
                value={query}
                onChange={e => { setPage(1); setQuery(e.target.value); }}
              />
            </InputGroup>
            <div className="filter-sort-group d-flex gap-2">
              <Form.Select className="filter-select" value={species} onChange={e => { setPage(1); setSpecies(e.target.value); }}>
                <option value="ALL">Species: All</option>
                {speciesOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
              <Form.Control type="date" value={dateFrom} onChange={e => { setPage(1); setDateFrom(e.target.value); }} />
              <Form.Control type="date" value={dateTo} onChange={e => { setPage(1); setDateTo(e.target.value); }} />
              <Form.Select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="created_desc">Newest</option>
                <option value="created_asc">Oldest</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </Form.Select>
            </div>
          </>
        )}
        pagination={{
          page: currentPage,
          totalPages,
          onPrev: () => setPage(p => Math.max(1, p - 1)),
          onNext: () => setPage(p => Math.min(totalPages, p + 1)),
          totalLabel: loading ? 'Loading…' : error ? error : `${filteredSorted.length} result${filteredSorted.length === 1 ? '' : 's'}`
        }}
      />
    </>
  );
};

export default Reports;