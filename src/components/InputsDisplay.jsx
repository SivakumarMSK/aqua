import React from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const InputsDisplay = ({ inputs, showOnlyStage7Specific = false }) => {
  if (!inputs) {
    return null;
  }

  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted fst-italic">Not set</span>;
    }
    return <span className="fw-bold">{value}{unit ? ` ${unit}` : ''}</span>;
  };

  return (
    <div className="inputs-display mb-4">
      <h4 className="mb-3 text-primary">
        <i className="bi bi-gear-fill me-2"></i>
        Project Input Parameters
      </h4>
      
      <Row className="g-3">
        {/* Common Parameters - Only show if not Stage 7 specific only */}
        {!showOnlyStage7Specific && (
          <>
            {/* Water Quality Parameters */}
            <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-droplet-fill me-2"></i>
                Water Quality Parameters
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="parameter-grid">
                <div className="parameter-row">
                  <span className="parameter-label">Water Temperature</span>
                  <span className="parameter-value">{formatValue(inputs.waterTemp, '°C')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Salinity</span>
                  <span className="parameter-value">{formatValue(inputs.salinity, '%')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Site Elevation</span>
                  <span className="parameter-value">{formatValue(inputs.siteElevation, 'm')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Minimum DO</span>
                  <span className="parameter-value">{formatValue(inputs.minDO, 'mg/L')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">pH Level</span>
                  <span className="parameter-value">{formatValue(inputs.pH)}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Maximum CO₂</span>
                  <span className="parameter-value">{formatValue(inputs.maxCO2, 'mg/L')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Maximum TAN</span>
                  <span className="parameter-value">{formatValue(inputs.maxTAN, 'mg/L')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Maximum TSS</span>
                  <span className="parameter-value">{formatValue(inputs.minTSS, 'mg/L')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Alkalinity</span>
                  <span className="parameter-value">{formatValue(inputs.alkalinity, 'mg/L')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Target Min O₂ Saturation</span>
                  <span className="parameter-value">{formatValue(inputs.targetMinO2Saturation, '%')}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Production Parameters */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-fish me-2"></i>
                Production Parameters
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="parameter-grid">
                <div className="parameter-row">
                  <span className="parameter-label">Tank Volume</span>
                  <span className="parameter-value">{formatValue(inputs.tankVolume, 'm³')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Number of Tanks</span>
                  <span className="parameter-value">{formatValue(inputs.numTanks)}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Target Fish Weight</span>
                  <span className="parameter-value">{formatValue(inputs.targetFishWeight, 'g')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Target Number of Fish</span>
                  <span className="parameter-value">{formatValue(inputs.targetNumFish)}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Feed Rate</span>
                  <span className="parameter-value">{formatValue(inputs.feedRate, '% of biomass/day')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Feed Protein Content</span>
                  <span className="parameter-value">{formatValue(inputs.feedProtein, '%')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Production Target</span>
                  <span className="parameter-value">{formatValue(inputs.productionTarget_t, 't/year')}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Target Species</span>
                  <span className="parameter-value">{formatValue(inputs.targetSpecies)}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Harvest Frequency</span>
                  <span className="parameter-value">{formatValue(inputs.harvestFrequency)}</span>
                </div>
                <div className="parameter-row">
                  <span className="parameter-label">Initial Weight</span>
                  <span className="parameter-value">{formatValue(inputs.initialWeight, 'g')}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Stage-wise Parameters */}
        {(inputs.FCR_Stage1 !== undefined || inputs.FCR_Stage2 !== undefined || inputs.FCR_Stage3 !== undefined) && (
          <Col md={12}>
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-diagram-3-fill me-2"></i>
                  Stage-wise Parameters
                </h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="stage-section">
                      <h6 className="text-primary mb-2">
                        <i className="bi bi-1-circle-fill me-2"></i>
                        Stage 1 (Juvenile)
                      </h6>
                      <div className="parameter-grid">
                        <div className="parameter-row">
                          <span className="parameter-label">FCR</span>
                          <span className="parameter-value">{formatValue(inputs.FCR_Stage1)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Feed Protein (%)</span>
                          <span className="parameter-value">{formatValue(inputs.FeedProtein_Stage1, '%')}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Mortality (%)</span>
                          <span className="parameter-value">{formatValue(inputs.Estimated_mortality_Stage1, '%')}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="stage-section">
                      <h6 className="text-warning mb-2">
                        <i className="bi bi-2-circle-fill me-2"></i>
                        Stage 2 (Fingerling)
                      </h6>
                      <div className="parameter-grid">
                        <div className="parameter-row">
                          <span className="parameter-label">FCR</span>
                          <span className="parameter-value">{formatValue(inputs.FCR_Stage2)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Feed Protein (%)</span>
                          <span className="parameter-value">{formatValue(inputs.FeedProtein_Stage2, '%')}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Mortality (%)</span>
                          <span className="parameter-value">{formatValue(inputs.Estimated_mortality_Stage2, '%')}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="stage-section">
                      <h6 className="text-danger mb-2">
                        <i className="bi bi-3-circle-fill me-2"></i>
                        Stage 3 (Growout)
                      </h6>
                      <div className="parameter-grid">
                        <div className="parameter-row">
                          <span className="parameter-label">FCR</span>
                          <span className="parameter-value">{formatValue(inputs.FCR_Stage3)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Feed Protein (%)</span>
                          <span className="parameter-value">{formatValue(inputs.FeedProtein_Stage3, '%')}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Mortality (%)</span>
                          <span className="parameter-value">{formatValue(inputs.Estimated_mortality_Stage3, '%')}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* System Efficiency Parameters */}
        <Col md={12}>
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-speedometer2 me-2"></i>
                System Efficiency Parameters
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <div className="parameter-row">
                    <span className="parameter-label">O₂ Absorption Efficiency</span>
                    <span className="parameter-value">{formatValue(inputs.o2Absorption, '%')}</span>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="parameter-row">
                    <span className="parameter-label">CO₂ Removal Efficiency</span>
                    <span className="parameter-value">{formatValue(inputs.co2Removal, '%')}</span>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="parameter-row">
                    <span className="parameter-label">TSS Removal Efficiency</span>
                    <span className="parameter-value">{formatValue(inputs.tssRemoval, '%')}</span>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="parameter-row">
                    <span className="parameter-label">TAN Removal Efficiency</span>
                    <span className="parameter-value">{formatValue(inputs.tanRemoval, '%')}</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
          </>
        )}

        {/* Stage 7 Specific Parameters - Bio Filter & Sump Size */}
        {(inputs.mbbrLocation !== undefined || inputs.mediaToWaterVolumeRatio !== undefined || inputs.volumetricNitrificationRateVtr !== undefined) && (
          <Col md={12}>
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-gear-wide-connected me-2"></i>
                  Stage 7: Bio Filter & Sump Size Parameters
                </h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="parameter-row">
                      <span className="parameter-label">MBBR Location</span>
                      <span className="parameter-value">{formatValue(inputs.mbbrLocation)}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="parameter-row">
                      <span className="parameter-label">Media to Water Volume Ratio</span>
                      <span className="parameter-value">{formatValue(inputs.mediaToWaterVolumeRatio)}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="parameter-row">
                      <span className="parameter-label">Volumetric Nitrification Rate (VTR)</span>
                      <span className="parameter-value">{formatValue(inputs.volumetricNitrificationRateVtr, 'g N/m³/day')}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="parameter-row">
                      <span className="parameter-label">Standalone Height/Diameter Ratio</span>
                      <span className="parameter-value">{formatValue(inputs.standaloneHeightDiameterRatio)}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="parameter-row">
                      <span className="parameter-label">Pump Stop Overflow Volume</span>
                      <span className="parameter-value">{formatValue(inputs.pumpStopOverflowVolume, 'm³')}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="parameter-row">
                      <span className="parameter-label">Feed Conversion Ratio</span>
                      <span className="parameter-value">{formatValue(inputs.feedConversionRatio)}</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Passive Nitrification Rates */}
        {(inputs.passiveNitrificationRateStage1 !== undefined || inputs.passiveNitrificationRateStage2 !== undefined || inputs.passiveNitrificationRateStage3 !== undefined) && (
          <Col md={12}>
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-arrow-up-circle me-2"></i>
                  Passive Nitrification Rates
                </h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="parameter-row">
                      <span className="parameter-label">Passive Nitrification Rate (Stage 1)</span>
                      <span className="parameter-value">{formatValue(inputs.passiveNitrificationRateStage1, '%')}</span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="parameter-row">
                      <span className="parameter-label">Passive Nitrification Rate (Stage 2)</span>
                      <span className="parameter-value">{formatValue(inputs.passiveNitrificationRateStage2, '%')}</span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="parameter-row">
                      <span className="parameter-label">Passive Nitrification Rate (Stage 3)</span>
                      <span className="parameter-value">{formatValue(inputs.passiveNitrificationRateStage3, '%')}</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Tank Design Parameters */}
        {(inputs.numTanksStage1 !== undefined || inputs.tankDdRatioStage1 !== undefined || inputs.tankFreeboardStage1 !== undefined) && (
          <Col md={12}>
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-cylinder me-2"></i>
                  Tank Design Parameters
                </h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {/* Stage 1 Tank Design */}
                  <Col md={4}>
                    <div className="stage-section">
                      <h6 className="text-primary mb-2">
                        <i className="bi bi-1-circle-fill me-2"></i>
                        Stage 1 (Juvenile)
                      </h6>
                      <div className="parameter-grid">
                        <div className="parameter-row">
                          <span className="parameter-label">Number of Tanks</span>
                          <span className="parameter-value">{formatValue(inputs.numTanksStage1)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Tank Diameter:Depth Ratio</span>
                          <span className="parameter-value">{formatValue(inputs.tankDdRatioStage1)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Tank Freeboard</span>
                          <span className="parameter-value">{formatValue(inputs.tankFreeboardStage1, 'm')}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  {/* Stage 2 Tank Design */}
                  <Col md={4}>
                    <div className="stage-section">
                      <h6 className="text-warning mb-2">
                        <i className="bi bi-2-circle-fill me-2"></i>
                        Stage 2 (Fingerling)
                      </h6>
                      <div className="parameter-grid">
                        <div className="parameter-row">
                          <span className="parameter-label">Number of Tanks</span>
                          <span className="parameter-value">{formatValue(inputs.numTanksStage2)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Tank Diameter:Depth Ratio</span>
                          <span className="parameter-value">{formatValue(inputs.tankDdRatioStage2)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Tank Freeboard</span>
                          <span className="parameter-value">{formatValue(inputs.tankFreeboardStage2, 'm')}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  {/* Stage 3 Tank Design */}
                  <Col md={4}>
                    <div className="stage-section">
                      <h6 className="text-danger mb-2">
                        <i className="bi bi-3-circle-fill me-2"></i>
                        Stage 3 (Growout)
                      </h6>
                      <div className="parameter-grid">
                        <div className="parameter-row">
                          <span className="parameter-label">Number of Tanks</span>
                          <span className="parameter-value">{formatValue(inputs.numTanksStage3)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Tank Diameter:Depth Ratio</span>
                          <span className="parameter-value">{formatValue(inputs.tankDdRatioStage3)}</span>
                        </div>
                        <div className="parameter-row">
                          <span className="parameter-label">Tank Freeboard</span>
                          <span className="parameter-value">{formatValue(inputs.tankFreeboardStage3, 'm')}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default InputsDisplay;
