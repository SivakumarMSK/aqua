import React, { useState, useEffect } from 'react';
import '../styles/PaymentModal.css';
import {
  formatCardNumber,
  formatExpiryDate,
  validateExpiryDate,
  getCardType,
  validateCardNumber,
  validateCVV
} from '../utils/cardUtils';

const PaymentModal = ({ isOpen, onClose, planDetails, onSubmit, isLoading }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [cardType, setCardType] = useState('');
  const [validationState, setValidationState] = useState({
    cardNumber: { isValid: true, message: '' },
    expiryDate: { isValid: true, message: '' },
    cvv: { isValid: true, message: '' }
  });

  // Handle card number input with formatting and validation
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    
    const newCardType = getCardType(formatted);
    setCardType(newCardType);
    
    const isValid = validateCardNumber(formatted);
    setValidationState(prev => ({
      ...prev,
      cardNumber: {
        isValid,
        message: isValid ? '' : 'Please enter a valid card number'
      }
    }));
  };

  // Handle expiry date input with formatting and validation
  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
    
    const isValid = validateExpiryDate(formatted);
    setValidationState(prev => ({
      ...prev,
      expiryDate: {
        isValid,
        message: isValid ? '' : 'Please enter a valid expiry date'
      }
    }));
  };

  // Handle CVV input with validation
  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value);
    
    const isValid = validateCVV(value, cardType);
    setValidationState(prev => ({
      ...prev,
      cvv: {
        isValid,
        message: isValid ? '' : `Please enter a valid ${cardType === 'amex' ? '4-digit' : '3-digit'} CVV`
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const isCardValid = validateCardNumber(cardNumber);
    const isExpiryValid = validateExpiryDate(expiryDate);
    const isCVVValid = validateCVV(cvv, cardType);

    setValidationState({
      cardNumber: { isValid: isCardValid, message: isCardValid ? '' : 'Invalid card number' },
      expiryDate: { isValid: isExpiryValid, message: isExpiryValid ? '' : 'Invalid expiry date' },
      cvv: { isValid: isCVVValid, message: isCVVValid ? '' : 'Invalid CVV' }
    });

    if (!isCardValid || !isExpiryValid || !isCVVValid) {
      setError('Please correct the errors in the form');
      return;
    }

    const subscriptionData = {
      payment_amount: planDetails.price,
      payment_method: paymentMethod,
      subscription_type: planDetails.type,
      card_type: cardType
    };

    try {
      await onSubmit(subscriptionData);
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Complete Your Subscription</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="payment-modal-content">
          <div className="plan-summary">
            <h3>Plan Summary</h3>
            <p>Plan: {planDetails.name}</p>
            <p>Price: ${planDetails.price}/{planDetails.interval}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isLoading}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label>Card Number</label>
              <div className={`input-wrapper ${cardType} ${!validationState.cardNumber.isValid ? 'invalid' : ''}`}>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  disabled={isLoading}
                  maxLength="19"
                  className={cardType}
                />
                {cardType && <span className={`card-icon ${cardType}`} />}
              </div>
              {!validationState.cardNumber.isValid && (
                <div className="validation-message">{validationState.cardNumber.message}</div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <div className={`input-wrapper ${!validationState.expiryDate.isValid ? 'invalid' : ''}`}>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    disabled={isLoading}
                    maxLength="5"
                  />
                </div>
                {!validationState.expiryDate.isValid && (
                  <div className="validation-message">{validationState.expiryDate.message}</div>
                )}
              </div>

              <div className="form-group">
                <label>CVV</label>
                <div className={`input-wrapper ${!validationState.cvv.isValid ? 'invalid' : ''}`}>
                  <input
                    type="text"
                    placeholder={cardType === 'amex' ? '1234' : '123'}
                    value={cvv}
                    onChange={handleCVVChange}
                    disabled={isLoading}
                    maxLength={cardType === 'amex' ? '4' : '3'}
                  />
                  <span className="cvv-hint" title="The security code on the back of your card">?</span>
                </div>
                {!validationState.cvv.isValid && (
                  <div className="validation-message">{validationState.cvv.message}</div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Complete Subscription'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
