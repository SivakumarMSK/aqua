import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const AustralianStates = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const Profile = () => {
  const [formData, setFormData] = useState({
    name: 'John Appleseed',
    email: 'john.a@example.com',
    phone: '123-456-7890',
    company: 'AquaTech Solutions',
    officeAddress: '123 Main St',
    officeSuburb: 'Sydney',
    officeState: 'NSW',
    officePostCode: '2000',
    sameAsOffice: false,
    postalAddress: '',
    postalSuburb: '',
    postalState: '',
    postalPostCode: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="profile-container">
      <Navbar />
      <div className="container profile-content">
        <h3>Profile & Settings</h3>
        <Form>
          {/* Personal Info */}
          <h4>Personal Information</h4>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} />
          </Form.Group>
          {/* ...other fields for email, phone */}

          {/* Addresses */}
          <h4>Addresses</h4>
          <Form.Group className="mb-3">
            <Form.Label>Office Address</Form.Label>
            <Form.Control type="text" name="officeAddress" value={formData.officeAddress} onChange={handleInputChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Postal Address</Form.Label>
            <Form.Control 
              type="text" 
              name="postalAddress" 
              value={formData.sameAsOffice ? formData.officeAddress : formData.postalAddress} 
              onChange={handleInputChange} 
              disabled={formData.sameAsOffice}
            />
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Postal same as Office"
            name="sameAsOffice"
            checked={formData.sameAsOffice}
            onChange={handleInputChange}
            className="mb-3"
          />
          {/* State Select */}
          <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Select name="postalState" value={formData.postalState} onChange={handleInputChange} disabled={formData.sameAsOffice}>
              <option>Select State...</option>
              {AustralianStates.map(state => <option key={state} value={state}>{state}</option>)}
            </Form.Select>
          </Form.Group>

          {/* Other settings */}
          <div className="d-flex justify-content-between my-4">
            <Button variant="outline-primary">Manage Plan</Button>
            <Button variant="outline-secondary">Log Out</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Profile;