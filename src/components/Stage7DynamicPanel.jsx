import React, { useEffect, useMemo, useRef, useState } from 'react';
import './DynamicOutputsPanel.css';

// UI-only, dynamic preview for Stage 7 (no API calls). Mirrors basic dynamic panel patterns.
// Shows placeholder calculations derived from current inputs with debounce.

const initialState = {
  status: 'empty', // 'empty' | 'calculating' | 'populated' | 'error'
  data: null,
  lastUpdated: null
};

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function Stage7DynamicPanel({ stage7Inputs }) {
  const [state, setState] = useState(initialState);
  const debounceRef = useRef(null);

  const inputs = useMemo(() => ({
    mbbr_location: stage7Inputs?.mbbr_location,
    media_to_water_volume_ratio: safeNumber(stage7Inputs?.media_to_water_volume_ratio),
    passive_nitrification_rate_stage1_percent: safeNumber(stage7Inputs?.passive_nitrification_rate_stage1_percent),
    passive_nitrification_rate_stage2_percent: safeNumber(stage7Inputs?.passive_nitrification_rate_stage2_percent),
    passive_nitrification_rate_stage3_percent: safeNumber(stage7Inputs?.passive_nitrification_rate_stage3_percent),
    pump_stop_overflow_volume: safeNumber(stage7Inputs?.pump_stop_overflow_volume),
    standalone_height_diameter_ratio: safeNumber(stage7Inputs?.standalone_height_diameter_ratio),
    volumetric_nitrification_rate_vtr: safeNumber(stage7Inputs?.volumetric_nitrification_rate_vtr),
    num_tanks_stage1: safeNumber(stage7Inputs?.num_tanks_stage1),
    num_tanks_stage2: safeNumber(stage7Inputs?.num_tanks_stage2),
    num_tanks_stage3: safeNumber(stage7Inputs?.num_tanks_stage3)
  }), [stage7Inputs]);

  useEffect(() => {
    // Debounced UI-only compute
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState(prev => ({ ...prev, status: 'calculating' }));

    debounceRef.current = setTimeout(() => {
      try {
        // Mocked computations (placeholders) for preview-only
        const vtr = inputs.volumetric_nitrification_rate_vtr || 0;
        const mediaRatio = inputs.media_to_water_volume_ratio || 0;
        const tanStage1 = Math.max(0, (inputs.num_tanks_stage1 || 0) * 12.5 * (1 - inputs.passive_nitrification_rate_stage1_percent / 100));
        const tanStage2 = Math.max(0, (inputs.num_tanks_stage2 || 0) * 10.2 * (1 - inputs.passive_nitrification_rate_stage2_percent / 100));
        const tanStage3 = Math.max(0, (inputs.num_tanks_stage3 || 0) * 8.8 * (1 - inputs.passive_nitrification_rate_stage3_percent / 100));

        const designVTR1 = Math.max(0, vtr * 1.0);
        const designVTR2 = Math.max(0, vtr * 0.95);
        const designVTR3 = Math.max(0, vtr * 0.9);

        const mediaRequired1 = +(tanStage1 / (vtr || 1)).toFixed(2);
        const mediaRequired2 = +(tanStage2 / (vtr || 1)).toFixed(2);
        const mediaRequired3 = +(tanStage3 / (vtr || 1)).toFixed(2);

        const mbbrVol1 = +(mediaRequired1 * (1 + mediaRatio)).toFixed(2);
        const mbbrVol2 = +(mediaRequired2 * (1 + mediaRatio)).toFixed(2);
        const mbbrVol3 = +(mediaRequired3 * (1 + mediaRatio)).toFixed(2);

        const sump3min = +(Math.max(0, (inputs.num_tanks_stage1 + inputs.num_tanks_stage2 + inputs.num_tanks_stage3) * 0.35)).toFixed(2);
        const sump5min = +(sump3min * 1.6).toFixed(2);
        const sumpTotal = +(sump5min + inputs.pump_stop_overflow_volume).toFixed(2);

        const data = {
          // Daily TAN (g/day) after passive nitrification
          dailyTAN: {
            stage1_g_day: +tanStage1.toFixed(2),
            stage2_g_day: +tanStage2.toFixed(2),
            stage3_g_day: +tanStage3.toFixed(2)
          },
          // Design VTR snapshot
          designVTR: {
            stage1: +designVTR1.toFixed(2),
            stage2: +designVTR2.toFixed(2),
            stage3: +designVTR3.toFixed(2)
          },
          // Media and MBBR volume previews (m³)
          media: {
            required_m3: {
              stage1: mediaRequired1,
              stage2: mediaRequired2,
              stage3: mediaRequired3
            },
            mbbr_volume_m3: {
              stage1: mbbrVol1,
              stage2: mbbrVol2,
              stage3: mbbrVol3
            }
          },
          // Sump sizing previews (m³)
          sump: {
            full_flow_3min_m3: sump3min,
            full_flow_5min_m3: sump5min,
            total_volume_m3: sumpTotal
          }
        };

        setState({ status: 'populated', data, lastUpdated: new Date() });
      } catch (e) {
        setState({ status: 'error', data: null, lastUpdated: new Date() });
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputs]);

  const renderSection = (title, sectionKey, fields) => {
    const status = state.status;
    const data = state.data || {};
    return (
      <div className={`dynamic-section ${status}`} key={sectionKey}>
        <h6 className="section-title">{title}</h6>
        <div className="section-content">
          {fields.map((f, idx) => {
            const raw = f.path ? f.path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), data) : undefined;
            const value = f.valueKey ? data?.[f.valueKey] : raw;
            const display = status === 'error'
              ? 'Error'
              : status === 'calculating'
                ? 'Loading...'
                : (value ?? '---');
            return (
              <div key={idx} className="field-row">
                <span className="field-name">{f.name}:</span>
                <span className={`field-value ${status}`}>{display}{f.unit ? ` ${f.unit}` : ''}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`dynamic-outputs-panel ${state.status}`}>
      <h5 className="panel-title">Dynamic Outputs</h5>
      {renderSection('Daily TAN (after passive nitrification)', 'dailyTAN', [
        { name: 'Stage 1', path: 'dailyTAN.stage1_g_day', unit: 'g/day' },
        { name: 'Stage 2', path: 'dailyTAN.stage2_g_day', unit: 'g/day' },
        { name: 'Stage 3', path: 'dailyTAN.stage3_g_day', unit: 'g/day' }
      ])}

      {renderSection('Design VTR', 'designVTR', [
        { name: 'Stage 1', path: 'designVTR.stage1' },
        { name: 'Stage 2', path: 'designVTR.stage2' },
        { name: 'Stage 3', path: 'designVTR.stage3' }
      ])}

      {renderSection('Media Required (m³)', 'media_required', [
        { name: 'Stage 1', path: 'media.required_m3.stage1', unit: 'm³' },
        { name: 'Stage 2', path: 'media.required_m3.stage2', unit: 'm³' },
        { name: 'Stage 3', path: 'media.required_m3.stage3', unit: 'm³' }
      ])}

      {renderSection('MBBR Volume (m³)', 'mbbr_volume', [
        { name: 'Stage 1', path: 'media.mbbr_volume_m3.stage1', unit: 'm³' },
        { name: 'Stage 2', path: 'media.mbbr_volume_m3.stage2', unit: 'm³' },
        { name: 'Stage 3', path: 'media.mbbr_volume_m3.stage3', unit: 'm³' }
      ])}

      {renderSection('Sump Sizing (Preview)', 'sump', [
        { name: '3 min Full Flow', path: 'sump.full_flow_3min_m3', unit: 'm³' },
        { name: '5 min Full Flow', path: 'sump.full_flow_5min_m3', unit: 'm³' },
        { name: 'Sump Total Volume', path: 'sump.total_volume_m3', unit: 'm³' }
      ])}
    </div>
  );
}


