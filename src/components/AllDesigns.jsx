import React, { useEffect, useState } from 'react';
import { Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAllDesignSystems } from '../services/designSystemService';
import './AllDesigns.css';

const AllDesigns = () => {
  const [designSystems, setDesignSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const designs = await getAllDesignSystems();
        setDesignSystems(designs);
      } catch (error) {
        console.error('Error fetching designs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="all-designs-container">
      <Container>
          <div className="header-section">
            <div className="back-button-container">
              <button 
                className="btn btn-outline-primary rounded-circle back-button"
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-arrow-left"></i>
              </button>
            </div>
            <h1>All Design Systems</h1>
            <p className="text-muted">Browse and manage all your design systems</p>
          </div>
        
        <div className="designs-grid">
          {designSystems.map((system) => (
            <Card 
              key={system.id}
              className="design-card"
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      <i className="bi bi-boxes text-primary"></i>
                      <span>{system.design_system_name}</span>
                    </h5>
                    <p className="text-muted mb-2">{system.project_name || 'N/A'}</p>
                    <p className="text-muted small mb-0">{new Date(system.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="card-cta-br">
                  <span 
                    className="eye-btn" 
                    title="View design projects" 
                    aria-label="View design projects" 
                    onClick={() => navigate(`/design-projects/${system.id}`)}
                  >
                    <i className="bi bi-eye"></i>
                  </span>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default AllDesigns;
