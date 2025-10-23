import React, { useState, useEffect, useMemo } from 'react';
import './DynamicOutputsPanel.css';

const Stage8DynamicOutputsPanel = ({ formData, liveOutputs, onFieldUpdate }) => {
  const [outputs, setOutputs] = useState({
    stage1: {
      status: 'empty', // 'empty', 'loading', 'populated', 'error'
      data: null
    },
    stage2: {
      status: 'empty',
      data: null
    },
    stage3: {
      status: 'empty',
      data: null
    }
  });

  // Calculate Stage 8 specific outputs based on form data
  const calculateStage8Outputs = useMemo(() => {
    if (!formData) return null;

    // Mock calculations for UI preview (replace with actual calculations when backend is ready)
    const calculateStageData = (stageNum) => {
      const tankVolume = formData.tankVolume || 0;
      const numTanks = formData.numTanks || 0;
      const feedRate = formData.feedRate || 0;
      const targetFishWeight = formData.targetFishWeight || 0;
      
      // Mock calculations for UI preview
      const limitingFlowRate = (tankVolume * numTanks * stageNum * 0.1) || 0;
      const qLsStage = (limitingFlowRate * 0.0167) || 0; // Convert m³/hr to L/s
      const pumpHead = 10.0; // Mock head pressure
      const pumpEfficiency = 0.7; // Mock pump efficiency
      const motorEfficiency = 0.9; // Mock motor efficiency
      const hydraulicPower = (qLsStage * pumpHead * 9.81) / 1000; // Mock hydraulic power calculation
      const shaftPower = hydraulicPower / pumpEfficiency; // Mock shaft power calculation

      return {
        limitingFlowRate: limitingFlowRate,
        Q_l_s: qLsStage,
        pump_Head: pumpHead,
        n_Pump: pumpEfficiency,
        n_Motor: motorEfficiency,
        pump_HydPower: hydraulicPower,
        pump_PowerkW: shaftPower
      };
    };

    return {
      stage1: calculateStageData(1),
      stage2: calculateStageData(2),
      stage3: calculateStageData(3)
    };
  }, [formData]);

  // Update outputs when calculations change
  useEffect(() => {
    if (calculateStage8Outputs) {
      setOutputs(prev => ({
        stage1: {
          status: 'populated',
          data: calculateStage8Outputs.stage1
        },
        stage2: {
          status: 'populated',
          data: calculateStage8Outputs.stage2
        },
        stage3: {
          status: 'populated',
          data: calculateStage8Outputs.stage3
        }
      }));
    }
  }, [calculateStage8Outputs]);

  // Merge incoming live outputs from parent (for future API integration)
  useEffect(() => {
    if (!liveOutputs) return;
    setOutputs(prev => {
      const next = { ...prev };
      Object.entries(liveOutputs).forEach(([sectionKey, sectionData]) => {
        if (!sectionData) return;
        const prevSection = next[sectionKey] || { status: 'empty', data: null };
        next[sectionKey] = {
          status: sectionData.status || 'populated',
          data: sectionData.data || prevSection.data
        };
      });
      return next;
    });
  }, [liveOutputs]);

  const renderSection = (title, sectionKey, fields) => {
    const section = outputs[sectionKey];
    const status = section?.status || 'empty';
    const data = section?.data || {};

    return (
      <div className={`dynamic-section ${status}`} key={sectionKey}>
        <h6 className="section-title">{title}</h6>
        <div className="section-content">
          {fields.map((field, idx) => {
            const value = data[field.key];
            const display = status === 'error'
              ? 'Error'
              : status === 'loading'
                ? 'Loading...'
                : (value !== undefined && value !== null ? value : '---');
            
            return (
              <div key={idx} className="field-row">
                <span className="field-name">{field.label}:</span>
                <span className={`field-value ${status}`}>
                  {display}{field.unit ? ` ${field.unit}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dynamic-outputs-panel">
      <h5 className="panel-title">Stage 8 Dynamic Outputs</h5>
      
      {/* Stage 1 Parameters */}
      {renderSection('Stage 1 Parameters', 'stage1', [
        { key: 'limitingFlowRate', label: 'Limiting Flow Rate', unit: 'm³/hr' },
        { key: 'Q_l_s', label: 'Q_l.s_Stage1', unit: 'L/s' },
        { key: 'pump_Head', label: 'Total Dynamic Head Pressure', unit: 'm' },
        { key: 'n_Pump', label: 'Pump Efficiency', unit: '' },
        { key: 'n_Motor', label: 'Motor Efficiency', unit: '' },
        { key: 'pump_HydPower', label: 'Hydraulic Power', unit: 'kW' },
        { key: 'pump_PowerkW', label: 'Required Shaft Power', unit: 'kW' }
      ])}

      {/* Stage 2 Parameters */}
      {renderSection('Stage 2 Parameters', 'stage2', [
        { key: 'limitingFlowRate', label: 'Limiting Flow Rate', unit: 'm³/hr' },
        { key: 'Q_l_s', label: 'Q_l.s_Stage2', unit: 'L/s' },
        { key: 'pump_Head', label: 'Total Dynamic Head Pressure', unit: 'm' },
        { key: 'n_Pump', label: 'Pump Efficiency', unit: '' },
        { key: 'n_Motor', label: 'Motor Efficiency', unit: '' },
        { key: 'pump_HydPower', label: 'Hydraulic Power', unit: 'kW' },
        { key: 'pump_PowerkW', label: 'Required Shaft Power', unit: 'kW' }
      ])}

      {/* Stage 3 Parameters */}
      {renderSection('Stage 3 Parameters', 'stage3', [
        { key: 'limitingFlowRate', label: 'Limiting Flow Rate', unit: 'm³/hr' },
        { key: 'Q_l_s', label: 'Q_l.s_Stage3', unit: 'L/s' },
        { key: 'pump_Head', label: 'Total Dynamic Head Pressure', unit: 'm' },
        { key: 'n_Pump', label: 'Pump Efficiency', unit: '' },
        { key: 'n_Motor', label: 'Motor Efficiency', unit: '' },
        { key: 'pump_HydPower', label: 'Hydraulic Power', unit: 'kW' },
        { key: 'pump_PowerkW', label: 'Required Shaft Power', unit: 'kW' }
      ])}
    </div>
  );
};

export default Stage8DynamicOutputsPanel;
