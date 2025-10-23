import React from 'react';
import { Button, Form, Card, Row, Col } from 'react-bootstrap';
import DynamicOutputsPanel from './DynamicOutputsPanel';

const CombinedInputsPage = ({ 
  formData, 
  liveOutputs,
  handleInputChange, 
  renderInputWithTooltip, 
  loading, 
  error,
  onBack,
  onCalculateMassBalance
}) => {
  return (
    <div className="combined-inputs-page">
      <Row className="g-4">
        {/* Left Column - Input Forms */}
        <Col lg={6}>
          <div className="inputs-column">
            {/* Water Quality Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Water Quality Parameters</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <h6>Required Parameters</h6>
                  {renderInputWithTooltip('waterTemp', 'Water Temperature', '°C')}
                  {renderInputWithTooltip('salinity', 'Salinity', '%')}
                  {renderInputWithTooltip('siteElevation', 'Site Elevation', 'm')}
                </div>

                <div className="mb-4">
                  <h6>Other Water Quality Parameters</h6>
                  {renderInputWithTooltip('minDO', 'Minimum Dissolved Oxygen (O₂)', 'mg/l')}
                  {renderInputWithTooltip('targetMinO2Saturation', 'Target Minimum O₂ Saturation', '%')}
                  {renderInputWithTooltip('ph', 'ph Level')}
                  {renderInputWithTooltip('alkalinity', 'Alkalinity', 'mg/L')}
                  {renderInputWithTooltip('minTSS', 'Maximum Total Suspended Solids (TSS)', 'mg/l')}
                  {renderInputWithTooltip('maxCO2', 'Maximum Dissolved Carbon Dioxide (CO₂)', 'mg/l')}
                  {renderInputWithTooltip('maxTAN', 'Maximum Total Ammonia (TAN)', 'mg/L')}
                  <Form.Check
                    type="checkbox"
                    name="supplementPureO2"
                    label="Supplement Pure O₂"
                    checked={formData.supplementPureO2}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-3"
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Production Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Production Information</h5>
              </Card.Header>
              <Card.Body>
                {renderInputWithTooltip('tankVolume', 'Tank Volume', 'm³')}
                {renderInputWithTooltip('productionTarget_t', 'Target production per year', 't')}
                {renderInputWithTooltip('targetFishWeight', 'Target fish weight at harvest', 'g')}
                {renderInputWithTooltip('feedRate', 'Feed rate', '% of biomass/day')}
                {renderInputWithTooltip('feedConversionRatio', 'Feed Conversion Ratio (FCR)', '')}
                {renderInputWithTooltip('numTanks', 'Total Number of Tanks')}
                {renderInputWithTooltip('targetNumFish', 'Target Number of fish at harvest')}
                {renderInputWithTooltip('feedProtein', 'Feed protein content', '%')}

                {renderInputWithTooltip('harvestFrequency', 'Harvest frequency', '', 'text')}
                {renderInputWithTooltip('initialWeight', 'Initial weight', 'g')}

                {/* Stage-wise Feed Conversion & Mortality */}
                <div className="row g-3 mt-2">
                  <div className="col-md-4">
                    <div className="card p-3">
                      <div className="fw-semibold mb-2">Stage 1 (Juvenile)</div>
                      {renderInputWithTooltip('FCR_Stage1', 'FCR')}
                      {renderInputWithTooltip('FeedProtein_Stage1', 'Feed protein (%)')}
                      {renderInputWithTooltip('Estimated_mortality_Stage1', 'Mortality (%)')}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card p-3">
                      <div className="fw-semibold mb-2">Stage 2 (Fingerling)</div>
                      {renderInputWithTooltip('FCR_Stage2', 'FCR')}
                      {renderInputWithTooltip('FeedProtein_Stage2', 'Feed protein (%)')}
                      {renderInputWithTooltip('Estimated_mortality_Stage2', 'Mortality (%)')}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card p-3">
                      <div className="fw-semibold mb-2">Stage 3 (Growout)</div>
                      {renderInputWithTooltip('FCR_Stage3', 'FCR')}
                      {renderInputWithTooltip('FeedProtein_Stage3', 'Feed protein (%)')}
                      {renderInputWithTooltip('Estimated_mortality_Stage3', 'Mortality (%)')}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Efficiency Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">System Efficiency Parameters</h5>
              </Card.Header>
              <Card.Body>
                {renderInputWithTooltip('o2Absorption', 'O₂ Absorption Efficiency', '%')}
                {renderInputWithTooltip('co2Removal', 'CO₂ Removal Efficiency', '%')}
                {renderInputWithTooltip('tssRemoval', 'TSS Removal Efficiency', '%')}
                {renderInputWithTooltip('tanRemoval', 'TAN Removal Efficiency', '%')}
              </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Right Column - Dynamic Outputs */}
        <Col lg={6}>
          <div className="outputs-column">
            <DynamicOutputsPanel 
              formData={formData} 
              liveOutputs={liveOutputs}
              onFieldUpdate={(section, data, status) => {
                // This will be used for real-time updates when polling APIs are ready
                console.log('Field update:', section, data, status);
              }}
            />
          </div>
        </Col>
      </Row>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      {/* Action Buttons - match report page sizing/placement */}
      <div className="navigation-buttons d-flex justify-content-between mt-4">
        <Button 
          variant="outline-secondary"
          size="sm"
          style={{ width: '100px' }}
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        <div>
          <Button 
            variant="primary"
            size="sm"
            style={{ width: '180px' }}
            onClick={onCalculateMassBalance}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Mass Balance'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CombinedInputsPage;
