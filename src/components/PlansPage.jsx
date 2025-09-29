import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PlansPage.css";
import { createSubscription } from "../services/subscriptionService";
import { getCurrentPlan, getCurrentPlanSync, updateSubscriptionPlan, markUserHasChosenPlan, hasUserChosenPlan } from "../utils/subscriptionUtils";
import PaymentModal from "./PaymentModal";
import PaymentAlert from "./PaymentAlert";

const PlansPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [alert, setAlert] = useState({ isOpen: false, type: '', title: '', details: null });
  const [alertActions, setAlertActions] = useState({ onConfirm: null });

  // ✅ Only show current plan if user has actually chosen one
  const [activePlan, setActivePlan] = useState(() => {
    try {
      // If user hasn't chosen a plan yet, don't show any as active
      if (!hasUserChosenPlan()) {
        return null;
      }
      return (getCurrentPlanSync() || 'Free').toLowerCase();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;
    const loadPlan = async () => {
      try {
        // Only set active plan if user has actually chosen one
        if (hasUserChosenPlan()) {
          const plan = await getCurrentPlan();
          if (mounted && typeof plan === 'string') {
            setActivePlan(plan.toLowerCase());
          }
        } else {
          // New user - no active plan
          if (mounted) {
            setActivePlan(null);
          }
        }
      } catch (e) {
        // Ignore; fallback already set
      }
    };
    loadPlan();
    return () => { mounted = false; };
  }, []);

  const [plans] = useState([
    {
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      description: "Basic calculations only",
      features: [
        "Basic calculations",
        "Single user",
        "Community support",
        "Limited history",
        "No customization",
      ],
      id: "free",
    },
    {
      name: "Paid",
      priceMonthly: 10,
      priceYearly: 100,
      description: "Advanced features coming soon",
      features: [
        "Advanced features",
        "Multiple users",
        "Email support",
        "Extended history",
        "Basic customization",
      ],
      id: "paid",
    },
    {
      name: "Advanced",
      priceMonthly: 20,
      priceYearly: 200,
      description: "All advanced features",
      features: [
        "All advanced features",
        "Unlimited users",
        "Priority support",
        "Full history access",
        "Full customization",
      ],
      id: "advanced",
    },
  ]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromUpgrade = searchParams.get("fromUpgrade");

    // ✅ If upgrading and user has already chosen a plan, override the default plan
    if (fromUpgrade && hasUserChosenPlan()) {
      setActivePlan(fromUpgrade);
    }
  }, [location.search]);

  const handleToggle = () => {
    setIsYearly(!isYearly);
  };

  const handleSelectPlan = (planId) => {
    // Disable Advanced card for now
    if (planId === "advanced") {
      return;
    }

    if (planId === "free") {
      // Free plan - mark that user has chosen a plan and navigate to dashboard
      markUserHasChosenPlan();
      updateSubscriptionPlan("Free");
      navigate("/dashboard");
      return;
    }

    if (planId === "paid") {
      // Show payment modal for paid plan
      const plan = plans.find(p => p.id === planId);
      setSelectedPlan({
        id: planId,
        name: plan.name,
        price: isYearly ? plan.priceYearly : plan.priceMonthly,
        interval: isYearly ? 'year' : 'month',
        type: isYearly ? "365" : "30"
      });
      setShowPaymentModal(true);
      return;
    }
  };

  const handlePaymentSubmit = async (subscriptionData) => {
    try {
      setError(null);
      setIsLoading(true);

      // Step 2: Create subscription via POST API
      const response = await createSubscription(subscriptionData);
      console.log('Subscription created:', response);
      
      setShowPaymentModal(false);

      // Step 2 result: Show success and refresh plan status
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Payment Successful!',
        details: {
          planName: `Welcome to ${selectedPlan.name} Plan!`,
          billing: isYearly ? 'Yearly' : 'Monthly',
          amount: subscriptionData.payment_amount,
          nextBilling: new Date(response.subscription.end_date).toLocaleDateString()
        }
      });

      // Handle navigation in the alert's onConfirm
      setAlertActions({
        onConfirm: () => {
          // Mark that user has chosen a plan
          markUserHasChosenPlan();
          // Dispatch event to refresh dashboard with new plan status
          window.dispatchEvent(new CustomEvent('planChanged'));
          navigate("/dashboard");
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to process payment. Please try again.');
      console.error('Payment error:', err);
      
      // Show error alert
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Payment Failed',
        details: err.message || 'Failed to process payment. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (plan) => {
    return isYearly ? plan.priceYearly : plan.priceMonthly;
  };

  return (
    <div className="container plans-container">
      <button 
        onClick={() => navigate('/dashboard')}
        className="back-to-dashboard-btn"
      >
        <i className="fas fa-arrow-left"></i> Back to Dashboard
      </button>

      <h1 className="text-center">Choose Your Plan</h1>
      
      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      {/* Toggle Switch */}
      <div className="toggle-container">
        <span className={!isYearly ? "active-toggle" : ""}>Monthly</span>
        <label className="switch">
          <input type="checkbox" checked={isYearly} onChange={handleToggle} />
          <span className="slider round"></span>
        </label>
        <span className={isYearly ? "active-toggle" : ""}>Yearly</span>
      </div>

      {/* Plans in a single row */}
      <div className="row justify-content-center plans-row">
        {plans.map((plan) => (
          <div
            className={`col-md-3 plan-card ${
              activePlan === plan.id ? "active" : ""
            } ${plan.id === "advanced" ? "disabled" : ""}`}
            key={plan.id}
          >
            <div className="card-body">
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>

              <div className="price">
                <span className="amount">
                  ${calculatePrice(plan)} {isYearly ? "/ Year" : "/ Month"}
                </span>
                {isYearly && plan.id !== "free" && (
                  <span className="discount-badge">Save 20%</span>
                )}
              </div>

              {/* Features */}
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <i className="fas fa-check-circle"></i> {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${
                  activePlan === plan.id ? "btn-disabled" : 
                  plan.id === "advanced" ? "btn-secondary" : "btn-primary"
                }`}
                disabled={activePlan === plan.id || isLoading || plan.id === "advanced"}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isLoading && activePlan === plan.id ? (
                  "Processing..."
                ) : activePlan === plan.id ? (
                  "Current Plan"
                ) : plan.id === "advanced" ? (
                  "Coming Soon"
                ) : (
                  "Select Plan"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        planDetails={selectedPlan}
        onSubmit={handlePaymentSubmit}
        isLoading={isLoading}
      />

      {/* Payment Alert */}
      <PaymentAlert
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        details={alert.details}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        onConfirm={() => {
          alertActions.onConfirm?.();
          setAlert({ ...alert, isOpen: false });
        }}
      />
    </div>
  );
};

export default PlansPage;
