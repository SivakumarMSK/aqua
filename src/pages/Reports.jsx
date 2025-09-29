import React, { useEffect, useMemo, useState } from 'react';
import ListLayout from '../components/ListLayout';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { getAllDesignSystems } from '../services/designSystemService.jsx';
import { useNavigate } from 'react-router-dom';
import { generateMassBalanceCardsPdf, generateAdvancedReportPdf } from '../utils/pdfGenerator';

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
    const response = await fetch(`http://13.53.148.164:5000/formulas/api/projects/${report.id}/production-calculations`, {
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

  // Handle advanced report - use step6results and limiting factor APIs
  const handleAdvancedReport = async (report) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // Call both advanced APIs
    const [step6Response, limitingFactorResponse] = await Promise.all([
      fetch(`http://13.53.148.164:5000/advanced/formulas/api/projects/${report.id}/step_6_results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`http://13.53.148.164:5000/advanced/formulas/api/projects/${report.id}/limiting_factor`, {
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
    
    // Map API response to our expected format
    const outputs = {
      step6Results: step6Data,
      limitingFactor: limitingFactorData,
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
    const response = await fetch(`http://13.53.148.164:5000/formulas/api/projects/${report.id}/production-calculations`, {
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
      fetch(`http://13.53.148.164:5000/advanced/formulas/api/projects/${report.id}/step_6_results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`http://13.53.148.164:5000/advanced/formulas/api/projects/${report.id}/limiting_factor`, {
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

  const renderReportCard = (report) => (
    <Card key={report.id} className="item-card">
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
          <Button variant="light" size="sm" onClick={() => handleDownloadReport(report)} title="Download">
            <i className="bi bi-download"></i>
          </Button>
          <Button variant="light" size="sm" onClick={() => window.alert('Share link copied')} title="Share">
            <i className="bi bi-share"></i>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
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
  );
};

export default Reports;