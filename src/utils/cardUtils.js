// Card type patterns
const cardPatterns = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  amex: /^3[47]/,
  discover: /^6(?:011|5)/,
};

// Format card number with spaces
export const formatCardNumber = (value) => {
  if (!value) return value;
  
  // Remove all non-digit characters
  const number = value.replace(/\D/g, '');
  
  // Check if it's an Amex card (4-6-5 pattern)
  if (cardPatterns.amex.test(number)) {
    return number.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
  }
  
  // Other cards (4-4-4-4 pattern)
  return number.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

// Format expiry date
export const formatExpiryDate = (value) => {
  if (!value) return value;
  
  const expiry = value.replace(/\D/g, '');
  if (expiry.length >= 2) {
    return expiry.slice(0, 2) + '/' + expiry.slice(2, 4);
  }
  return expiry;
};

// Validate expiry date
export const validateExpiryDate = (value) => {
  if (!value || value.length !== 5) return false;
  
  const [month, year] = value.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  const numMonth = parseInt(month, 10);
  const numYear = parseInt(year, 10);
  
  if (numMonth < 1 || numMonth > 12) return false;
  if (numYear < currentYear) return false;
  if (numYear === currentYear && numMonth < currentMonth) return false;
  
  return true;
};

// Get card type based on number
export const getCardType = (number) => {
  if (!number) return '';
  const cleanNumber = number.replace(/\D/g, '');
  
  if (cardPatterns.visa.test(cleanNumber)) return 'visa';
  if (cardPatterns.mastercard.test(cleanNumber)) return 'mastercard';
  if (cardPatterns.amex.test(cleanNumber)) return 'amex';
  if (cardPatterns.discover.test(cleanNumber)) return 'discover';
  
  return '';
};

// Validate card number using Luhn algorithm
export const validateCardNumber = (number) => {
  if (!number) return false;
  
  const cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Validate CVV
export const validateCVV = (cvv, cardType) => {
  if (!cvv) return false;
  const cleanCVV = cvv.replace(/\D/g, '');
  return cardType === 'amex' ? cleanCVV.length === 4 : cleanCVV.length === 3;
};
