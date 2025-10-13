import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Container, Modal, Button } from 'react-bootstrap';
import { getProjectsByDesignId, deleteDesign } from '../services/designSystemService.jsx';
import Toast from './Toast';
import './AllProjects.css';

const DesignProjects = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const [designData, setDesignData] = useState(null);
  const [basicProjects, setBasicProjects] = useState([]);
  const [advancedProjects, setAdvancedProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [filterType, setFilterType] = useState('basic');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Project classification function
  const classifyProject = (project) => {
    return project.type === 'advanced' ? 'advanced' : 'basic';
  };

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjectsByDesignId(designId);
        
        if (!mounted) return;

        if (data.status === 'error') {
          throw new Error('Failed to load projects for this design');
        }

        setDesignData(data);

        // Classify projects into basic and advanced
        const basicProjectsList = [];
        const advancedProjectsList = [];

        data.projects.forEach(project => {
          const projectType = classifyProject(project);
          if (projectType === 'basic') {
            basicProjectsList.push(project);
          } else {
            advancedProjectsList.push(project);
          }
        });

        setBasicProjects(basicProjectsList);
        setAdvancedProjects(advancedProjectsList);
      } catch (err) {
        if (!mounted) return;
        
        console.error('Error fetching projects:', err);
        setToast({
          show: true,
          message: err.message,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
    
    return () => {
      mounted = false;
    };
  }, [designId]);

  // Filter projects based on filter type
  useEffect(() => {
    if (filterType === 'basic') {
      setFilteredProjects(basicProjects);
    } else if (filterType === 'advanced') {
      setFilteredProjects(advancedProjects);
    }
  }, [filterType, basicProjects, advancedProjects]);

  const handleProjectClick = async (project) => {
    // Navigate to project reports
    const projectType = classifyProject(project);
    navigate('/project-reports/' + project.id, {
      state: {
        projectType: projectType,
        designSystemName: designData.design_name
      }
    });
  };

  const handleDeleteDesign = async () => {
    try {
      setDeleting(true);
      const response = await deleteDesign(designId);
      
      setToast({
        show: true,
        message: `Design deleted successfully. ${response.deleted_projects_count} projects were also deleted.`,
        type: 'success'
      });

      // Redirect to dashboard after successful deletion
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error deleting design:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to delete design',
        type: 'error'
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="all-projects-container">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-projects-container">
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
          <h1 className="d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-diagram-3 text-primary"></i>
            <span>{designData?.design_name || 'Design Projects'}</span>
          </h1>
          <p className="text-muted">
            Projects in this design system
          </p>
          <div className="d-flex justify-content-center gap-2 mt-3">
            <button 
              className="btn btn-outline-danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
            >
              <i className="bi bi-trash me-2"></i>
              Delete Design
            </button>
          </div>
        </div>
        
        {/* Project Type Filter Buttons */}
        <div className="project-type-buttons d-flex gap-2 mb-3">
          <button
            onClick={() => setFilterType('basic')}
            className={`project-filter-btn ${filterType === 'basic' ? 'active' : 'inactive'}`}
          >
            Basic Projects ({basicProjects.length})
          </button>
          <button
            onClick={() => setFilterType('advanced')}
            className={`project-filter-btn ${filterType === 'advanced' ? 'active' : 'inactive'}`}
          >
            Advanced Projects ({advancedProjects.length})
          </button>
        </div>
        
        <div className="projects-grid">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-5">
              <i className={`bi ${filterType === 'basic' ? 'bi-gear' : 'bi-cpu'} text-muted mb-3`} style={{fontSize: '3rem'}}></i>
              <h4>
                {filterType === 'basic' ? 'No Basic Projects Found' : 'No Advanced Projects Found'}
              </h4>
              <p className="text-muted">
                {filterType === 'basic' ? 'No basic projects found in this design system.' : 'No advanced projects found in this design system.'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const projectType = classifyProject(project);
              return (
                <Card 
                  key={project.id}
                  className={`project-card ${projectType === 'basic' ? 'basic-project-card' : 'advanced-project-card'}`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-2 d-flex align-items-center gap-2">
                          <i className={`bi ${projectType === 'basic' ? 'bi-folder2-open text-primary' : 'bi-folder text-success'}`}></i>
                          <span>{project.name}</span>
                        </h5>
                        <div className="project-details">
                          <div className="kv-row">
                            <span className="kv-key text-muted">Species</span>
                            <span className="kv-value species-names">{project.species_names || 'N/A'}</span>
                          </div>
                          <div className="kv-row">
                            <span className="kv-key text-muted">Type</span>
                            <span className="kv-value">
                              <span className={`badge ${projectType === 'basic' ? 'bg-primary' : 'bg-success'}`}>
                                {projectType === 'basic' ? 'Basic' : 'Advanced'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-cta-br">
                      <span 
                        className="eye-btn" 
                        title={`View ${projectType} project details`} 
                        aria-label={`View ${projectType} project details`} 
                        onClick={() => handleProjectClick(project)}
                      >
                        <i className="bi bi-eye"></i>
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          )}
        </div>
      </Container>
      {toast.show && (
        <Toast 
          show={toast.show} 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Delete Design
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete this design system <strong>"{designData?.design_name}"</strong>?
          </p>
          <p className="text-muted">
            This action will permanently delete the design and all its associated projects ({basicProjects.length + advancedProjects.length} projects total).
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
            style={{ width: 'auto' }}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteDesign}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete Design
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DesignProjects;
