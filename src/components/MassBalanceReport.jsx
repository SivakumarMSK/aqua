import React, { useState } from 'react';
import Navbar from './Navbar';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { generateMassBalanceReport, generateMassBalanceCardsPdf } from '../utils/pdfGenerator';
import '../styles/MassBalanceReport.css';

const MassBalanceReport = () => {
  const { id } = useParams();
  const location = useLocation();
  const { inputs, outputs } = location.state || {};
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
          <h3 className="report-title mb-0">Mass Balance Report</h3>
          <div className="d-flex gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => window.alert('Delete action will be implemented')}
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
        </div>
      </div>
    </div>
  );
};

export default MassBalanceReport;