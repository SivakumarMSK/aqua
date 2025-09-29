import React from 'react';
import Navbar from './Navbar';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import '../styles/AllDesignSystems.css';

const AllDesignSystems = () => {
  // Sample data to simulate a list of design systems
  const designSystems = [
    { id: 1, name: 'Eco-System V1', lastUpdated: '2025-08-30', status: 'Active' },
    { id: 2, name: 'WaterFlow Alpha', lastUpdated: '2025-08-25', status: 'Draft' },
    { id: 3, name: 'Oceanic 2.0', lastUpdated: '2025-08-20', status: 'Archived' },
  ];

  return (
    <div className="all-design-systems-container">
      <Navbar />
      <div className="container all-design-systems-content">
        <div className="page-header">
          <h3>All Design Systems</h3>
          <Button variant="primary" href="/design-systems/new">
            <span className="plus-icon">+</span> New Design System
          </Button>
        </div>
        
        <div className="controls-row">
          {/* Search, Filter, Sort elements */}
          <InputGroup className="search-bar">
            <Form.Control placeholder="Search systems..." />
          </InputGroup>
          <div className="filter-sort-group">
            <Form.Select className="filter-select">
              <option>Filter by Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </Form.Select>
            <Form.Select className="sort-select">
              <option>Sort by</option>
              <option value="name">Name</option>
              <option value="updated">Last Updated</option>
            </Form.Select>
          </div>
        </div>

        <div className="design-systems-grid">
          {designSystems.map(system => (
            <Card key={system.id} className="system-card">
              <Card.Body>
                <div className="card-top">
                  <h5>{system.name}</h5>
                  <span className={`status-badge ${system.status.toLowerCase()}`}>{system.status}</span>
                </div>
                <div className="card-meta">
                  <p>Last Updated: {system.lastUpdated}</p>
                </div>
                <div className="card-actions">
                  <Button variant="outline-primary" size="sm">Open</Button>
                  <Button variant="outline-secondary" size="sm">Duplicate</Button>
                  <Button variant="outline-danger" size="sm">Delete</Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllDesignSystems;