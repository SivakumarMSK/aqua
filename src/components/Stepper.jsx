import React from 'react';
import '../styles/CreateDesignSystem.css';

const Stepper = ({ currentStep, steps }) => {
  const defaultSteps = ['Initial', 'Water Quality', 'Production', 'Efficiency', 'Report'];
  const stepList = Array.isArray(steps) && steps.length ? steps : defaultSteps;
  return (
    <div className="stepper-container">
      {stepList.map((label, index) => (
        <div key={index} className={`step ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}>
          <div className="step-circle">{index + 1}</div>
          <div className="step-label">{label}</div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;