import React, { useState, useEffect } from 'react';
import { getRecommendedValues } from '../services/speciesService';
import '../styles/SpeciesRecommendedValues.css';

const SpeciesRecommendedValues = ({ speciesName, onClose }) => {
  const [recommendedValues, setRecommendedValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendedValues();
  }, [speciesName]);

  const fetchRecommendedValues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendedValues(speciesName);
      setRecommendedValues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      if ('min' in value && 'max' in value) {
        return `${value.min} - ${value.max}${value.unit ? ` ${value.unit}` : ''}`;
      }
      return JSON.stringify(value);
    }
    return value;
  };

  if (loading) {
    return (
      <div className="recommended-values-modal">
        <div className="modal-content loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommended-values-modal">
        <div className="modal-content error">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommended-values-modal">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>{recommendedValues?.common_name}</h3>
            <p className="scientific-name">{recommendedValues?.scientific_name}</p>
          </div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="parameters-grid">
          {recommendedValues?.parameters && Object.entries(recommendedValues.parameters).map(([key, value]) => (
            <div key={key} className="parameter-card">
              <div className="parameter-name">{key}</div>
              <div className="parameter-value">{formatValue(value)}</div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="apply-button" onClick={onClose}>Apply Values</button>
        </div>
      </div>
    </div>
  );
};

export default SpeciesRecommendedValues;
