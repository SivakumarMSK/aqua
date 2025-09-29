import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';

const DesignCreationDropdown = () => {
  const navigate = useNavigate();

  const handleCreateWithNewDesign = () => {
    // Navigate to the existing CreateDesignSystem flow
    navigate('/design-systems/new');
  };

  const handleCreateWithExistingDesign = () => {
    // TODO: Implement this later
    console.log('Create with existing design - to be implemented');
  };

  return (
    <>
      <style>
        {`
          .dropdown-toggle::after {
            transition: transform 0.2s ease;
            margin-left: 0.5rem;
            border-width: 0.4em 0.4em 0;
            border-top-color: currentColor;
            font-size: 1.2em;
            vertical-align: middle;
            margin-top: -0.1em;
          }
          .dropdown.show .dropdown-toggle::after {
            transform: rotate(180deg);
          }
        `}
      </style>
      <Dropdown>
        <Dropdown.Toggle 
          as={Button} 
          variant="primary" 
          className="add-button rounded-pill"
          id="project-creation-dropdown"
        >
          <i className="bi bi-plus-circle-fill me-2"></i>
          Add New Project
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={handleCreateWithNewDesign}>
            <i className="bi bi-plus-circle me-2"></i>
            Create project with new design
          </Dropdown.Item>
          <Dropdown.Item onClick={handleCreateWithExistingDesign} disabled>
            <i className="bi bi-folder-plus me-2"></i>
            Create project with existing design
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default DesignCreationDropdown;
