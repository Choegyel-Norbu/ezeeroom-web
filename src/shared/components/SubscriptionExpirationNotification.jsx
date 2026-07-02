import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/button';
import { Clock, CreditCard, AlertTriangle } from 'lucide-react';
import { calculateDaysUntil, formatDate, getTimeUntilExpiration } from '@/shared/utils/subscriptionUtils';

/**
 * Subscription Expiration Notification Component
 * Displays a warning when subscription is expiring soon.
 *
 * Design: neutral surface with a single restrained accent.
 * - "expiring tomorrow" (urgent) uses an amber accent
 * - "renewing within 7 days" (informational) uses a neutral accent
 * All other elements stay neutral to keep the banner calm and professional.
 */
const SubscriptionExpirationNotification = ({
  nextBillingDate,
  subscriptionPlan,
  subscriptionIsActive,
  className = ""
}) => {
  // Don't render if no billing date
  if (!nextBillingDate) return null;

  const daysUntilExpiration = calculateDaysUntil(nextBillingDate);
  const timeUntilExpiration = getTimeUntilExpiration(nextBillingDate);
  const formattedDate = formatDate(nextBillingDate);

  // Don't show notification if more than 7 days away, if already expired (daysUntilExpiration < 0),
  // or on the expiration date itself (daysUntilExpiration === 0) - subscription is expired on that date
  if (daysUntilExpiration > 7 || daysUntilExpiration <= 0) return null;

  const isTrial = subscriptionPlan === 'TRIAL';
  const isPro = subscriptionPlan === 'PRO' || subscriptionPlan === 'PREMIUM' || subscriptionPlan === 'BASIC';
  const isExpiringSoon = daysUntilExpiration === 1; // Expires tomorrow

  const getConfig = () => {
    if (isTrial) {
      return {
        title: isExpiringSoon ? "Trial Expires Tomorrow" : "Trial Expiring Soon",
        message: isExpiringSoon
          ? `Your trial period expires tomorrow (${formattedDate}). Subscribe now to continue enjoying all features and avoid service interruption.`
          : `Your trial period will expire on ${formattedDate} (${timeUntilExpiration}).`,
        buttonLabel: isExpiringSoon ? 'Subscribe Now' : 'Subscribe to Continue',
        showButton: isExpiringSoon,
      };
    }

    if (isPro) {
      const planLabel = subscriptionPlan === 'BASIC' ? 'Basic ' : subscriptionPlan === 'PREMIUM' ? 'Premium ' : '';
      return {
        title: "Upcoming Subscription Renewal",
        message: isExpiringSoon
          ? `Your ${planLabel}subscription will expire tomorrow (${formattedDate}). Please renew your subscription to continue using all features without interruption.`
          : `Your ${planLabel}subscription will renew on ${formattedDate} (${timeUntilExpiration}). Ensure your payment method is up to date.`,
        buttonLabel: isExpiringSoon ? 'Renew Now' : 'Manage Subscription',
        showButton: isExpiringSoon,
      };
    }

    return {
      title: isExpiringSoon ? "Subscription Expires Tomorrow" : "Upcoming Subscription Renewal",
      message: isExpiringSoon
        ? `Your subscription will renew tomorrow (${formattedDate}). Please ensure your payment method is up to date.`
        : `Your subscription will renew on ${formattedDate} (${timeUntilExpiration}).`,
      buttonLabel: isExpiringSoon ? 'Renew Now' : 'Manage Subscription',
      showButton: isExpiringSoon,
    };
  };

  const config = getConfig();
  const Icon = isExpiringSoon ? AlertTriangle : Clock;

  // Single restrained accent: amber when urgent, neutral otherwise.
  const accentBar = isExpiringSoon
    ? "border-l-amber-400 dark:border-l-amber-500"
    : "border-l-slate-300 dark:border-l-slate-600";
  const accentIcon = isExpiringSoon
    ? "text-amber-500 dark:text-amber-400"
    : "text-slate-400 dark:text-slate-500";

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-l-2 border-slate-200 dark:border-slate-800 ${accentBar} bg-white dark:bg-slate-900 px-4 py-4 shadow-sm ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${accentIcon}`} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {config.title}
        </h4>
        <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${config.showButton ? 'mt-1 mb-3' : 'mt-1'}`}>
          {config.message}
        </p>
        {config.showButton && (
          <Link to="/subscription">
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {config.buttonLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default SubscriptionExpirationNotification;
