import React, { useState } from 'react';
import Navbar from './Navbar';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { generateMassBalanceCardsPdf } from '../utils/pdfGenerator';
import { deleteProject } from '../services/projectService';
import Toast from './Toast';
import Swal from 'sweetalert2';
import '../styles/MassBalanceReport.css';
import '../styles/CreateDesignSystem.css';

const ProjectReport = () => {
  const { id } = useParams();
  const location = useLocation();
  const { inputs, outputs, projectType } = location.state || {};
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('all');

  const handleDeleteProject = async () => {
    // Show beautiful confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this action!",
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
      setIsDeleting(true);
      
      // Call the delete API
      await deleteProject(id);
      
      // Show success alert
      await Swal.fire({
        title: 'Deleted!',
        text: 'Your project has been deleted successfully.',
        icon: 'success',
        confirmButtonColor: '#28a745',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      
      // Navigate back to dashboard
      navigate('/dashboard');
      
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
      setIsDeleting(false);
    }
  };

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
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="container report-content">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3 className="report-title mb-0">
            {projectType === 'advanced' ? 'Advanced Project Report' : 'Mass Balance Report'}
          </h3>
          <div className="d-flex gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <i className="bi bi-hourglass-split me-1"></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-1"></i>
                  Delete
                </>
              )}
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
            // Advanced Project Report with Tabs - Same UI as CreateDesignSystem
            <div>
              {/* Tab Navigation */}
              <div className="modern-tab-container mb-4">
                <div className="tab-nav">
                  <div 
                    className={`tab-item ${activeReportTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveReportTab('all')}
                  >
                    <div className="tab-icon">
                      <i className="bi bi-grid-3x3-gap-fill"></i>
                    </div>
                    <div className="tab-label">All Reports</div>
                  </div>
                  <div 
                    className={`tab-item ${activeReportTab === 'stage6' ? 'active' : ''}`}
                    onClick={() => setActiveReportTab('stage6')}
                  >
                    <div className="tab-icon">
                      <i className="bi bi-calculator"></i>
                    </div>
                    <div className="tab-label">Stage 6</div>
                  </div>
                  {outputs.stage7Results && (
                    <div 
                      className={`tab-item ${activeReportTab === 'stage7' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('stage7')}
                    >
                      <div className="tab-icon">
                        <i className="bi bi-gear"></i>
                      </div>
                      <div className="tab-label">Stage 7</div>
                    </div>
                  )}
                  {outputs.stage8Results && (
                    <div 
                      className={`tab-item ${activeReportTab === 'stage8' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('stage8')}
                    >
                      <div className="tab-icon">
                        <i className="bi bi-lightning"></i>
                      </div>
                      <div className="tab-label">Stage 8</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage 6 Report */}
              {(!outputs.stage7Results && !outputs.stage8Results || activeReportTab === 'all' || activeReportTab === 'stage6') && (
                <div className="report-cards">
                  <h5 className="mb-3">Stage 6: Advanced Parameters</h5>
                  
                  {/* Stage 1 */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Stage 1</h6>
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
                  </div>

                  {/* Stage 2 */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Stage 2</h6>
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
                  </div>

                  {/* Stage 3 */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Stage 3</h6>
                    <div className="row g-4 mb-4">
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
                  </div>

                  {/* Limiting Factor */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">Limiting Factor</h6>
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
                </div>
              )}

              {/* Stage 7 Report */}
              {outputs.stage7Results && (activeReportTab === 'all' || activeReportTab === 'stage7') && (
                <div className="report-cards">
                  {/* Stage 7 Title */}
                  <h4 className="mb-4 text-primary">Stage 7: Bio Filter & Sump Size</h4>
                  
                  <h5 className="mb-3">Bio Filter Parameters</h5>
                  
                  {/* Bio Filter Parameters */}
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <Card className="h-100 shadow-sm bio-filter-card">
                        <Card.Body>
                          <Card.Title className="text-primary">Bio Filter Parameters</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">VTR Used</span><strong>{outputs.stage7Results?.bioVTR_use ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">VTR Compensation</span><strong>{outputs.stage7Results?.['bio.VTR_compensation'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Shape</span><strong>{outputs.stage7Results?.['bio.shape'] ?? 'N/A'}</strong></div>
                            <div className="metric-row"><span className="label">Temperature Used</span><strong>{outputs.stage7Results?.temperature_used ?? 0}°C</strong></div>
                            <div className="metric-row"><span className="label">Temp Compensation Factor</span><strong>{outputs.stage7Results?.temp_compensation_factor ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-6">
                      <Card className="h-100 shadow-sm sump-card">
                        <Card.Body>
                          <Card.Title className="text-primary">System Overview</Card.Title>
                          <div className="mt-3">
                            <div className="metric-row"><span className="label">Project ID</span><strong>{outputs.stage7Results?.project_id ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Status</span><strong>{outputs.stage7Results?.status ?? 'N/A'}</strong></div>
                            <div className="metric-row"><span className="label">Biofilter Parameters</span><strong>{Object.keys(outputs.stage7Results?.biofilter_parameters || {}).length} items</strong></div>
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
                            <div className="metric-row"><span className="label">Total (g/day)</span><strong>{outputs.stage7Results?.DailyTAN_gday_Stage1 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">After Passive Nitrification (g/day)</span><strong>{outputs.stage7Results?.DailyTANpassive_gday_Stage1 ?? 0}</strong></div>
                            
                            {/* Design VTR */}
                            <h6 className="text-muted mb-2 mt-3">Design VTR</h6>
                            <div className="metric-row"><span className="label">Design VTR</span><strong>{outputs.stage7Results?.['design.VTR_Stage1'] ?? 0}</strong></div>
                            
                            {/* Media Volume Required */}
                            <h6 className="text-muted mb-2 mt-3">Media Volume Required</h6>
                            <div className="metric-row"><span className="label">Media Required (m³)</span><strong>{outputs.stage7Results?.['biomedia.Required_Stage1'] ?? 0}</strong></div>
                            
                            {/* MBBR Volume */}
                            <h6 className="text-muted mb-2 mt-3">MBBR Volume</h6>
                            <div className="metric-row"><span className="label">MBBR Volume (m³)</span><strong>{outputs.stage7Results?.['MBBR.vol_Stage1'] ?? 0}</strong></div>
                            
                            {/* Round Vessel */}
                            <h6 className="text-muted mb-2 mt-3">Round Vessel</h6>
                            <div className="metric-row"><span className="label">Vessel Diameter (m)</span><strong>{outputs.stage7Results?.['MBBR.dia_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{outputs.stage7Results?.['MBBR.high_Stage1'] ?? 0}</strong></div>
                            
                            {/* Rectangular Vessel */}
                            <h6 className="text-muted mb-2 mt-3">Rectangular Vessel</h6>
                            <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{outputs.stage7Results?.['MBBR.highRect_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Width (m)</span><strong>{outputs.stage7Results?.['MBBR.wid_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Length (m)</span><strong>{outputs.stage7Results?.['MBBR.len_Stage1'] ?? 0}</strong></div>
                            
                            {/* Aeration */}
                            <h6 className="text-muted mb-2 mt-3">Aeration</h6>
                            <div className="metric-row"><span className="label">Volume Air Required for Mixing (x5 vol)</span><strong>{outputs.stage7Results?.['MBBR.air_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Volume Air Required (with 50% spare capacity)</span><strong>{outputs.stage7Results?.['MBBR.air_Stage1_spare'] ?? 0}</strong></div>
                            
                            {/* Sump Sizing */}
                            <h6 className="text-muted mb-2 mt-3">Sump Sizing</h6>
                            <div className="metric-row"><span className="label">3 min Full Flow (m³)</span><strong>{outputs.stage7Results?.['sump.Size_3min_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">5 min Full Flow (m³)</span><strong>{outputs.stage7Results?.['sump.Size_5min_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Sump Total Volume (m³)</span><strong>{outputs.stage7Results?.['sump.totvol_Stage1'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Total System Volume (m³)</span><strong>{outputs.stage7Results?.['vol.TotalSyst_Stage1'] ?? 0}</strong></div>
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
                            <div className="metric-row"><span className="label">Total (g/day)</span><strong>{outputs.stage7Results?.DailyTAN_gday_Stage2 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">After Passive Nitrification (g/day)</span><strong>{outputs.stage7Results?.DailyTANpassive_gday_Stage2 ?? 0}</strong></div>
                            
                            {/* Design VTR */}
                            <h6 className="text-muted mb-2 mt-3">Design VTR</h6>
                            <div className="metric-row"><span className="label">Design VTR</span><strong>{outputs.stage7Results?.['design.VTR_Stage2'] ?? 0}</strong></div>
                            
                            {/* Media Volume Required */}
                            <h6 className="text-muted mb-2 mt-3">Media Volume Required</h6>
                            <div className="metric-row"><span className="label">Media Required (m³)</span><strong>{outputs.stage7Results?.['biomedia.Required_Stage2'] ?? 0}</strong></div>
                            
                            {/* MBBR Volume */}
                            <h6 className="text-muted mb-2 mt-3">MBBR Volume</h6>
                            <div className="metric-row"><span className="label">MBBR Volume (m³)</span><strong>{outputs.stage7Results?.['MBBR.vol_Stage2'] ?? 0}</strong></div>
                            
                            {/* Round Vessel */}
                            <h6 className="text-muted mb-2 mt-3">Round Vessel</h6>
                            <div className="metric-row"><span className="label">Vessel Diameter (m)</span><strong>{outputs.stage7Results?.['MBBR.dia_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{outputs.stage7Results?.['MBBR.high_Stage2'] ?? 0}</strong></div>
                            
                            {/* Rectangular Vessel */}
                            <h6 className="text-muted mb-2 mt-3">Rectangular Vessel</h6>
                            <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{outputs.stage7Results?.['MBBR.highRect_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Width (m)</span><strong>{outputs.stage7Results?.['MBBR.wid_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Length (m)</span><strong>{outputs.stage7Results?.['MBBR.len_Stage2'] ?? 0}</strong></div>
                            
                            {/* Aeration */}
                            <h6 className="text-muted mb-2 mt-3">Aeration</h6>
                            <div className="metric-row"><span className="label">Volume Air Required for Mixing (x5 vol)</span><strong>{outputs.stage7Results?.['MBBR.air_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Volume Air Required (with 50% spare capacity)</span><strong>{outputs.stage7Results?.['MBBR.air_Stage2_spare'] ?? 0}</strong></div>
                            
                            {/* Sump Sizing */}
                            <h6 className="text-muted mb-2 mt-3">Sump Sizing</h6>
                            <div className="metric-row"><span className="label">3 min Full Flow (m³)</span><strong>{outputs.stage7Results?.['sump.Size_3min_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">5 min Full Flow (m³)</span><strong>{outputs.stage7Results?.['sump.Size_5min_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Sump Total Volume (m³)</span><strong>{outputs.stage7Results?.['sump.totvol_Stage2'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Total System Volume (m³)</span><strong>{outputs.stage7Results?.['vol.TotalSyst_Stage2'] ?? 0}</strong></div>
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
                            <div className="metric-row"><span className="label">Total (g/day)</span><strong>{outputs.stage7Results?.DailyTAN_gday_Stage3 ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">After Passive Nitrification (g/day)</span><strong>{outputs.stage7Results?.DailyTANpassive_gday_Stage3 ?? 0}</strong></div>
                            
                            {/* Design VTR */}
                            <h6 className="text-muted mb-2 mt-3">Design VTR</h6>
                            <div className="metric-row"><span className="label">Design VTR</span><strong>{outputs.stage7Results?.['design.VTR_Stage3'] ?? 0}</strong></div>
                            
                            {/* Media Volume Required */}
                            <h6 className="text-muted mb-2 mt-3">Media Volume Required</h6>
                            <div className="metric-row"><span className="label">Media Required (m³)</span><strong>{outputs.stage7Results?.['biomedia.Required_Stage3'] ?? 0}</strong></div>
                            
                            {/* MBBR Volume */}
                            <h6 className="text-muted mb-2 mt-3">MBBR Volume</h6>
                            <div className="metric-row"><span className="label">MBBR Volume (m³)</span><strong>{outputs.stage7Results?.['MBBR.vol_Stage3'] ?? 0}</strong></div>
                            
                            {/* Round Vessel */}
                            <h6 className="text-muted mb-2 mt-3">Round Vessel</h6>
                            <div className="metric-row"><span className="label">Vessel Diameter (m)</span><strong>{outputs.stage7Results?.['MBBR.dia_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{outputs.stage7Results?.['MBBR.high_Stage3'] ?? 0}</strong></div>
                            
                            {/* Rectangular Vessel */}
                            <h6 className="text-muted mb-2 mt-3">Rectangular Vessel</h6>
                            <div className="metric-row"><span className="label">Vessel Height (m)</span><strong>{outputs.stage7Results?.['MBBR.highRect_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Width (m)</span><strong>{outputs.stage7Results?.['MBBR.wid_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Vessel Length (m)</span><strong>{outputs.stage7Results?.['MBBR.len_Stage3'] ?? 0}</strong></div>
                            
                            {/* Aeration */}
                            <h6 className="text-muted mb-2 mt-3">Aeration</h6>
                            <div className="metric-row"><span className="label">Volume Air Required for Mixing (x5 vol)</span><strong>{outputs.stage7Results?.['MBBR.air_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Volume Air Required (with 50% spare capacity)</span><strong>{outputs.stage7Results?.['MBBR.air_Stage3_spare'] ?? 0}</strong></div>
                            
                            {/* Sump Sizing */}
                            <h6 className="text-muted mb-2 mt-3">Sump Sizing</h6>
                            <div className="metric-row"><span className="label">3 min Full Flow (m³)</span><strong>{outputs.stage7Results?.['sump.Size_3min_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">5 min Full Flow (m³)</span><strong>{outputs.stage7Results?.['sump.Size_5min_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Sump Total Volume (m³)</span><strong>{outputs.stage7Results?.['sump.totvol_Stage3'] ?? 0}</strong></div>
                            <div className="metric-row"><span className="label">Total System Volume (m³)</span><strong>{outputs.stage7Results?.['vol.TotalSyst_Stage3'] ?? 0}</strong></div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 8 Report */}
              {outputs.stage8Results && (activeReportTab === 'all' || activeReportTab === 'stage8') && (
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
                              <div className="metric-row"><span className="label">Limiting Flow Rate</span><strong>{outputs.stage8Results?.stage1?.limitingFlowRateStage1 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Q_l.s_Stage1</span><strong>{outputs.stage8Results?.stage1?.Q_l_s_Stage1 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Total Dynamic Head Pressure</span><strong>{outputs.stage8Results?.stage1?.pump_Head_Stage1 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Pump Efficiency</span><strong>{outputs.stage8Results?.stage1?.n_Pump_Stage1 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Motor Efficiency</span><strong>{outputs.stage8Results?.stage1?.n_Motor_Stage1 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Hydraulic Power</span><strong>{outputs.stage8Results?.stage1?.pump_HydPower_Stage1 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Required Shaft Power</span><strong>{outputs.stage8Results?.stage1?.pump_PowerkW_Stage1 ?? 0}</strong></div>
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
                              <div className="metric-row"><span className="label">Limiting Flow Rate</span><strong>{outputs.stage8Results?.stage2?.limitingFlowRateStage2 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Q_l.s_Stage2</span><strong>{outputs.stage8Results?.stage2?.Q_l_s_Stage2 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Total Dynamic Head Pressure</span><strong>{outputs.stage8Results?.stage2?.pump_Head_Stage2 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Pump Efficiency</span><strong>{outputs.stage8Results?.stage2?.n_Pump_Stage2 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Motor Efficiency</span><strong>{outputs.stage8Results?.stage2?.n_Motor_Stage2 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Hydraulic Power</span><strong>{outputs.stage8Results?.stage2?.pump_HydPower_Stage2 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Required Shaft Power</span><strong>{outputs.stage8Results?.stage2?.pump_PowerkW_Stage2 ?? 0}</strong></div>
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
                              <div className="metric-row"><span className="label">Limiting Flow Rate</span><strong>{outputs.stage8Results?.stage3?.limitingFlowRateStage3 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Q_l.s_Stage3</span><strong>{outputs.stage8Results?.stage3?.Q_l_s_Stage3 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Total Dynamic Head Pressure</span><strong>{outputs.stage8Results?.stage3?.pump_Head_Stage3 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Pump Efficiency</span><strong>{outputs.stage8Results?.stage3?.n_Pump_Stage3 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Motor Efficiency</span><strong>{outputs.stage8Results?.stage3?.n_Motor_Stage3 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Hydraulic Power</span><strong>{outputs.stage8Results?.stage3?.pump_HydPower_Stage3 ?? 0}</strong></div>
                              <div className="metric-row"><span className="label">Required Shaft Power</span><strong>{outputs.stage8Results?.stage3?.pump_PowerkW_Stage3 ?? 0}</strong></div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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


