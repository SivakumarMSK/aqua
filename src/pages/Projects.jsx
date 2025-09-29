import React from 'react';
import ListLayout from '../components/ListLayout';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

// Mock data for demonstration
const mockProjects = [
  { id: 'proj1', name: 'Project Alpha', lastUpdated: '2025-09-01' },
  { id: 'proj2', name: 'AquaFarm Beta', lastUpdated: '2025-08-20' },
];

const Projects = () => {
  const renderProjectCard = (project) => (
    <Card key={project.id} className="item-card">
      <Card.Body>
        <h5>{project.name}</h5>
        <div className="card-meta">
          <p>Last Updated: {project.lastUpdated}</p>
        </div>
        <div className="card-actions">
          <Button variant="outline-primary" size="sm">Open</Button>
          <Button variant="outline-secondary" size="sm">Duplicate</Button>
          <Button variant="outline-danger" size="sm">Delete</Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <ListLayout
      title="Projects"
      items={mockProjects}
      renderItem={renderProjectCard}
      createPath="/projects/new" // Placeholder route
      createLabel="Create New Project"
    />
  );
};

export default Projects;