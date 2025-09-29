import React from 'react';
import '../styles/PaymentAlert.css';

const PaymentAlert = ({ isOpen, onClose, type, title, details, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="payment-alert-overlay">
      <div className={`payment-alert ${type}`}>
        <div className="payment-alert-header">
          <h3>{title}</h3>
          {!details && <button className="alert-close" onClick={onClose}>&times;</button>}
        </div>
        
        {type === 'success' && details && (
          <div className="payment-success-content">
            <div className="checkmark-circle">
              <div className="checkmark"></div>
            </div>
            <div className="success-details">
              <p className="plan-name">{details.planName}</p>
              <div className="details-grid">
                <div className="detail-item">
                  <span>Billing:</span>
                  <span>{details.billing}</span>
                </div>
                <div className="detail-item">
                  <span>Amount:</span>
                  <span>${details.amount}</span>
                </div>
                <div className="detail-item">
                  <span>Next Billing:</span>
                  <span>{details.nextBilling}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {type === 'error' && (
          <div className="payment-alert-content">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{details || 'An error occurred'}</p>
          </div>
        )}

        <div className="payment-alert-actions">
          {type === 'success' ? (
            <button className="alert-button confirm" onClick={onConfirm}>
              Continue to Dashboard
            </button>
          ) : (
            <button className="alert-button" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentAlert;
