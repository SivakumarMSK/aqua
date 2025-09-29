import React from 'react';
import Navbar from './Navbar';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { generateMassBalanceCardsPdf } from '../utils/pdfGenerator';
import '../styles/MassBalanceReport.css';

const ProjectReport = () => {
  const { id } = useParams();
  const location = useLocation();
  const { inputs, outputs, projectType } = location.state || {};
  const navigate = useNavigate();

  if (!inputs || !outputs) {
    return (
      <div className="report-container">
        <Navbar />
        <div className="container report-content text-center">
          <h3>Report Data Not Found</h3>
          <p>The required report data could not be loaded. Please go back and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <Navbar />
      <div className="container report-content">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3 className="report-title mb-0">
            {projectType === 'advanced' ? 'Advanced Project Report' : 'Mass Balance Report'}
          </h3>
          <div className="d-flex gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this report?')) {
                  // TODO: Implement delete functionality
                  console.log('Delete report:', id);
                  navigate(-1);
                }
              }}
            >
              Delete
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Close"
              title="Close"
              style={{ lineHeight: 1, fontSize: '1.1rem', padding: '0.15rem 0.5rem' }}
            >
              ×
            </Button>
          </div>
        </div>
        <p className="report-subtitle mb-3">Report ID: {id}</p>

        <div className="report-cards">
          {projectType === 'advanced' ? (
            // Advanced Project Report - Same UI as CreateDesignSystem
            <div>
              {/* Stage 1 */}
              <h5 className="mb-3">Stage 1</h5>
              <div className="row g-4 mb-4">
                {(() => {
                  const s1 = outputs.step6Results?.step_6 || {};
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
                  const s1 = outputs.step6Results?.step_6 || {};
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
                  const s1 = outputs.step6Results?.step_6 || {};
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
                  const lf = outputs.limitingFactor || {
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
          ) : (
            // Basic Project Report (Mass Balance)
          <div className="row g-4">
            <div className="col-md-6">
              <Card className="report-card oxygen-card h-100">
                <Card.Body>
                  <h5>Oxygen</h5>
                  <div className="kv-list">
                    <div className="kv-row"><span className="kv-label">O₂ saturation adjusted</span><span className="kv-value">{outputs.oxygen.saturationAdjustedMgL} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Min DO (use)</span><span className="kv-value">{outputs.oxygen.MINDO_use ?? '-'} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Effluent concentration</span><span className="kv-value">{outputs.oxygen.effluentMgL} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Consumption</span><span className="kv-value">{outputs.oxygen.consMgPerDay} mg/day</span></div>
                    <div className="kv-row"><span className="kv-label">Consumption</span><span className="kv-value">{outputs.oxygen.consKgPerDay} kg/day</span></div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-6">
              <Card className="report-card tss-card h-100">
                <Card.Body>
                  <h5>Total Suspended Solids (TSS)</h5>
                  <div className="kv-list">
                    <div className="kv-row"><span className="kv-label">Effluent concentration</span><span className="kv-value">{outputs.tss.effluentMgL} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Max TSS (use)</span><span className="kv-value">{outputs.tss.MAXTSS_use ?? '-'} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Production</span><span className="kv-value">{outputs.tss.prodMgPerDay} mg/day</span></div>
                    <div className="kv-row"><span className="kv-label">Production</span><span className="kv-value">{outputs.tss.prodKgPerDay} kg/day</span></div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-6">
              <Card className="report-card co2-card h-100">
                <Card.Body>
                  <h5>Carbon Dioxide (CO₂)</h5>
                  <div className="kv-list">
                    <div className="kv-row"><span className="kv-label">Effluent concentration</span><span className="kv-value">{outputs.co2.effluentMgL} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Max CO₂ (use)</span><span className="kv-value">{outputs.co2.MAXCO2_use ?? '-'} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Production</span><span className="kv-value">{outputs.co2.prodMgPerDay} mg/day</span></div>
                    <div className="kv-row"><span className="kv-label">Production</span><span className="kv-value">{outputs.co2.prodKgPerDay} kg/day</span></div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-6">
              <Card className="report-card tan-card h-100">
                <Card.Body>
                  <h5>Total Ammonia Nitrogen (TAN)</h5>
                  <div className="kv-list">
                    <div className="kv-row"><span className="kv-label">Effluent concentration</span><span className="kv-value">{outputs.tan.effluentMgL} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Max TAN (use)</span><span className="kv-value">{outputs.tan.MAXTAN_use ?? '-'} mg/L</span></div>
                    <div className="kv-row"><span className="kv-label">Production</span><span className="kv-value">{outputs.tan.prodMgPerDay} mg/day</span></div>
                    <div className="kv-row"><span className="kv-label">Production</span><span className="kv-value">{outputs.tan.prodKgPerDay} kg/day</span></div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;


