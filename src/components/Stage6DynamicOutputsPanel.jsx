import React, { useState, useEffect, useMemo } from 'react';
import './DynamicOutputsPanel.css';

const Stage6DynamicOutputsPanel = ({ formData, liveOutputs, onFieldUpdate, massBalanceData, limitingFactor, stage8Report }) => {
  const [outputs, setOutputs] = useState({
    step6: {
      status: 'empty', // 'empty', 'loading', 'populated', 'error'
      data: null
    },
    massBalance: {
      status: 'empty',
      data: null
    },
    limitingFactor: {
      status: 'empty',
      data: null
    },
    stage8: {
      status: 'empty',
      data: null
    }
  });

  // Calculate Stage 6 specific outputs based on form data
  const calculateStage6Outputs = useMemo(() => {
    if (!formData) return null;

    // Mock calculations for UI preview (replace with actual calculations when backend is ready)
    const calculateStep6Data = () => {
      const tankVolume = formData.tankVolume || 0;
      const numTanks = formData.numTanks || 0;
      const feedRate = formData.feedRate || 0;
      const targetFishWeight = formData.targetFishWeight || 0;
      
      // Mock calculations for UI preview
      const oxygenLPerMin = (tankVolume * numTanks * 0.5) || 0;
      const oxygenM3PerHr = oxygenLPerMin * 0.06;
      const co2LPerMin = (tankVolume * numTanks * 0.3) || 0;
      const co2M3PerHr = co2LPerMin * 0.06;
      const tssLPerMin = (tankVolume * numTanks * 0.2) || 0;
      const tssM3PerHr = tssLPerMin * 0.06;
      const tanLPerMin = (tankVolume * numTanks * 0.1) || 0;
      const tanM3PerHr = tanLPerMin * 0.06;

      return {
        // Stage 1
        oxygen: {
          l_per_min: oxygenLPerMin,
          m3_per_hr: oxygenM3PerHr
        },
        co2: {
          l_per_min: co2LPerMin,
          m3_per_hr: co2M3PerHr
        },
        tss: {
          l_per_min: tssLPerMin,
          m3_per_hr: tssM3PerHr
        },
        tan: {
          l_per_min: tanLPerMin,
          m3_per_hr: tanM3PerHr
        },
        
        // Stage 2
        stage2_oxygen: {
          l_per_min: oxygenLPerMin * 1.5,
          m3_per_hr: oxygenM3PerHr * 1.5
        },
        stage2_co2: {
          l_per_min: co2LPerMin * 1.5,
          m3_per_hr: co2M3PerHr * 1.5
        },
        stage2_tss: {
          l_per_min: tssLPerMin * 1.5,
          m3_per_hr: tssM3PerHr * 1.5
        },
        stage2_tan: {
          l_per_min: tanLPerMin * 1.5,
          m3_per_hr: tanM3PerHr * 1.5
        },
        
        // Stage 3
        stage3_oxygen: {
          l_per_min: oxygenLPerMin * 2.0,
          m3_per_hr: oxygenM3PerHr * 2.0
        },
        stage3_co2: {
          l_per_min: co2LPerMin * 2.0,
          m3_per_hr: co2M3PerHr * 2.0
        },
        stage3_tss: {
          l_per_min: tssLPerMin * 2.0,
          m3_per_hr: tssM3PerHr * 2.0
        },
        stage3_tan: {
          l_per_min: tanLPerMin * 2.0,
          m3_per_hr: tanM3PerHr * 2.0
        }
      };
    };

    const calculateMassBalanceData = () => {
      const tankVolume = formData.tankVolume || 0;
      const numTanks = formData.numTanks || 0;
      const feedRate = formData.feedRate || 0;
      const targetFishWeight = formData.targetFishWeight || 0;
      
      // Mock calculations for UI preview
      const oxygenSaturationAdjusted = 8.5;
      const minDO = 6.0;
      const oxygenEffluent = 6.2;
      const oxygenConsMgPerDay = (tankVolume * numTanks * 100) || 0;
      const oxygenConsKgPerDay = oxygenConsMgPerDay / 1000;
      
      const maxTSS = 25.0;
      const tssEffluent = 20.0;
      const tssProdMgPerDay = (tankVolume * numTanks * 150) || 0;
      const tssProdKgPerDay = tssProdMgPerDay / 1000;
      
      const maxCO2 = 15.0;
      const co2Effluent = 12.0;
      const co2ProdMgPerDay = (tankVolume * numTanks * 200) || 0;
      const co2ProdKgPerDay = co2ProdMgPerDay / 1000;
      
      const maxTAN = 1.0;
      const tanEffluent = 0.8;
      const tanProdMgPerDay = (tankVolume * numTanks * 80) || 0;
      const tanProdKgPerDay = tanProdMgPerDay / 1000;

      return {
        oxygen: {
          saturationAdjustedMgL: oxygenSaturationAdjusted,
          MINDO_use: minDO,
          effluentMgL: oxygenEffluent,
          consMgPerDay: oxygenConsMgPerDay,
          consKgPerDay: oxygenConsKgPerDay
        },
        tss: {
          MAXTSS_use: maxTSS,
          effluentMgL: tssEffluent,
          prodMgPerDay: tssProdMgPerDay,
          prodKgPerDay: tssProdKgPerDay
        },
        co2: {
          MAXCO2_use: maxCO2,
          effluentMgL: co2Effluent,
          prodMgPerDay: co2ProdMgPerDay,
          prodKgPerDay: co2ProdKgPerDay
        },
        tan: {
          MAXTAN_use: maxTAN,
          effluentMgL: tanEffluent,
          prodMgPerDay: tanProdMgPerDay,
          prodKgPerDay: tanProdKgPerDay
        }
      };
    };

    return {
      step6: calculateStep6Data(),
      massBalance: calculateMassBalanceData()
    };
  }, [formData]);

  // Update outputs when calculations change or when real data is available
  useEffect(() => {
    if (massBalanceData) {
      // Use real data from API when available (only for mass balance)
      setOutputs(prev => ({
        ...prev,
        massBalance: {
          status: 'populated',
          data: massBalanceData
        }
      }));
    }
  }, [massBalanceData]);

  // Merge incoming live outputs from parent (for future API integration)
  useEffect(() => {
    console.log('[Stage6DynamicPanel] Received liveOutputs:', liveOutputs);
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
        console.log(`[Stage6DynamicPanel] Updated ${sectionKey}:`, next[sectionKey]);
      });
      console.log('[Stage6DynamicPanel] Final outputs state:', next);
      return next;
    });
  }, [liveOutputs]);

  // Handle limitingFactor and stage8Report props
  useEffect(() => {
    if (limitingFactor) {
      setOutputs(prev => ({
        ...prev,
        limitingFactor: {
          status: 'populated',
          data: limitingFactor
        }
      }));
    }
  }, [limitingFactor]);

  useEffect(() => {
    if (stage8Report) {
      setOutputs(prev => ({
        ...prev,
        stage8: {
          status: 'populated',
          data: stage8Report
        }
      }));
    }
  }, [stage8Report]);

  const renderSection = (title, sectionKey, fields) => {
    const section = outputs[sectionKey];
    const status = section?.status || 'empty';
    const data = section?.data || {};

    // Debug logging for Step 6 stages
    if (sectionKey.includes('step6_stage')) {
      console.log(`[Stage6DynamicPanel] ${sectionKey}:`, {
        status,
        data,
        section
      });
    }

    return (
      <div className={`dynamic-section ${status}`} key={sectionKey}>
        <h6 className="section-title">{title}</h6>
        <div className="section-content">
          {fields.map((field, idx) => {
            const value = field.path ? field.path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), data) : data[field.key];
            
            // Debug logging for Step 6 stages
            if (sectionKey.includes('step6_stage')) {
              console.log(`[Stage6DynamicPanel] Field ${field.path || field.key}:`, {
                path: field.path,
                key: field.key,
                value,
                data,
                pathParts: field.path ? field.path.split('.') : null
              });
            }
            
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
    <div className="dynamic-outputs-panel stage6-dynamic-panel">
      <h5 className="panel-title">Stage 6 Dynamic Outputs</h5>
      
      {/* Mass Balance - Oxygen */}
      {renderSection('Mass Balance - Oxygen', 'massBalance_oxygen', [
        { key: 'oxygen.saturationAdjustedMgL', label: 'O₂ Saturation Adjusted', unit: 'mg/L' },
        { key: 'oxygen.MINDO_use', label: 'Min DO (use)', unit: 'mg/L' },
        { key: 'oxygen.effluentMgL', label: 'Effluent Conc.', unit: 'mg/L' },
        { key: 'oxygen.consMgPerDay', label: 'Consumption (mg/day)', unit: 'mg/day' },
        { key: 'oxygen.consKgPerDay', label: 'Consumption (kg/day)', unit: 'kg/day' }
      ])}

      {/* Mass Balance - TSS */}
      {renderSection('Mass Balance - TSS', 'massBalance_tss', [
        { key: 'tss.MAXTSS_use', label: 'Max TSS (use)', unit: 'mg/L' },
        { key: 'tss.effluentMgL', label: 'Effluent Conc.', unit: 'mg/L' },
        { key: 'tss.prodMgPerDay', label: 'Production (mg/day)', unit: 'mg/day' },
        { key: 'tss.prodKgPerDay', label: 'Production (kg/day)', unit: 'kg/day' }
      ])}

      {/* Mass Balance - CO2 */}
      {renderSection('Mass Balance - CO2', 'massBalance_co2', [
        { key: 'co2.MAXCO2_use', label: 'Max CO₂ (use)', unit: 'mg/L' },
        { key: 'co2.effluentMgL', label: 'Effluent Conc.', unit: 'mg/L' },
        { key: 'co2.prodMgPerDay', label: 'Production (mg/day)', unit: 'mg/day' },
        { key: 'co2.prodKgPerDay', label: 'Production (kg/day)', unit: 'kg/day' }
      ])}

      {/* Mass Balance - TAN */}
      {renderSection('Mass Balance - TAN', 'massBalance_tan', [
        { key: 'tan.MAXTAN_use', label: 'Max TAN (use)', unit: 'mg/L' },
        { key: 'tan.effluentMgL', label: 'Effluent Conc.', unit: 'mg/L' },
        { key: 'tan.prodMgPerDay', label: 'Production (mg/day)', unit: 'mg/day' },
        { key: 'tan.prodKgPerDay', label: 'Production (kg/day)', unit: 'kg/day' }
      ])}

      <h6>Controlling Flow Rate</h6>
      
      {/* Step 6 Results - Stage 1 */}
      {renderSection('Step 6 - Stage 1', 'step6_stage1', [
        { path: 'step_6.oxygen.l_per_min', label: 'Oxygen L/min', unit: 'L/min' },
        { path: 'step_6.oxygen.m3_per_hr', label: 'Oxygen m³/hr', unit: 'm³/hr' },
        { path: 'step_6.co2.l_per_min', label: 'CO2 L/min', unit: 'L/min' },
        { path: 'step_6.co2.m3_per_hr', label: 'CO2 m³/hr', unit: 'm³/hr' },
        { path: 'step_6.tss.l_per_min', label: 'TSS L/min', unit: 'L/min' },
        { path: 'step_6.tss.m3_per_hr', label: 'TSS m³/hr', unit: 'm³/hr' },
        { path: 'step_6.tan.l_per_min', label: 'TAN L/min', unit: 'L/min' },
        { path: 'step_6.tan.m3_per_hr', label: 'TAN m³/hr', unit: 'm³/hr' }
      ])}

      {/* Step 6 Results - Stage 2 */}
      {renderSection('Step 6 - Stage 2', 'step6_stage2', [
        { path: 'step_6.stage2_oxygen.l_per_min', label: 'Oxygen L/min', unit: 'L/min' },
        { path: 'step_6.stage2_oxygen.m3_per_hr', label: 'Oxygen m³/hr', unit: 'm³/hr' },
        { path: 'step_6.stage2_co2.l_per_min', label: 'CO2 L/min', unit: 'L/min' },
        { path: 'step_6.stage2_co2.m3_per_hr', label: 'CO2 m³/hr', unit: 'm³/hr' },
        { path: 'step_6.stage2_tss.l_per_min', label: 'TSS L/min', unit: 'L/min' },
        { path: 'step_6.stage2_tss.m3_per_hr', label: 'TSS m³/hr', unit: 'm³/hr' },
        { path: 'step_6.stage2_tan.l_per_min', label: 'TAN L/min', unit: 'L/min' },
        { path: 'step_6.stage2_tan.m3_per_hr', label: 'TAN m³/hr', unit: 'm³/hr' }
      ])}

      {/* Step 6 Results - Stage 3 */}
      {renderSection('Step 6 - Stage 3', 'step6_stage3', [
        { path: 'step_6.stage3_oxygen.l_per_min', label: 'Oxygen L/min', unit: 'L/min' },
        { path: 'step_6.stage3_oxygen.m3_per_hr', label: 'Oxygen m³/hr', unit: 'm³/hr' },
        { path: 'step_6.stage3_co2.l_per_min', label: 'CO2 L/min', unit: 'L/min' },
        { path: 'step_6.stage3_co2.m3_per_hr', label: 'CO2 m³/hr', unit: 'm³/hr' },
        { path: 'step_6.stage3_tss.l_per_min', label: 'TSS L/min', unit: 'L/min' },
        { path: 'step_6.stage3_tss.m3_per_hr', label: 'TSS m³/hr', unit: 'm³/hr' },
        { path: 'step_6.stage3_tan.l_per_min', label: 'TAN L/min', unit: 'L/min' },
        { path: 'step_6.stage3_tan.m3_per_hr', label: 'TAN m³/hr', unit: 'm³/hr' }
      ])}

      {/* Step 6 Limiting Factors - Stage 1 */}
      {renderSection('Step 6 Limiting Factor - Stage 1', 'limitingFactor_stage1', [
        { key: 'stage1.factor', label: 'Limiting Factor', unit: '' },
        { key: 'stage1.flow_l_per_min', label: 'Flow Rate (L/min)', unit: 'L/min' },
        { key: 'stage1.flow_m3_per_hr', label: 'Flow Rate (m³/hr)', unit: 'm³/hr' }
      ])}

      {/* Step 6 Limiting Factors - Stage 2 */}
      {renderSection('Step 6 Limiting Factor - Stage 2', 'limitingFactor_stage2', [
        { key: 'stage2.factor', label: 'Limiting Factor', unit: '' },
        { key: 'stage2.flow_l_per_min', label: 'Flow Rate (L/min)', unit: 'L/min' },
        { key: 'stage2.flow_m3_per_hr', label: 'Flow Rate (m³/hr)', unit: 'm³/hr' }
      ])}

      {/* Step 6 Limiting Factors - Stage 3 */}
      {renderSection('Step 6 Limiting Factor - Stage 3', 'limitingFactor_stage3', [
        { key: 'stage3.factor', label: 'Limiting Factor', unit: '' },
        { key: 'stage3.flow_l_per_min', label: 'Flow Rate (L/min)', unit: 'L/min' },
        { key: 'stage3.flow_m3_per_hr', label: 'Flow Rate (m³/hr)', unit: 'm³/hr' }
      ])}

      <h6>Pump Sizing</h6>
      
      {/* Step 8 Results - Stage 1 */}
      {renderSection('Step 8 Results - Stage 1', 'stage8_stage1', [
        { key: 'stage1.limitingFlowRateStage1', label: 'Limiting Flow Rate', unit: '' },
        { key: 'stage1.Q_l_s_Stage1', label: 'Q_l.s_Stage1', unit: '' },
        { key: 'stage1.pump_Head_Stage1', label: 'Total Dynamic Head Pressure', unit: '' },
        { key: 'stage1.pump_HydPower_Stage1', label: 'Hydraulic Power', unit: '' },
        { key: 'stage1.pump_PowerkW_Stage1', label: 'Pump Power (kW)', unit: 'kW' },
        { key: 'stage1.n_Pump_Stage1', label: 'Pump Efficiency', unit: '' },
        { key: 'stage1.n_Motor_Stage1', label: 'Motor Efficiency', unit: '' }
      ])}

      {/* Step 8 Results - Stage 2 */}
      {renderSection('Step 8 Results - Stage 2', 'stage8_stage2', [
        { key: 'stage2.limitingFlowRateStage2', label: 'Limiting Flow Rate', unit: '' },
        { key: 'stage2.Q_l_s_Stage2', label: 'Q_l.s_Stage2', unit: '' },
        { key: 'stage2.pump_Head_Stage2', label: 'Total Dynamic Head Pressure', unit: '' },
        { key: 'stage2.pump_HydPower_Stage2', label: 'Hydraulic Power', unit: '' },
        { key: 'stage2.pump_PowerkW_Stage2', label: 'Pump Power (kW)', unit: 'kW' },
        { key: 'stage2.n_Pump_Stage2', label: 'Pump Efficiency', unit: '' },
        { key: 'stage2.n_Motor_Stage2', label: 'Motor Efficiency', unit: '' }
      ])}

      {/* Step 8 Results - Stage 3 */}
      {renderSection('Step 8 Results - Stage 3', 'stage8_stage3', [
        { key: 'stage3.limitingFlowRateStage3', label: 'Limiting Flow Rate', unit: '' },
        { key: 'stage3.Q_l_s_Stage3', label: 'Q_l.s_Stage3', unit: '' },
        { key: 'stage3.pump_Head_Stage3', label: 'Total Dynamic Head Pressure', unit: '' },
        { key: 'stage3.pump_HydPower_Stage3', label: 'Hydraulic Power', unit: '' },
        { key: 'stage3.pump_PowerkW_Stage3', label: 'Pump Power (kW)', unit: 'kW' },
        { key: 'stage3.n_Pump_Stage3', label: 'Pump Efficiency', unit: '' },
        { key: 'stage3.n_Motor_Stage3', label: 'Motor Efficiency', unit: '' }
      ])}
    </div>
  );
};

export default Stage6DynamicOutputsPanel;
