import React, { useState, useEffect } from 'react';
import './DynamicOutputsPanel.css';

const DynamicOutputsPanel = ({ formData, liveOutputs, onFieldUpdate }) => {
  const [outputs, setOutputs] = useState({
    oxygen: {
      status: 'empty', // 'empty', 'loading', 'populated', 'error'
      data: null
    },
    tss: {
      status: 'empty',
      data: null
    },
    co2: {
      status: 'empty',
      data: null
    },
    tan: {
      status: 'empty',
      data: null
    },
    stage6: {
      status: 'empty',
      data: null
    },
    limitingFactor: {
      status: 'empty',
      data: null
    }
  });

  // Placeholder for short-polling integration
  useEffect(() => {
    // This will be replaced with actual polling logic when APIs are ready
    console.log('Dynamic outputs ready for polling integration');
    
    // TODO: Implement short-polling with debounce when backend APIs are ready
    // Each time user types in input fields → polling API calls → update specific fields
  }, []);

  // Merge incoming live outputs from parent (short-poll updates)
  useEffect(() => {
    if (!liveOutputs) return;
    setOutputs(prev => {
      const next = { ...prev };
      Object.entries(liveOutputs).forEach(([sectionKey, sectionData]) => {
        if (!sectionData) return;
        const prevSection = next[sectionKey] || { status: 'empty', data: null };
        next[sectionKey] = {
          status: sectionData.status || 'populated',
          data: sectionData.data || prevSection.data,
          lastUpdated: new Date()
        };
      });
      return next;
    });
  }, [liveOutputs]);

  const updateOutput = (section, data, status = 'populated') => {
    setOutputs(prev => ({
      ...prev,
      [section]: {
        status,
        data,
        lastUpdated: new Date()
      }
    }));
  };

  // Expose updateOutput function for parent component to use with polling APIs
  // When polling APIs are ready, parent can call: updateOutput('waterQuality', data, 'populated')
  // This will be used when short-polling APIs are implemented

  const renderSection = (title, sectionKey, fields) => {
    const section = outputs[sectionKey];
    
    return (
      <div className={`dynamic-section ${section.status}`} key={sectionKey}>
        <h6 className="section-title">{title}</h6>
        <div className="section-content">
          {fields.map((field, index) => (
            <div key={index} className="field-row">
              <span className="field-name">{field.name}:</span>
              <span className={`field-value ${section.status}`}>
                {section.status === 'error' ? 'Error loading data' : 
                 section.status === 'loading' ? '---' :
                 section.status === 'populated' && section.data ? 
                 `${section.data[field.key] || '---'}${field.unit ? ' ' + field.unit : ''}` : '---'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dynamic-outputs-panel">
      <h5 className="panel-title">Dynamic Outputs</h5>
      <h6>Mass Balance</h6>
      
      {renderSection('Oxygen', 'oxygen', [
        { name: 'O₂ saturation adjusted', key: 'saturationAdjustedMgL', unit: 'mg/L' },
        { name: 'Min DO (use)', key: 'MINDO_use', unit: 'mg/L' },
        { name: 'Effluent concentration', key: 'effluentMgL', unit: 'mg/L' },
        { name: 'Consumption', key: 'consMgPerDay', unit: 'mg/day' },
        { name: 'Consumption', key: 'consKgPerDay', unit: 'kg/day' }
      ])}

      {renderSection('Total Suspended Solids (TSS)', 'tss', [
        { name: 'Effluent concentration', key: 'effluentMgL', unit: 'mg/L' },
        { name: 'Max TSS (use)', key: 'MAXTSS_use', unit: 'mg/L' },
        { name: 'Production', key: 'prodMgPerDay', unit: 'mg/day' },
        { name: 'Production', key: 'prodKgPerDay', unit: 'kg/day' }
      ])}

      {renderSection('Carbon Dioxide (CO₂)', 'co2', [
        { name: 'Effluent concentration', key: 'effluentMgL', unit: 'mg/L' },
        { name: 'Max CO₂ (use)', key: 'MAXCO2_use', unit: 'mg/L' },
        { name: 'Production', key: 'prodMgPerDay', unit: 'mg/day' },
        { name: 'Production', key: 'prodKgPerDay', unit: 'kg/day' }
      ])}

      {renderSection('Total Ammonia Nitrogen (TAN)', 'tan', [
        { name: 'Effluent concentration', key: 'effluentMgL', unit: 'mg/L' },
        { name: 'Max TAN (use)', key: 'MAXTAN_use', unit: 'mg/L' },
        { name: 'Production', key: 'prodMgPerDay', unit: 'mg/day' },
        { name: 'Production', key: 'prodKgPerDay', unit: 'kg/day' }
      ])}

      <h6>Controlling Flow Rate</h6>
      {renderSection('Stage 6: Juvenile (Stage 1)', 'stage6', [
        { name: 'Oxygen L/min', key: 'oxygen_l_per_min', unit: 'L/min' },
        { name: 'Oxygen m³/hr', key: 'oxygen_m3_per_hr', unit: 'm³/hr' },
        { name: 'CO₂ L/min', key: 'co2_l_per_min', unit: 'L/min' },
        { name: 'CO₂ m³/hr', key: 'co2_m3_per_hr', unit: 'm³/hr' },
        { name: 'TSS L/min', key: 'tss_l_per_min', unit: 'L/min' },
        { name: 'TSS m³/hr', key: 'tss_m3_per_hr', unit: 'm³/hr' },
        { name: 'TAN L/min', key: 'tan_l_per_min', unit: 'L/min' },
        { name: 'TAN m³/hr', key: 'tan_m3_per_hr', unit: 'm³/hr' }
      ])}

      {renderSection('Limiting Factor (Stage 1)', 'limitingFactor', [
        { name: 'Factor', key: 'factor' },
        { name: 'Flow (L/min)', key: 'flow_l_per_min', unit: 'L/min' },
        { name: 'Flow (m³/hr)', key: 'flow_m3_per_hr', unit: 'm³/hr' }
      ])}
    </div>
  );
};

export default DynamicOutputsPanel;