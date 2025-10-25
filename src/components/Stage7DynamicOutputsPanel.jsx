import React, { useState, useEffect } from 'react';
import './DynamicOutputsPanel.css';

const Stage7DynamicOutputsPanel = ({ formData, liveOutputs, step4Data, onFieldUpdate }) => {
  const [outputs, setOutputs] = useState({
    bioFilter: {
      status: 'empty', // 'empty', 'loading', 'populated', 'error'
      data: null
    },
    step4Stage1: {
      status: 'empty',
      data: null
    },
    step4Stage2: {
      status: 'empty',
      data: null
    },
    step4Stage3: {
      status: 'empty',
      data: null
    },
    stage1: {
      status: 'empty',
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

  // Update outputs only from live API response data
  useEffect(() => {
    if (!liveOutputs) return;
    
    console.log('[Stage7DynamicPanel] Received liveOutputs:', liveOutputs);
    
    setOutputs(prev => {
      const next = { ...prev };
      
      // Map live API response to our output structure
      Object.entries(liveOutputs).forEach(([sectionKey, sectionData]) => {
        if (!sectionData) return;
        
        console.log(`[Stage7DynamicPanel] Processing section ${sectionKey}:`, sectionData);
        
        // Handle Stage 4 data from live API response
        if (sectionKey === 'step4' && sectionData.data) {
          if (sectionData.data.stage1) {
            next.step4Stage1 = {
              status: sectionData.status || 'populated',
              data: sectionData.data.stage1
            };
          }
          if (sectionData.data.stage2) {
            next.step4Stage2 = {
              status: sectionData.status || 'populated',
              data: sectionData.data.stage2
            };
          }
          if (sectionData.data.stage3) {
            next.step4Stage3 = {
              status: sectionData.status || 'populated',
              data: sectionData.data.stage3
            };
          }
          return;
        }
        
        // Map API response sections to our internal structure
        let mappedKey = sectionKey;
        if (sectionKey === 'biofilter') {
          mappedKey = 'bioFilter';
        } else if (sectionKey === 'sump') {
          // Sump data might be part of stage data, we'll handle it separately
          return;
        }
        
        const prevSection = next[mappedKey] || { status: 'empty', data: null };
        next[mappedKey] = {
          status: sectionData.status || 'populated',
          data: sectionData.data || prevSection.data
        };
      });
      
      console.log('[Stage7DynamicPanel] Updated outputs:', next);
      return next;
    });
  }, [liveOutputs]);

  // Update Step 4 data when step4Data prop changes
  useEffect(() => {
    if (!step4Data) return;
    
    console.log('[Stage7DynamicPanel] Received step4Data:', step4Data);
    
    setOutputs(prev => {
      const next = { ...prev };
      
      if (step4Data.data) {
        if (step4Data.data.stage1) {
          next.step4Stage1 = {
            status: step4Data.status || 'populated',
            data: step4Data.data.stage1
          };
        }
        if (step4Data.data.stage2) {
          next.step4Stage2 = {
            status: step4Data.status || 'populated',
            data: step4Data.data.stage2
          };
        }
        if (step4Data.data.stage3) {
          next.step4Stage3 = {
            status: step4Data.status || 'populated',
            data: step4Data.data.stage3
          };
        }
      }
      
      console.log('[Stage7DynamicPanel] Updated Step 4 outputs:', next);
      return next;
    });
  }, [step4Data]);

  const renderSection = (title, sectionKey, fields) => {
    const section = outputs[sectionKey];
    const status = section?.status || 'empty';
    const data = section?.data || {};

    console.log(`[Stage7DynamicPanel] Rendering section ${sectionKey}:`, { status, data });

    return (
      <div className="section-container">
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
      <h5 className="panel-title">Dynamic Outputs</h5>
      
      
      <h6>Fish Holding Tank Design</h6>
      
      {/* Juvenile (Stage 1) Tank Design */}
      {renderSection('Juvenile (Stage 1) Tank Design', 'step4Stage1', [
        { key: 'volumeRequiredStage1', label: 'Volume Required', unit: 'm³' },
        { key: 'tankVolumeEachStage1', label: 'Tank Volume Each', unit: 'm³' },
        { key: 'tankDiaStage1', label: 'Tank Diameter', unit: 'm' },
        { key: 'tankDepthStage1', label: 'Tank Water Depth', unit: 'm' },
        { key: 'tankTotalVolumeStage1', label: 'Total Tank Volume', unit: 'm³' }
      ])}

      {/* Fingerling (Stage 2) Tank Design */}
      {renderSection('Fingerling (Stage 2) Tank Design', 'step4Stage2', [
        { key: 'volumeRequiredStage2', label: 'Volume Required', unit: 'm³' },
        { key: 'tankVolumeEachStage2', label: 'Tank Volume Each', unit: 'm³' },
        { key: 'tankDiaStage2', label: 'Tank Diameter', unit: 'm' },
        { key: 'tankDepthStage2', label: 'Tank Water Depth', unit: 'm' },
        { key: 'tankTotalVolumeStage2', label: 'Total Tank Volume', unit: 'm³' }
      ])}

      {/* Growout (Stage 3) Tank Design */}
      {renderSection('Growout (Stage 3) Tank Design', 'step4Stage3', [
        { key: 'volumeRequiredStage3', label: 'Volume Required', unit: 'm³' },
        { key: 'tankVolumeEachStage3', label: 'Tank Volume Each', unit: 'm³' },
        { key: 'tankDiaStage3', label: 'Tank Diameter', unit: 'm' },
        { key: 'tankDepthStage3', label: 'Tank Water Depth', unit: 'm' },
        { key: 'tankTotalVolumeStage3', label: 'Total Tank Volume', unit: 'm³' }
      ])}

      <h6>BioFilter and Sump Sizing</h6>
      
      {/* Bio Filter Parameters */}
      {renderSection('Bio Filter Parameters', 'bioFilter', [
        { key: 'bioVTR_use', label: 'VTR Used' },
        { key: 'bio_VTR_compensation', label: 'VTR Compensation' },
        { key: 'bio_shape', label: 'Shape' }
      ])}

      {/* Juvenile (Stage 1) Results */}
      {renderSection('Juvenile (Stage 1) Results', 'stage1', [
        { key: 'DailyTAN_gday_Stage1', label: 'Daily TAN (g/day)', unit: 'g/day' },
        { key: 'DailyTANpassive_gday_Stage1', label: 'Daily TAN Passive (g/day)', unit: 'g/day' },
        { key: 'design_VTR_Stage1', label: 'Design VTR', unit: 'g/m³/day' },
        { key: 'biomedia_Required_Stage1', label: 'Media Required', unit: 'm³' },
        { key: 'MBBR_vol_Stage1', label: 'MBBR Volume', unit: 'm³' },
        { key: 'MBBR_dia_Stage1', label: 'Vessel Diameter', unit: 'm' },
        { key: 'MBBR_high_Stage1', label: 'Vessel Height', unit: 'm' },
        { key: 'MBBR_highRect_Stage1', label: 'Rect Height', unit: 'm' },
        { key: 'MBBR_wid_Stage1', label: 'Rect Width', unit: 'm' },
        { key: 'MBBR_len_Stage1', label: 'Rect Length', unit: 'm' },
        { key: 'MBBR_air_Stage1', label: 'Air Required', unit: 'm³/hr' },
        { key: 'MBBR_air_Stage1_spare', label: 'Air Required (Spare)', unit: 'm³/hr' },
        { key: 'sump_Size_3min_Stage1', label: 'Sump Size (3min)', unit: 'm³' },
        { key: 'sump_Size_5min_Stage1', label: 'Sump Size (5min)', unit: 'm³' },
        { key: 'sump_totvol_Stage1', label: 'Sump Total Volume', unit: 'm³' },
        { key: 'vol_TotalSyst_Stage1', label: 'Total System Volume', unit: 'm³' }
      ])}

      {/* Fingerling (Stage 2) Results */}
      {renderSection('Fingerling (Stage 2) Results', 'stage2', [
        { key: 'DailyTAN_gday_Stage2', label: 'Daily TAN (g/day)', unit: 'g/day' },
        { key: 'DailyTANpassive_gday_Stage2', label: 'Daily TAN Passive (g/day)', unit: 'g/day' },
        { key: 'design_VTR_Stage2', label: 'Design VTR', unit: 'g/m³/day' },
        { key: 'biomedia_Required_Stage2', label: 'Media Required', unit: 'm³' },
        { key: 'MBBR_vol_Stage2', label: 'MBBR Volume', unit: 'm³' },
        { key: 'MBBR_dia_Stage2', label: 'Vessel Diameter', unit: 'm' },
        { key: 'MBBR_high_Stage2', label: 'Vessel Height', unit: 'm' },
        { key: 'MBBR_highRect_Stage2', label: 'Rect Height', unit: 'm' },
        { key: 'MBBR_wid_Stage2', label: 'Rect Width', unit: 'm' },
        { key: 'MBBR_len_Stage2', label: 'Rect Length', unit: 'm' },
        { key: 'MBBR_air_Stage2', label: 'Air Required', unit: 'm³/hr' },
        { key: 'MBBR_air_Stage2_spare', label: 'Air Required (Spare)', unit: 'm³/hr' },
        { key: 'sump_Size_3min_Stage2', label: 'Sump Size (3min)', unit: 'm³' },
        { key: 'sump_Size_5min_Stage2', label: 'Sump Size (5min)', unit: 'm³' },
        { key: 'sump_totvol_Stage2', label: 'Sump Total Volume', unit: 'm³' },
        { key: 'vol_TotalSyst_Stage2', label: 'Total System Volume', unit: 'm³' }
      ])}

      {/* Growout (Stage 3) Results */}
      {renderSection('Growout (Stage 3) Results', 'stage3', [
        { key: 'DailyTAN_gday_Stage3', label: 'Daily TAN (g/day)', unit: 'g/day' },
        { key: 'DailyTANpassive_gday_Stage3', label: 'Daily TAN Passive (g/day)', unit: 'g/day' },
        { key: 'design_VTR_Stage3', label: 'Design VTR', unit: 'g/m³/day' },
        { key: 'biomedia_Required_Stage3', label: 'Media Required', unit: 'm³' },
        { key: 'MBBR_vol_Stage3', label: 'MBBR Volume', unit: 'm³' },
        { key: 'MBBR_dia_Stage3', label: 'Vessel Diameter', unit: 'm' },
        { key: 'MBBR_high_Stage3', label: 'Vessel Height', unit: 'm' },
        { key: 'MBBR_highRect_Stage3', label: 'Rect Height', unit: 'm' },
        { key: 'MBBR_wid_Stage3', label: 'Rect Width', unit: 'm' },
        { key: 'MBBR_len_Stage3', label: 'Rect Length', unit: 'm' },
        { key: 'MBBR_air_Stage3', label: 'Air Required', unit: 'm³/hr' },
        { key: 'MBBR_air_Stage3_spare', label: 'Air Required (Spare)', unit: 'm³/hr' },
        { key: 'sump_Size_3min_Stage3', label: 'Sump Size (3min)', unit: 'm³' },
        { key: 'sump_Size_5min_Stage3', label: 'Sump Size (5min)', unit: 'm³' },
        { key: 'sump_totvol_Stage3', label: 'Sump Total Volume', unit: 'm³' },
        { key: 'vol_TotalSyst_Stage3', label: 'Total System Volume', unit: 'm³' }
      ])}
    </div>
  );
};

export default Stage7DynamicOutputsPanel;