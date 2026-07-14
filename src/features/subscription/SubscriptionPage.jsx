import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/button';
import { Check, Minus, ArrowLeft, ArrowRight, CreditCard, Sparkles, Building2, Users, EyeOff, ShieldCheck, XCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/ios-spinner';
import api from '@/shared/services/Api';
import { useAuth } from '@/features/authentication/AuthProvider';
import { toast } from 'sonner';
import { calculateDaysUntil, formatDate } from '@/shared/utils/subscriptionUtils';
import { getStorageItem } from '@/shared/utils/safariLocalStorage';
import { SUBSCRIPTION_PLANS } from './SubscriptionContext';

// Plans shown in the comparison, in display order (Basic first, Pro highlighted)
const TIER_ORDER = ['BASIC', 'PRO'];

const SubscriptionPage = () => {
  const {
    userId,
    hotelId,
    selectedHotelId,
    subscriptionIsActive,
    subscriptionPlan,
    subscriptionNextBillingDate,
    subscriptionExpirationNotification,
    updateSubscriptionCache,
    fetchSubscriptionData,
  } = useAuth();
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  const openNvpPayment = (payment) => {
    if (!payment?.orderNumber) {
      toast.error('Payment could not be started. Please try again.');
      return;
    }
    navigate('/payment', {
      state: {
        orderNumber: payment.orderNumber,
        amount: payment.amount,
        returnPath: '/hotelAdmin?refreshSubscription=1',
      },
    });
  };

  const getHotelIdFromStorage = () => {
    try {
      const newHotelId = sessionStorage.getItem('newHotelId');
      if (newHotelId) {
        const parsedId = parseInt(newHotelId);
        if (!isNaN(parsedId)) {
          sessionStorage.removeItem('newHotelId');
          return parsedId;
        }
      }
      const storedSelectedHotelId = getStorageItem('selectedHotelId');
      const storedHotelIds = getStorageItem('hotelIds');
      const storedHotelId = getStorageItem('hotelId');

      let hotelIdsArray = [];
      if (storedHotelIds) {
        if (Array.isArray(storedHotelIds)) {
          hotelIdsArray = storedHotelIds;
        } else if (typeof storedHotelIds === 'string' && storedHotelIds.trim() !== '') {
          try {
            hotelIdsArray = JSON.parse(storedHotelIds);
            if (!Array.isArray(hotelIdsArray)) hotelIdsArray = [storedHotelIds];
          } catch (e) {
            hotelIdsArray = [storedHotelIds];
          }
        } else if (typeof storedHotelIds === 'number' || typeof storedHotelIds === 'string') {
          hotelIdsArray = [storedHotelIds.toString()];
        }
      }

      if (hotelIdsArray.length > 1) {
        if (storedSelectedHotelId) return parseInt(storedSelectedHotelId);
      }
      if (storedSelectedHotelId) return parseInt(storedSelectedHotelId);
      if (storedHotelId) return parseInt(storedHotelId);
      return parseInt(selectedHotelId || hotelId);
    } catch (error) {
      return parseInt(selectedHotelId || hotelId);
    }
  };

  useEffect(() => {
    const refreshSubscriptionData = async () => {
      if (userId && fetchSubscriptionData) {
        const hotelIdToUse = getHotelIdFromStorage();
        if (hotelIdToUse) {
          try {
            await fetchSubscriptionData(userId, true, hotelIdToUse);
          } catch (error) {
            // silent
          }
        }
      }
    };
    refreshSubscriptionData();
  }, [userId, selectedHotelId, fetchSubscriptionData]);

  // === Subscription state flags ===
  const isTrialActive = subscriptionIsActive === true && subscriptionPlan === 'TRIAL';
  const isTrialExpired =
    subscriptionIsActive === false && (subscriptionPlan === 'TRIAL' || !subscriptionPlan);
  const isPaidActive =
    subscriptionIsActive === true && (subscriptionPlan === 'PRO' || subscriptionPlan === 'BASIC');
  const isNoSubscription = !subscriptionIsActive && !subscriptionPlan;
  const isPaidExpired =
    subscriptionIsActive === false && (subscriptionPlan === 'PRO' || subscriptionPlan === 'BASIC');

  const daysUntilExpiration = calculateDaysUntil(subscriptionNextBillingDate);
  const expiresTomorrow = daysUntilExpiration === 1 && subscriptionExpirationNotification;

  // === Start the free trial (1 month) ===
  const handleStartTrial = async () => {
    if (!userId) {
      toast.error('User ID not found. Please ensure you are logged in.');
      return;
    }
    setIsSubscribing(true);
    setPendingPlan('TRIAL');

    try {
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + 1);

      const hotelIdFromStorage = getHotelIdFromStorage();
      if (!hotelIdFromStorage) {
        toast.error('Hotel ID not found. Please ensure you have selected a hotel.');
        return;
      }

      const subscriptionData = {
        userId: parseInt(userId),
        hotelId: hotelIdFromStorage,
        subscriptionPlan: 'TRIAL',
        paymentStatus: 'PENDING',
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        nextBillingDate: trialEndDate.toISOString(),
        cancelDate: null,
        lastPaymentDate: null,
        notes: 'Initial subscription setup for new user',
      };

      const response = await api.post('/subscriptions', subscriptionData);

      if (response.status === 200 || response.status === 201) {
        toast.success('Free trial started successfully! Welcome to EzeeRoom.');
        updateSubscriptionCache({
          id: response.data.id,
          subscriptionId: response.data.id,
          paymentStatus: response.data.paymentStatus,
          subscriptionPlan: response.data.subscriptionPlan,
          isActive: true,
          nextBillingDate: response.data.nextBillingDate,
          expirationNotification: false,
        });
        setTimeout(() => {
          navigate('/hotelAdmin?refreshSubscription=1', { replace: true });
        }, 1000);
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('You already have an active subscription. Please check your account status.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid subscription data. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to start free trial. Please try again later.');
      }
    } finally {
      setIsSubscribing(false);
      setPendingPlan(null);
    }
  };

  // === Subscribe to / renew / switch to a paid plan (BASIC or PRO) ===
  const handlePaidSubscribe = async (planId) => {
    if (!userId) {
      toast.error('User ID not found. Please ensure you are logged in.');
      return;
    }
    setIsSubscribing(true);
    setPendingPlan(planId);

    try {
      const hotelIdFromStorage = getHotelIdFromStorage();
      if (!hotelIdFromStorage) {
        toast.error('Hotel ID not found. Please ensure you have selected a hotel.');
        return;
      }

      const subscriptionData = {
        subscriptionPlan: planId,
        userId: parseInt(userId),
        hotelId: hotelIdFromStorage,
      };

      const response = await api.post('/subscriptions/payment/initiate', subscriptionData, {
        params: { baseUrl: window.location.origin },
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data;
        if (responseData.success && responseData.payment?.orderNumber) {
          openNvpPayment(responseData.payment);
        } else {
          throw new Error('Invalid payment response: missing order number');
        }
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Subscription not found. Please contact support.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid subscription data. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to initiate subscription payment. Please try again later.');
      }
    } finally {
      setIsSubscribing(false);
      setPendingPlan(null);
    }
  };

  // === Resolve the CTA for a given plan card ===
  const getCardAction = (planId) => {
    if (isPaidExpired) {
      const isSamePlan = subscriptionPlan === planId;
      return {
        label: isSamePlan ? `Renew ${SUBSCRIPTION_PLANS[planId].name}` : `Switch to ${SUBSCRIPTION_PLANS[planId].name}`,
        disabled: false,
        onClick: () => handlePaidSubscribe(planId),
      };
    }
    if (isPaidActive && subscriptionPlan === planId) {
      if (expiresTomorrow) {
        return { label: `Renew ${SUBSCRIPTION_PLANS[planId].name}`, disabled: false, onClick: () => handlePaidSubscribe(planId) };
      }
      return { label: 'Current Plan', disabled: true, onClick: () => {} };
    }
    if (isPaidActive && subscriptionPlan !== planId) {
      return { label: `Switch to ${SUBSCRIPTION_PLANS[planId].name}`, disabled: false, onClick: () => handlePaidSubscribe(planId) };
    }
    return { label: `Subscribe to ${SUBSCRIPTION_PLANS[planId].name}`, disabled: false, onClick: () => handlePaidSubscribe(planId) };
  };

  // === Page header — contextual to subscription state ===
  const renderHeader = () => {
    if (isNoSubscription) {
      return (
        <div className="mb-8 text-center">
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-950 mb-2" style={{ textWrap: 'balance' }}>
            Start your hotel business on EzeeRoom
          </h1>
          <p className="text-[14px] text-neutral-500 max-w-md mx-auto leading-relaxed">
            Begin with a free 1-month trial — no credit card needed. Choose a plan anytime.
          </p>
        </div>
      );
    }

    let dotColor, chipText, headingText, subtitleText;

    if (expiresTomorrow) {
      dotColor = 'bg-amber-500';
      chipText = 'Expires tomorrow';
      headingText = 'Your subscription expires tomorrow';
      subtitleText = `Renew before ${formatDate(subscriptionNextBillingDate)} to keep your hotel listing active.`;
    } else if (isTrialExpired) {
      dotColor = 'bg-red-500';
      chipText = 'Trial expired';
      headingText = 'Your free trial has ended';
      subtitleText = 'Choose a plan below to continue managing your hotel.';
    } else if (isTrialActive) {
      dotColor = 'bg-green-500';
      chipText = `Trial active${daysUntilExpiration != null && daysUntilExpiration >= 0 ? ` · ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'} left` : ''}`;
      headingText = 'Your free trial is active';
      subtitleText = 'Subscribe anytime to lock in continued access.';
    } else if (isPaidActive) {
      dotColor = 'bg-green-500';
      chipText = `${SUBSCRIPTION_PLANS[subscriptionPlan]?.name || 'Plan'} active`;
      headingText = 'Your subscription is active';
      subtitleText = 'Your hotel is live and discoverable to guests. Manage or upgrade below.';
    } else if (isPaidExpired) {
      dotColor = 'bg-red-500';
      chipText = 'Subscription expired';
      headingText = 'Your subscription has expired';
      subtitleText = 'Renew your plan to bring your hotel back online instantly.';
    } else {
      dotColor = 'bg-neutral-400';
      chipText = 'Subscription';
      headingText = 'Manage your subscription';
      subtitleText = 'Choose the plan that fits your hotel best.';
    }

    return (
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 bg-neutral-100 rounded-full px-3 py-1 mb-4">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-[11px] font-medium text-neutral-600">{chipText}</span>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight text-neutral-950 mb-2">{headingText}</h1>
        <p className="text-[14px] text-neutral-500 max-w-md mx-auto leading-relaxed">{subtitleText}</p>
      </div>
    );
  };

  // === Pricing tier card ===
  const TierCard = ({ planId, previewOnly = false }) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    const isPro = planId === 'PRO';
    const isCurrent = isPaidActive && subscriptionPlan === planId;
    const action = getCardAction(planId);
    const cardLoading = isSubscribing && pendingPlan === planId;

    return (
      <div
        className={`flex flex-col bg-white rounded-lg overflow-hidden ${
          isPro
            ? 'border-l border-r border-b border-neutral-200 border-t-2 border-t-neutral-950'
            : 'border border-neutral-200'
        } ${isCurrent ? 'ring-1 ring-neutral-950 ring-offset-0' : ''}`}
      >
        {/* Card body */}
        <div className="p-7 flex-1 flex flex-col gap-5">

          {/* Plan label row */}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-widest uppercase ${isPro ? 'text-neutral-950' : 'text-neutral-500'}`}>
              {plan.name}
            </span>
            {isCurrent ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 rounded px-2 py-0.5">
                <Check className="h-[10px] w-[10px]" strokeWidth={3} /> Current
              </span>
            ) : isPro && !previewOnly ? (
              <span className="text-[10px] font-semibold text-neutral-950 border border-neutral-200 rounded px-1.5 py-0.5 tracking-wide uppercase">
                Popular
              </span>
            ) : null}
          </div>

          {/* Price */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-bold tracking-tighter text-neutral-950 tabular-nums leading-none">
                {plan.currency}&nbsp;{plan.price.toLocaleString()}
              </span>
              <span className="text-[13px] text-neutral-500 font-medium">/ month</span>
            </div>
            {plan.annualPrice && (
              <p className="mt-1.5 text-[12px] text-neutral-400">
                {plan.currency} {plan.annualPrice.toLocaleString()} / year · 2 months free
              </p>
            )}
          </div>

          {/* Capacity chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-[11px] font-medium px-2 py-1 rounded">
              <Building2 className="h-3 w-3" />
              Unlimited rooms
            </span>
            <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-[11px] font-medium px-2 py-1 rounded">
              <Users className="h-3 w-3" />
              {isPro ? 'Unlimited staff' : '2 staff max'}
            </span>
            {isPro && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-[11px] font-medium px-2 py-1 rounded">
                <Building2 className="h-3 w-3" />
                Unlimited hotels
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-100" />

          {/* Feature list */}
          <ul className="flex flex-col gap-2.5 flex-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2.5">
                {feature.included ? (
                  <Check className="h-[13px] w-[13px] flex-shrink-0 text-neutral-950 mt-px" strokeWidth={2.5} />
                ) : (
                  <Minus className="h-[13px] w-[13px] flex-shrink-0 text-neutral-300 mt-px" />
                )}
                <span className={`text-[13px] leading-snug ${feature.included ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA footer */}
        <div className="px-7 pb-7">
          {previewOnly ? (
            <div className="w-full h-9 flex items-center justify-center border border-neutral-200 rounded-md text-[13px] text-neutral-400 font-medium">
              Available after trial
            </div>
          ) : (
            <button
              onClick={action.onClick}
              disabled={action.disabled || isSubscribing}
              className={`w-full h-9 rounded-md text-[13px] font-medium tracking-tight flex items-center justify-center gap-1.5 transition-opacity ${
                action.disabled
                  ? 'bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                  : 'bg-neutral-950 text-white border border-neutral-950 hover:opacity-85'
              }`}
            >
              {cardLoading ? (
                <><Spinner size="sm" /> Processing...</>
              ) : (
                <>
                  {!action.disabled && <CreditCard className="h-[13px] w-[13px]" />}
                  {action.label}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Back nav */}
        {!isNoSubscription && (
          <div className="mb-8">
            <button
              onClick={() => navigate('/hotelAdmin?refreshSubscription=1')}
              className="flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="h-[13px] w-[13px]" />
              Back to Dashboard
            </button>
          </div>
        )}

        {renderHeader()}

        {/* Expired paid subscription warning */}
        {isPaidExpired && (
          <div className="mb-7 rounded-lg overflow-hidden border border-red-100">
            <div className="h-1 bg-red-500" />
            <div className="bg-red-50 px-6 py-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-full bg-white border border-red-100 flex items-center justify-center shadow-sm">
                    <EyeOff className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Action Required</p>
                  <h3 className="text-[15px] font-semibold text-neutral-950 mb-1.5">
                    Your hotel is no longer visible to guests
                  </h3>
                  <p className="text-[13px] text-neutral-500 leading-relaxed mb-4">
                    Your {subscriptionPlan === 'BASIC' ? 'Basic' : 'Pro'} plan has lapsed. Guests searching for accommodation
                    won't see your property in any listings — and no new bookings can be made until you renew.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-white border border-red-100 rounded px-2.5 py-1">
                      <EyeOff className="h-3 w-3" />
                      Hidden from search
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-white border border-red-100 rounded px-2.5 py-1">
                      <XCircle className="h-3 w-3" />
                      New bookings paused
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 bg-white border border-neutral-200 rounded px-2.5 py-1">
                      <ShieldCheck className="h-3 w-3" />
                      All your data is safe
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial expired warning */}
        {isTrialExpired && (
          <div className="mb-7 rounded-lg overflow-hidden border border-amber-100">
            <div className="h-1 bg-amber-500" />
            <div className="bg-amber-50 px-6 py-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-full bg-white border border-amber-100 flex items-center justify-center shadow-sm">
                    <EyeOff className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Trial Ended</p>
                  <h3 className="text-[15px] font-semibold text-neutral-950 mb-1.5">
                    Your hotel is no longer visible to guests
                  </h3>
                  <p className="text-[13px] text-neutral-500 leading-relaxed mb-4">
                    Your free trial has ended and your property has been removed from guest-facing listings.
                    Subscribe to a plan below to bring your hotel back online instantly.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-white border border-amber-100 rounded px-2.5 py-1">
                      <EyeOff className="h-3 w-3" />
                      Hidden from search
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-white border border-amber-100 rounded px-2.5 py-1">
                      <XCircle className="h-3 w-3" />
                      New bookings paused
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 bg-white border border-neutral-200 rounded px-2.5 py-1">
                      <ShieldCheck className="h-3 w-3" />
                      All your data is safe
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial CTA panel — only when no subscription exists */}
        {isNoSubscription && (
          <div className="border border-neutral-200 bg-white rounded-lg p-6 mb-7">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 bg-neutral-100 rounded px-2 py-0.5 mb-3">
                  <Sparkles className="h-[10px] w-[10px] text-neutral-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-600">Free Trial</span>
                </div>
                <h2 className="text-[16px] font-semibold tracking-tight text-neutral-950 mb-2">
                  1 month free — no credit card needed
                </h2>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {['Full platform access', 'All analytics & reports', 'Cancel anytime'].map((item) => (
                    <span key={item} className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                      <Check className="h-3 w-3 text-neutral-950" strokeWidth={2.5} />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStartTrial}
                disabled={isSubscribing}
                className="sm:flex-shrink-0 flex items-center justify-center gap-1.5 h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium tracking-tight hover:opacity-85 transition-opacity disabled:opacity-50"
              >
                {isSubscribing && pendingPlan === 'TRIAL' ? (
                  <><Spinner size="sm" /> Starting...</>
                ) : (
                  <>Get started free <ArrowRight className="h-[13px] w-[13px]" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Section label — no-subscription state only */}
        {isNoSubscription && (
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-neutral-400 mb-0.5">
              Then choose your plan
            </p>
            <p className="text-[13px] text-neutral-500">After your trial, pick what fits your hotel best.</p>
          </div>
        )}

        {/* Plan comparison grid — always visible */}
        <div className="grid items-stretch gap-4 sm:grid-cols-2">
          {TIER_ORDER.map((planId) => (
            <TierCard key={planId} planId={planId} previewOnly={isNoSubscription} />
          ))}
        </div>

        {/* Trial users can continue without paying */}
        {isTrialActive && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/hotelAdmin?refreshSubscription=1')}
              className="text-[13px] text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Continue with free trial →
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubscriptionPage;
