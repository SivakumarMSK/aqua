import { getCurrentSubscription } from '../services/subscriptionService';

// Get the current subscription plan from API
export const getCurrentPlan = async () => {
  try {
    const subscription = await getCurrentSubscription();
    // Check if user has active subscription
    if (subscription && subscription.is_active === true) {
      return 'Paid';
    }
    return 'Free';
  } catch (error) {
    // If API fails, assume Free plan
    return 'Free';
  }
};

// Get current plan synchronously (for initial load)
export const getCurrentPlanSync = () => {
  return localStorage.getItem('currentPlan') || 'Free';
};

// Update the current subscription plan and details
export const updateSubscriptionPlan = (planName, subscriptionDetails) => {
  // Update the current plan in localStorage as fallback
  localStorage.setItem('currentPlan', planName);

  // Store subscription details
  if (subscriptionDetails) {
    localStorage.setItem('subscriptionDetails', JSON.stringify({
      ...subscriptionDetails,
      updatedAt: new Date().toISOString()
    }));
  }
};

// Get subscription details
export const getSubscriptionDetails = () => {
  const details = localStorage.getItem('subscriptionDetails');
  return details ? JSON.parse(details) : null;
};

// Check if user has an active paid subscription
export const hasActivePaidSubscription = async () => {
  try {
    const plan = await getCurrentPlan();
    return plan !== 'Free';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Fallback to localStorage
    const currentPlan = getCurrentPlanSync();
    return currentPlan !== 'Free';
  }
};

// Check if user has already chosen a plan (new vs returning user)
export const hasUserChosenPlan = () => {
  return localStorage.getItem('userHasChosenPlan') === 'true';
};

// Check if user has an active paid subscription (for login redirect logic)
export const hasActivePaidSubscriptionSync = () => {
  const currentPlan = getCurrentPlanSync();
  return currentPlan === 'Paid';
};

// Mark that user has chosen a plan
export const markUserHasChosenPlan = () => {
  localStorage.setItem('userHasChosenPlan', 'true');
};

// Reset plan choice flag (for testing or logout)
export const resetUserPlanChoice = () => {
  localStorage.removeItem('userHasChosenPlan');
};