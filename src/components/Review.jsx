import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';
import { computeBasic } from '../utils/calculations'; // Import the calculation function

const Review = ({ formData, goToStep }) => {
  const navigate = useNavigate();

  const handleCalculateAndNavigate = () => {
    // Generate a unique ID for the report (in a real app, this would come from a backend)
    const reportId = 'rep-' + new Date().getTime();
    
    // Call the calculation function to get the outputs
    const outputs = computeBasic(formData);

    // Navigate to the Mass Balance Report page, passing the data in the state
    navigate(`/reports/${reportId}`, {
      state: {
        inputs: formData,
        outputs: outputs,
      },
    });
  };

  return (
    <div className="review-page">
      <h4>Review Your Inputs</h4>
      <div className="summary-section">
        <h5>Water Quality Parameters <a href="#" onClick={() => goToStep(1)}>Change</a></h5>
        <p>Water Temperature: {formData.waterTemp}°C</p>
        <p>pH Level: {formData.pH}</p>
        {/* ... and so on for all inputs */}
      </div>

      <div className="summary-section">
        <h5>Production Information <a href="#" onClick={() => goToStep(1)}>Change</a></h5>
        <p>Tank Volume: {formData.tankVolume}</p>
        <p>Number of Tanks: {formData.numTanks}</p>
      </div>

      <div className="summary-section">
        <h5>Efficiency <a href="#" onClick={() => goToStep(1)}>Change</a></h5>
        <p>O₂ absorption: {formData.o2Absorption}%</p>
      </div>

      <div className="report-options">
        <Form.Check type="radio" label="Basic" name="reportType" defaultChecked />
        <Form.Check
          type="radio"
          label="Advanced (Coming Soon)"
          name="reportType"
          disabled
          tooltip="Included in paid plans, launching soon."
        />
      </div>

      <div className="navigation-buttons">
        <Button variant="secondary" onClick={() => goToStep(1)}>Back</Button>
        <Button variant="primary" onClick={handleCalculateAndNavigate}>
          Calculate Mass Balance
        </Button>
      </div>
    </div>
  );
};

export default Review;