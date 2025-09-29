import React, { useState, useEffect } from 'react';
import { getSpecies } from '../services/speciesService';
import SpeciesRecommendedValues from './SpeciesRecommendedValues';
import '../styles/SpeciesSelection.css';

const SpeciesSelection = ({ onSelect, selectedSpeciesId = null }) => {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    species_type: ''
  });
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showRecommended, setShowRecommended] = useState(false);

  useEffect(() => {
    fetchSpecies();
  }, [filters]);

  const fetchSpecies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSpecies(filters);
      setSpecies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const handleTypeChange = (e) => {
    setFilters(prev => ({
      ...prev,
      species_type: e.target.value
    }));
  };

  const formatRange = (range) => {
    if (!range) return 'N/A';
    return `${range.min} - ${range.max} ${range.unit || ''}`;
  };

  if (loading) {
    return (
      <div className="species-container">
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="species-container">
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="species-container">
      <div className="species-header">
        <div className="search-filters">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="type-filter">
            <select value={filters.species_type} onChange={handleTypeChange}>
              <option value="">All Types</option>
              <option value="Fish">Fish</option>
              <option value="Crustacean">Crustacean</option>
            </select>
          </div>
        </div>
      </div>

      {species.length === 0 ? (
        <div className="no-results">
          <p>No species found matching your criteria</p>
        </div>
      ) : (
        <div className="species-grid">
          {species.map(species => (
            <div
              key={species.id}
              className={`species-card ${selectedSpeciesId === species.id ? 'selected' : ''}`}
            >
              <div className="species-content" onClick={() => onSelect(species)}>
              <div className="species-name">{species.common_name}</div>
              <div className="species-scientific">{species.scientific_name}</div>
              <div className="species-type-tag">{species.species_type}</div>
              
              <div className="species-params">
                <div className="param-item">
                  <span className="param-label">Temperature</span>
                  <span className="param-value">
                    {formatRange(species.temperature)}
                  </span>
                </div>
                <div className="param-item">
                  <span className="param-label">Salinity</span>
                  <span className="param-value">
                    {formatRange(species.salinity)}
                  </span>
                </div>
                {species.water_quality && Object.entries(species.water_quality).map(([key, value]) => (
                  <div key={key} className="param-item">
                    <span className="param-label">{key}</span>
                    <span className="param-value">{formatRange(value)}</span>
                  </div>
                ))}
              </div>
              <button 
                className="view-recommended-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSpecies(species);
                  setShowRecommended(true);
                }}
              >
                View Recommended Values
              </button>
            </div>
          ))}
        </div>
      )}

      {showRecommended && selectedSpecies && (
        <SpeciesRecommendedValues
          speciesName={selectedSpecies.common_name}
          onClose={() => {
            setShowRecommended(false);
            setSelectedSpecies(null);
          }}
        />
      )}
    </div>
  );
};

export default SpeciesSelection;
