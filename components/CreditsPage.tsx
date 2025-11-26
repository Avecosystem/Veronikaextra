// components/CreditsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { CREDIT_PLANS, UPI_ID, UPI_QR_CODE_PATH } from '../constants';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';
import Input from './ui/Input';
import Loader from './ui/Loader';
import { backendApi } from '../services/backendApi';
import { ApiResponse, CreditPlan } from '../types';

const CreditsPage: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated, updateUserCredits } = useAuth(); // Added updateUserCredits
  const [availableCreditPlans, setAvailableCreditPlans] = useState<CreditPlan[]>([]); // New state for dynamic plans
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; credits: number; price: number; usdValue: number } | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [utrCode, setUtrCode] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [globalNotice, setGlobalNotice] = useState<string>(''); // Existing global notice (from LandingPage useEffect)
  const [creditsPageNotice, setCreditsPageNotice] = useState<string>(''); // New credits page specific notice
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [oxapayRedirecting, setOxapayRedirecting] = useState<boolean>(false);

  const isIndianUser = user?.country === 'India';
  const currencySymbol = isIndianUser ? '₹' : '$';
  const currencyCode = isIndianUser ? 'INR' : 'USD';

  // Fetch global and credits page notices
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const globalResponse: ApiResponse<string> = await backendApi.getGlobalNotice();
        if (globalResponse.success) {
          setGlobalNotice(globalResponse.data);
        } else {
          setNoticeError(globalResponse.message || 'Failed to fetch global notice.');
        }

        const creditsPageResponse: ApiResponse<string> = await backendApi.getCreditsPageNotice();
        if (creditsPageResponse.success) {
          setCreditsPageNotice(creditsPageResponse.data);
        } else {
          setNoticeError(creditsPageResponse.message || 'Failed to fetch credits page notice.');
        }
      } catch (err) {
        console.error('Error fetching notices for CreditsPage:', err);
        setNoticeError('An unexpected error occurred while fetching notices.');
      }
    };
    fetchNotices();
  }, []);

  // Fetch dynamic credit plans
  useEffect(() => {
    const fetchCreditPlans = async () => {
      try {
        const response: ApiResponse<CreditPlan[]> = await backendApi.getAvailableCreditPlans(); 
        if (response.success) {
          setAvailableCreditPlans(response.data);
        } else {
          console.error('Failed to fetch credit plans:', response.message);
          setAvailableCreditPlans(CREDIT_PLANS); // Fallback to constants if dynamic fetch fails, or show error
        }
      } catch (err) {
        console.error('Error fetching credit plans:', err);
        setAvailableCreditPlans(CREDIT_PLANS); // Fallback
      }
    };
    fetchCreditPlans();
  }, [isAuthenticated]); // Rerun if auth status changes


  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)]">
        <Loader message="Loading user data..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)]">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">Please log in to view and manage your credits.</p>
        </GlassCard>
      </div>
    );
  }

  const getPlanPrice = (plan: CreditPlan) => {
    return isIndianUser ? plan.inrPrice : plan.usdPrice;
  };

  const handlePlanSelect = (plan: CreditPlan) => {
    const price = getPlanPrice(plan);
    setSelectedPlan({
      id: plan.id, // Add ID to selected plan
      credits: plan.credits,
      price: price,
      usdValue: plan.usdPrice, // Store USD value for crypto payments
    });
    setAmountPaid(String(price)); // Pre-fill amount for UPI if applicable
    setUtrCode(''); // Clear UTR
    setNote(''); // Clear note
    setFormError(null);
    setFormSuccess(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedPlan) {
      setFormError('Please select a credit plan.');
      return;
    }
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      setFormError('Please enter a valid amount paid.');
      return;
    }
    if (!utrCode.trim()) {
      setFormError('Please enter the UTR Code.');
      return;
    }
    if (!paymentDate) {
      setFormError('Please select the date of payment.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setFormError('Authentication token not found.');
        setSubmittingPayment(false);
        return;
      }
      const response: ApiResponse<{ message: string }> = await backendApi.submitPaymentRequest(
        token,
        `${selectedPlan.credits} Credits`,
        selectedPlan.credits, // Pass explicit credits
        parseFloat(amountPaid),
        utrCode.trim(),
        paymentDate,
        note.trim()
      );

      if (response.success) {
        setFormSuccess(response.data.message);
        // Clear form fields after submission
        setSelectedPlan(null);
        setAmountPaid('');
        setUtrCode('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setNote('');
      } else {
        setFormError(response.message || 'Failed to submit payment request.');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setFormError('An unexpected error occurred while submitting payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!selectedPlan || !user) {
      setFormError('Please select a credit plan and ensure you are logged in.');
      return;
    }
    setFormError(null);
    setFormSuccess(null);
    setOxapayRedirecting(true);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setFormError('Authentication token not found.');
      setOxapayRedirecting(false);
      return;
    }

    const amountInUSD = selectedPlan.usdValue;
    const orderId = `${user.id}-${selectedPlan.credits}-${Date.now()}`;
    
    // Construct return URL ensuring hash consistency for React Router
    // This redirects to the Profile page where verification happens automatically
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const returnUrl = `${cleanBaseUrl}#/profile`;

    try {
      // Call backend API to create invoice and get payment URL
      const intentResponse = await backendApi.submitCryptoPaymentIntent(
        token,
        orderId,
        selectedPlan.credits,
        amountInUSD,
        returnUrl
      );

      if (!intentResponse.success) {
        setFormError(intentResponse.message || 'Failed to initiate crypto payment.');
        setOxapayRedirecting(false);
        return;
      }

      if (intentResponse.data && intentResponse.data.paymentUrl) {
          // Redirect to the generated invoice URL provided by the payment gateway API
          window.location.href = intentResponse.data.paymentUrl;
      } else {
          setFormError('Failed to generate payment link. Please try again.');
          setOxapayRedirecting(false);
      }

    } catch (err) {
      console.error('OXPAY payment initiation error:', err);
      setFormError('An unexpected error occurred while initiating crypto payment.');
      setOxapayRedirecting(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 min-h-[calc(100vh-160px)] animate-fade-in">
      {/* Global Notice Display (same as LandingPage) */}
      {globalNotice && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl mb-8"
        >
          <GlassCard className="p-4 text-center text-darkText dark:text-lightText bg-accent/20 border-accent/50">
            <p className="font-semibold text-lg">{globalNotice}</p>
          </GlassCard>
        </motion.div>
      )}

      {/* Credits Page Specific Notice Display */}
      {creditsPageNotice && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: globalNotice ? 0.2 : 0 }}
          className="w-full max-w-4xl mb-8"
        >
          <GlassCard className="p-4 text-center text-darkText dark:text-lightText bg-blue-500/20 border-blue-500/50">
            <p className="font-semibold text-lg">{creditsPageNotice}</p>
          </GlassCard>
        </motion.div>
      )}
      {noticeError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl mb-8"
        >
          <GlassCard className="p-4 text-center text-red-500 bg-red-500/10 border-red-500/50">
            <p className="font-semibold text-lg">Error: {noticeError}</p>
          </GlassCard>
        </motion.div>
      )}

      <GlassCard className="max-w-4xl w-full p-6 md:p-8 text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-darkText dark:text-lightText mb-4">
          Your Credits: {user.credits}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          Need more? Purchase credits to continue generating stunning AI images.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-darkText dark:text-lightText mb-6">
          Credit Plans
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {availableCreditPlans.length > 0 ? (
            availableCreditPlans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard
                  className={`p-6 flex flex-col items-center cursor-pointer transition-all duration-300 h-full
                              ${selectedPlan?.id === plan.id ? 'border-accent ring-2 ring-accent' : 'hover:border-accent/50'}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <p className="text-4xl font-extrabold text-accent mb-2">{plan.credits}</p>
                  <p className="text-xl font-semibold text-darkText dark:text-lightText mb-4">Credits</p>
                  <p className="text-3xl font-bold text-gray-500 dark:text-gray-400">{currencySymbol}{getPlanPrice(plan).toFixed(2)}</p>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full">
              <Loader message="Loading credit plans..." />
            </div>
          )}
        </div>

        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
        {formSuccess && <p className="text-green-500 text-sm mb-4">{formSuccess}</p>}
        {submittingPayment && !oxapayRedirecting && (
          <div className="mb-4">
            <Loader message="Processing payment..." />
          </div>
        )}
        {oxapayRedirecting && (
          <div className="mb-4">
            <Loader message="Redirecting to OXPAY..." />
          </div>
        )}

        {/* Payment Options */}
        <div className="flex flex-col gap-8 mt-10">
          {/* Purchase (INR) / Manual Payment Section - Only for Indian users */}
          {isIndianUser && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-darkText dark:text-lightText mb-6">
                Purchase (INR)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left items-start">
                <GlassCard className="p-6 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold text-darkText dark:text-lightText mb-4">Scan to Pay</h3>
                  <img src={UPI_QR_CODE_PATH} alt="UPI QR Code" className="w-48 h-48 mb-4 rounded-xl shadow-md border border-gray-700 dark:border-gray-300" />
                  <p className="text-lg text-gray-500 dark:text-gray-400 font-medium flex items-center">
                    UPI ID: <span className="text-darkText dark:text-lightText font-bold ml-2">{UPI_ID}</span>
                    <svg className="h-5 w-5 ml-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Payment"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  </p>
                  <div className="mt-6 text-sm text-center">
                      <p className="font-semibold text-darkText dark:text-lightText">Steps to Purchase Credits:</p>
                      <ol className="list-decimal list-inside text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                          <li>Select your desired Credit Plan above.</li>
                          <li>Scan the QR code or use the UPI ID to make the payment.</li>
                          <li>Note down the UTR (Unique Transaction Reference) code after payment.</li>
                          <li>Fill out the form below and submit your payment details.</li>
                          <li>Your credits will be added manually by an admin after verification.</li>
                      </ol>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-xl font-semibold text-darkText dark:text-lightText mb-4">Submit Payment Details</h3>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <Input
                      id="selected-plan"
                      label="Selected Plan"
                      value={selectedPlan ? `${selectedPlan.credits} Credits (${currencySymbol}${selectedPlan.price.toFixed(2)})` : ''}
                      readOnly
                      placeholder="Select a plan above"
                      className="cursor-not-allowed"
                    />
                    <Input
                      id="amount-paid"
                      label={`Amount Paid (${currencyCode})`}
                      type="number"
                      placeholder={`e.g., ${isIndianUser ? '199' : '2.50'}`}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      required
                      disabled={submittingPayment || oxapayRedirecting}
                    />
                    <Input
                      id="utr-code"
                      label="UTR Code (Transaction ID)"
                      type="text"
                      placeholder="Your 12-digit UTR code"
                      value={utrCode}
                      onChange={(e) => setUtrCode(e.target.value)}
                      required
                      disabled={submittingPayment || oxapayRedirecting}
                    />
                    <Input
                      id="payment-date"
                      label="Date of Payment"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      disabled={submittingPayment || oxapayRedirecting}
                    />
                    <Input
                      id="note"
                      label="Note (Optional)"
                      type="text"
                      placeholder="Any additional details"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={submittingPayment || oxapayRedirecting}
                    />
                    <Button type="submit" className="w-full justify-center" loading={submittingPayment || oxapayRedirecting}>
                      Submit Payment Request
                    </Button>
                  </form>
                </GlassCard>
              </div>
            </div>
          )}

          {/* Pay with Crypto Section - Always available */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-darkText dark:text-lightText mb-6">
              Pay with Crypto (OXPAY)
            </h2>
            <GlassCard className="p-6 text-center">
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
                Pay securely with various cryptocurrencies via OXPAY.
                You will be redirected to OXPAY to complete the payment in USD.
              </p>
              <Button
                variant="download" // Using download variant for distinct styling
                size="lg"
                onClick={handleCryptoPayment}
                disabled={!selectedPlan || submittingPayment || oxapayRedirecting}
                className="w-full max-w-sm mx-auto justify-center"
                loading={oxapayRedirecting}
              >
                Pay with Crypto {selectedPlan ? `($${selectedPlan.usdValue.toFixed(2)})` : ''}
              </Button>
              {!selectedPlan && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Please select a credit plan above to pay with crypto.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CreditsPage;