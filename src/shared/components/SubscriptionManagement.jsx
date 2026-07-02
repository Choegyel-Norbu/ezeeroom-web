import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { Separator } from '@/shared/components/separator';
import { 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Download,
  Settings,
  Bell,
  History
} from 'lucide-react';
import { useSubscription } from '@/features/subscription/SubscriptionContext';
import { useAuth } from '@/features/authentication/AuthProvider';
import { formatDate } from '@/shared/utils/subscriptionUtils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SubscriptionManagement = () => {
  const { 
    subscription,
    paymentHistory,
    isLoading,
    error,
    subscriptionId,
    subscriptionPlan,
    subscriptionIsActive,
    subscriptionNextBillingDate,
    subscriptionPaymentStatus,
    fetchSubscriptionDetails,
    fetchPaymentHistory,
    initiatePayment,
    cancelSubscription,
    reactivateSubscription,
    getSubscriptionStatus,
    getDaysUntilExpiration,
    SUBSCRIPTION_PLANS,
    PAYMENT_STATUS
  } = useSubscription();

  const { userId, hotelId } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);

  // === LOAD DATA ON MOUNT ===
  useEffect(() => {
    if (userId) {
      fetchSubscriptionDetails(true);
      fetchPaymentHistory();
    }
  }, [userId, fetchSubscriptionDetails, fetchPaymentHistory]);

  // === GET SUBSCRIPTION STATUS INFO ===
  const getStatusInfo = () => {
    const status = getSubscriptionStatus();
    const daysUntilExpiration = getDaysUntilExpiration();
    
    switch (status) {
      case 'ACTIVE':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          badgeVariant: 'default',
          title: 'Active Subscription',
          description: `Your Pro subscription is active until ${formatDate(subscriptionNextBillingDate)}`,
          urgent: daysUntilExpiration <= 3
        };
      case 'TRIAL':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          badgeVariant: 'secondary',
          title: 'Trial Period',
          description: `Your trial expires on ${formatDate(subscriptionNextBillingDate)}`,
          urgent: daysUntilExpiration <= 7
        };
      case 'EXPIRED':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          badgeVariant: 'destructive',
          title: 'Subscription Expired',
          description: `Your subscription expired on ${formatDate(subscriptionNextBillingDate)}`,
          urgent: true
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          badgeVariant: 'outline',
          title: 'No Active Subscription',
          description: 'You don\'t have an active subscription',
          urgent: false
        };
    }
  };

  // === HANDLE PAYMENT INITIATION ===
  const handlePaymentInitiation = async () => {
    if (!userId || !hotelId) {
      toast.error('User ID and Hotel ID are required for payment');
      return;
    }

    setIsProcessing(true);
    
    try {
      const paymentData = {
        subscriptionPlan: 'PRO',
        amount: 999.00,
        notes: 'Monthly subscription payment'
      };

      const response = await initiatePayment(paymentData);

      if (response.success && response.payment?.orderNumber) {
        navigate('/payment', {
          state: {
            orderNumber: response.payment.orderNumber,
            amount: response.payment.amount,
            returnPath: '/hotelAdmin?refreshSubscription=1',
          },
        });
      }
    } catch (error) {
      
      // Error is already handled in the context
    } finally {
      setIsProcessing(false);
    }
  };

  // === HANDLE SUBSCRIPTION CANCELLATION ===
  const handleCancellation = async () => {
    if (!subscriptionId) {
      toast.error('Subscription ID not found');
      return;
    }

    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    
    try {
      await cancelSubscription(subscriptionId, 'User requested cancellation');
    } catch (error) {
      
      // Error is already handled in the context
    } finally {
      setIsProcessing(false);
    }
  };

  // === HANDLE SUBSCRIPTION REACTIVATION ===
  const handleReactivation = async () => {
    if (!subscriptionId) {
      toast.error('Subscription ID not found');
      return;
    }

    setIsProcessing(true);
    
    try {
      await reactivateSubscription(subscriptionId);
    } catch (error) {
      
      // Error is already handled in the context
    } finally {
      setIsProcessing(false);
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const currentPlan = SUBSCRIPTION_PLANS[subscriptionPlan];
  const daysUntilExpiration = getDaysUntilExpiration();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className={statusInfo.urgent ? 'ring-2 ring-orange-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
              <div>
                <CardTitle>{statusInfo.title}</CardTitle>
                <CardDescription>{statusInfo.description}</CardDescription>
              </div>
            </div>
            <Badge variant={statusInfo.badgeVariant}>
              {subscriptionPlan || 'No Plan'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className={`rounded-lg p-4 ${statusInfo.bgColor} mb-4`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Plan:</span>
                <p className="font-medium">{currentPlan?.name || 'No Plan'}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium">{subscriptionIsActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <span className="text-gray-600">Next Billing:</span>
                <p className="font-medium">
                  {subscriptionNextBillingDate ? formatDate(subscriptionNextBillingDate) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Days Remaining:</span>
                <p className="font-medium">
                  {daysUntilExpiration !== null ? `${daysUntilExpiration} days` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!subscriptionIsActive && subscriptionPlan && (
              <Button 
                onClick={handlePaymentInitiation}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Renew Subscription'}
              </Button>
            )}
            
            {subscriptionIsActive && subscriptionPlan === 'PRO' && (
              <Button 
                variant="outline"
                onClick={handleCancellation}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
            
            {!subscriptionIsActive && subscriptionId && (
              <Button 
                variant="outline"
                onClick={handleReactivation}
                disabled={isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reactivate
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => fetchSubscriptionDetails(true)}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Features */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Plan Features
            </CardTitle>
            <CardDescription>
              Features included in your {currentPlan.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentPlan.features
                .filter((feature) => (typeof feature === 'string' ? true : feature.included))
                .map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{typeof feature === 'string' ? feature : feature.label}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Your recent subscription payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory && paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Nu. {payment.amount}</p>
                      <p className="text-sm text-gray-600">
                        {payment.createdAt ? formatDate(payment.createdAt) : 'Date not available'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    payment.status === 'PAID' ? 'default' :
                    payment.status === 'PENDING' ? 'secondary' :
                    'destructive'
                  }>
                    {payment.status}
                  </Badge>
                </div>
              ))}
              
              {paymentHistory.length > 5 && (
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  View All Payments
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Urgent Notifications */}
      {statusInfo.urgent && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-orange-900">Action Required</p>
                <p className="text-sm text-orange-700">
                  {daysUntilExpiration <= 0 
                    ? 'Your subscription has expired. Renew now to continue using all features.'
                    : `Your subscription expires in ${daysUntilExpiration} days. Renew now to avoid service interruption.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default SubscriptionManagement;
