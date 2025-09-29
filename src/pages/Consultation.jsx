import React from 'react';
import Navbar from '../components/Navbar';
import Button from 'react-bootstrap/Button';

const Consultation = () => {
  return (
    <div className="consultation-container">
      <Navbar />
      <div className="container consultation-content text-center">
        <h3>Book a Consultation</h3>
        <p>
          We're here to help you get the most out of our tools. Book a one-on-one consultation with our experts.
        </p>
        <Button 
          variant="primary" 
          href="mailto:consultation@example.com" 
          className="mt-4"
        >
          Book Now
        </Button>
      </div>
    </div>
  );
};

export default Consultation;