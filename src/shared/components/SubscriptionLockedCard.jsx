import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Lock, CreditCard } from 'lucide-react';

/**
 * Empty-state card shown in place of a feature that is locked because the
 * hotel's subscription has expired.
 *
 * Neutral surface with a single restrained red accent on the icon — kept
 * consistent with the dashboard expiration banners.
 */
// upgradeRequired=true → Pro-upgrade variant (blue); false → expired variant (red/slate)
const SubscriptionLockedCard = ({ title, message, upgradeRequired = false }) => {
  return (
    <Card
      className={`bg-white dark:bg-slate-900 ${
        upgradeRequired
          ? 'border-blue-100 dark:border-blue-900'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              upgradeRequired
                ? 'bg-blue-50 dark:bg-blue-950'
                : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Lock
              className={`h-6 w-6 ${
                upgradeRequired
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-red-500 dark:text-red-400'
              }`}
            />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {upgradeRequired
                ? `This feature is available on the Pro plan. ${message}`
                : `This feature is not available with an expired subscription. ${message}`}
            </p>
            <Link to="/subscription">
              <Button
                className={
                  upgradeRequired
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {upgradeRequired ? 'Upgrade to Pro' : 'Renew Subscription'}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionLockedCard;
