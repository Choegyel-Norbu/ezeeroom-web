import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { Separator } from "@/shared/components/separator";
import { 
  ChevronRight,
  ChevronUp
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Breadcrumb Component
const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link to="/" className="flex items-center hover:text-foreground transition-colors">
        Home
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link to={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

const TermsAndConditions = () => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    acceptance: true,
    services: false,
    userTerms: false,
    hotelOwnerTerms: false,
    subscription: false,
    cancellation: false,
    payments: false,
    liability: false,
    privacy: false,
    modifications: false,
    contact: false
  });

  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Handle hash navigation and expand sections
  const handleHashNavigation = () => {
    const hash = window.location.hash;
    
    if (hash) {
      // If there's a hash, scroll to the element after a short delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          // Ensure the section is expanded if it's collapsible before scrolling
          const sectionId = hash.replace('#', '');
          if (sectionId === 'cancellation-policy') {
            setExpandedSections(prev => {
              if (!prev.cancellation) {
                // Expand the section first, then scroll
                setTimeout(() => {
                  element.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }, 50);
                return { ...prev, cancellation: true };
              } else {
                // Section already expanded, just scroll
                element.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
                return prev;
              }
            });
          } else {
            // For other sections, just scroll
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }, 100);
    } else {
      // If no hash, scroll to top
      window.scrollTo(0, 0);
    }
  };

  // Scroll to top when component mounts and handle hash navigation
  useEffect(() => {
    handleHashNavigation();
  }, []);

  // Listen for hash changes (e.g., when navigating from footer)
  useEffect(() => {
    const handleHashChange = () => {
      handleHashNavigation();
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Listen to React Router location changes (handles same-page navigation)
  useEffect(() => {
    if (location.hash) {
      handleHashNavigation();
    }
  }, [location.hash]);

  // Handle scroll event to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Show button when scrolled more than 200px from the top
      setShowScrollToTop(scrollTop > 200);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const breadcrumbItems = [
    { label: "Terms and Conditions" }
  ];

  const SectionHeader = ({ title, isExpanded, onToggle, badge }) => (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-sm md:text-base font-semibold text-foreground">{title}</h2>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      {isExpanded ? (
        <span className="text-muted-foreground">−</span>
      ) : (
        <span className="text-muted-foreground">+</span>
      )}
    </div>
  );

  const SectionContent = ({ children, isExpanded }) => (
    <div className={`transition-all duration-300 ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">Terms and Conditions</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-4">
            Please read these terms carefully before using EzeeRoom services
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Last Updated: November 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Version 1.0</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          <Card className="shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle>
                Important Notice
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                By using EzeeRoom services, you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto">
                <div className="space-y-1">
                  {/* 1. Acceptance of Terms */}
                  <div className="border-b">
                    <SectionHeader
                      title="1. Acceptance of Terms"
                      isExpanded={expandedSections.acceptance}
                      onToggle={() => toggleSection('acceptance')}
                      badge="Required"
                    />
                    <SectionContent isExpanded={expandedSections.acceptance}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          These Terms and Conditions ("Terms") govern your use of EzeeRoom's online platform 
                          and services. By accessing or using our platform 
                          you acknowledge that you have read, understood, and agree to be bound by these Terms.
                        </p>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 2. Description of Services */}
                  <div className="border-b">
                    <SectionHeader
                      title="2. Description of Services"
                      isExpanded={expandedSections.services}
                      onToggle={() => toggleSection('services')}
                    />
                    <SectionContent isExpanded={expandedSections.services}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          EzeeRoom is an online platform that facilitates hotel bookings and accommodation 
                          services in Bhutan. Our services include:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Hotel search and comparison</li>
                          <li>Online booking and reservation management</li>
                          <li>Payment processing and confirmation</li>
                          <li>Customer support and assistance</li>
                        </ul>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> EzeeRoom acts as an intermediary between guests and hotels. 
                            We do not own or operate the hotels listed on our platform.
                          </p>
                        </div>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 3. User Terms and Conditions */}
                  <div className="border-b">
                    <SectionHeader
                      title="3. User Terms and Conditions"
                      isExpanded={expandedSections.userTerms}
                      onToggle={() => toggleSection('userTerms')}
                      badge="B2C"
                    />
                    <SectionContent isExpanded={expandedSections.userTerms}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-blue-800 dark:text-blue-200 font-medium">
                            <strong>Guest Terms:</strong> These terms apply to all users booking accommodations 
                            through EzeeRoom platform.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">3.1 Booking Process</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>All bookings are subject to availability and confirmation</li>
                          <li>You must provide accurate and complete information</li>
                          <li>Bookings are confirmed only after payment is processed</li>
                          <li>Upon successful booking, you will see a confirmation message after payment and can manage your booking from the dashboard</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">3.2 Age Requirements</h4>
                        <p>
                          You must be at least 18 years old to make a booking. Guests under 18 must be 
                          accompanied by a responsible adult.
                        </p>

                        <h4 className="font-semibold text-foreground">3.3 Guest Responsibilities</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Provide accurate personal and contact information</li>
                          <li>Arrive at the hotel on check-in date</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">3.4 Payment Terms</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Payment is required at the time of booking</li>
                          <li>Payment is done through RMA</li>
                          <li>Prices are displayed in Bhutanese Ngultrum (BTN)</li>
                          <li>Final charges include a 3% service tax on all bookings</li>
                          <li>Service tax is non-negotiable and non-refundable</li>
                          <li>No additional payment processing fees applied</li>
                        </ul>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 4. Hotel Owner Partnership Terms */}
                  <div className="border-b">
                    <SectionHeader
                      title="4. Hotel Owner Partnership Terms"
                      isExpanded={expandedSections.hotelOwnerTerms}
                      onToggle={() => toggleSection('hotelOwnerTerms')}
                      badge="B2B"
                    />
                    <SectionContent isExpanded={expandedSections.hotelOwnerTerms}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-green-800 dark:text-green-200 font-medium">
                            <strong>Partnership Agreement:</strong> These terms govern the relationship between 
                            EzeeRoom and hotel owners/property managers who list their properties on our platform.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">4.1 Partnership Requirements</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Valid business license</li>
                          <li>Valid property ownership or management authorization</li>
                          <li>Contact on working hours</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">4.2 Property Listing Requirements</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Accurate and up-to-date property information</li>
                          <li>Standard photos</li>
                          <li>Detailed room descriptions and amenities</li>
                          <li>Regular updates on property status and facilities</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">4.3 Booking Management</h4>
                        <div className="space-y-3">
                          <h5 className="font-medium text-foreground">Hotel Owner Responsibilities:</h5>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Maintain accurate availability calendar</li>
                            <li>Handle check-in/check-out procedures</li>
                            <li>Report any booking issues immediately</li>
                            <li><strong>Handle all cancellation requests directly</strong></li>
                          </ul>
                          
                          <h5 className="font-medium text-foreground">EzeeRoom Responsibilities:</h5>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Process payments securely</li>
                            <li>Provide booking confirmation to guests</li>
                            <li>Handle customer service inquiries</li>
                            <li>Provide analytics and booking reports</li>
                            <li>Facilitate communication between guests and hotels</li>
                          </ul>
                        </div>

                        <h4 className="font-semibold text-foreground">4.4 Intellectual Property</h4>
                        <p>
                          Hotel owners retain ownership of their property images and descriptions. 
                          EzeeRoom has the right to use this content for marketing and platform purposes. 
                          Both parties agree not to use each other's trademarks without permission.
                        </p>

                        <h4 className="font-semibold text-foreground">4.5 Data Protection and Privacy</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Guest data sharing only for booking purposes</li>
                          <li>Secure handling of payment information</li>
                          <li>Guest consent for data processing</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">4.6 Dispute Resolution</h4>
                        <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                          <p className="text-gray-800 dark:text-gray-200">
                            <strong>Mediation First:</strong> All disputes must first go through mediation. 
                            If mediation fails, disputes will be resolved through arbitration in Thimphu, Bhutan, 
                            under Bhutan Arbitration Law.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">4.7 Partnership Support</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Regular performance reviews and optimization</li>
                          <li>24/7 technical support for booking issues</li>
                        </ul>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 5. Subscription and Trial Requirements */}
                  <div className="border-b">
                    <SectionHeader
                      title="5. Subscription and Trial Requirements"
                      isExpanded={expandedSections.subscription}
                      onToggle={() => toggleSection('subscription')}
                      badge="Important"
                    />
                    <SectionContent isExpanded={expandedSections.subscription}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-orange-800 dark:text-orange-200 font-medium">
                            <strong>Mandatory Trial Activation:</strong> All hotel owners must start a trial subscription 
                            to activate their hotel listing and access platform features.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">5.1 Trial Period</h4>
                        <div className="space-y-3">
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Duration:</strong> Trial period lasts for 2 months from activation</li>
                            <li><strong>Activation Required:</strong> Hotel listing remains inactive until trial is started</li>
                            <li><strong>Full Access:</strong> During trial, hotel owners have access to all platform features</li>
                            <li><strong>No Payment Required:</strong> Trial period is completely free</li>
                          </ul>
                        </div>

                        <h4 className="font-semibold text-foreground">5.2 Post-Trial Restrictions</h4>
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                          <h5 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                            Feature Limitations After Trial
                          </h5>
                          <p className="text-red-700 dark:text-red-300 mb-2">
                            <strong>Important:</strong> Once the 2-month trial period ends, most platform features 
                            will be blocked until a paid subscription is activated.
                          </p>
                          <ul className="text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                            <li>Hotel listing becomes inactive and hidden from search results</li>
                            <li>No new bookings can be accepted</li>
                            <li>Booking management features are disabled</li>
                            <li>Analytics and reporting access is restricted</li>
                            <li>Payment processing is suspended</li>
                            <li>Customer support is limited to basic assistance</li>
                          </ul>
                        </div>

                        <h4 className="font-semibold text-foreground">5.3 Subscription Activation</h4>
                        <div className="space-y-3">
                          <p>
                            To continue using platform features after the trial period, hotel owners must:
                          </p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Pay for a subscription</li>
                            <li>Complete payment for the subscription</li>
                          </ul>
                        </div>

                        <h4 className="font-semibold text-foreground">5.4 Trial Extension Policy</h4>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-blue-800 dark:text-blue-200">
                            <strong>No Extensions:</strong> Trial periods cannot be extended beyond the initial 2-month period. 
                            Hotel owners must subscribe to a paid plan to continue using the platform after trial expiration.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">5.5 Data Retention</h4>
                        <p>
                          Hotel data and booking history will be retained for 30 days after trial expiration. 
                          After this period, data may be archived or deleted if no subscription is activated.
                        </p>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 6. Cancellation Policy */}
                  <div id="cancellation-policy" className="border-b">
                    <SectionHeader
                      title="6. Cancellation and Refund Policy"
                      isExpanded={expandedSections.cancellation}
                      onToggle={() => toggleSection('cancellation')}
                      badge="Important"
                    />
                    <SectionContent isExpanded={expandedSections.cancellation}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                            Important: EzeeRoom Does Not Handle Cancellations Directly
                          </h4>
                          <p className="text-red-700 dark:text-red-300">
                            <strong>All cancellation requests must be made directly with the hotel.</strong> 
                            EzeeRoom acts as a booking platform only and does not process cancellations or refunds.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">6.1 How to Cancel Your Booking</h4>
                        <div className="space-y-3">
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                              Step-by-Step Cancellation Process
                            </h5>
                            <ol className="text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
                              <li><strong>Apply for Cancellation from Dashboard:</strong> You can apply for cancellation directly from your user dashboard</li>
                              <li><strong>Contact the Hotel Directly:</strong> Use the contact information provided in user dashboard</li>
                              <li><strong>Follow Hotel's Policy:</strong> Each hotel has its own cancellation terms and conditions</li>
                            </ol>
                          </div>
                        </div>

                        <h4 className="font-semibold text-foreground">6.2 EzeeRoom's Role</h4>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-blue-800 dark:text-blue-200">
                            <strong>EzeeRoom's Limited Role:</strong> We facilitate communication between guests and hotels 
                            but do not process cancellations or refunds. We can help you find hotel contact information 
                            and provide general guidance, but all cancellation decisions are made by the hotel.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">6.3 What EzeeRoom Can Help With</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Providing hotel contact information</li>
                          <li>Helping you locate your booking confirmation</li>
                          <li>Facilitating communication with hotels</li>
                          <li>Technical support for platform issues</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">6.4 What EzeeRoom Cannot Do</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Process cancellations on behalf of hotels</li>
                          <li>Override hotel cancellation policies</li>
                          <li>Issue refunds directly</li>
                          <li>Guarantee specific refund amounts</li>
                          <li>Force hotels to accept cancellations</li>
                        </ul>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 7. Payment Terms */}
                  <div className="border-b">
                    <SectionHeader
                      title="7. Payment Terms and Conditions"
                      isExpanded={expandedSections.payments}
                      onToggle={() => toggleSection('payments')}
                    />
                    <SectionContent isExpanded={expandedSections.payments}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground">7.1 Payment Methods</h4>
                        <p>
                          We accept payments through local banks including BOB (Bank of Bhutan), BNB (Bhutan National Bank), 
                          BDBL (Bhutan Development Bank Limited), PNB, and DK. All payments are processed securely.
                        </p>

                        <h4 className="font-semibold text-foreground">7.2 Currency and Pricing</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Prices are displayed for each room in Bhutanese Ngultrum (BTN) respectively</li>
                          <li>Final charges include a mandatory 3% service tax on all bookings</li>
                          <li>Prices are subject to change without notice</li>
                        </ul>

                        <h4 className="font-semibold text-foreground">7.3 Payment Security</h4>
                        <p>
                          All payment information is encrypted and processed through secure payment gateway(RMA). 
                          We do not store your account details on our servers.
                        </p>

                        <h4 className="font-semibold text-foreground">7.4 Payment Issues</h4>
                        <p>
                          If payment fails, there will be no booking created for that selected date. Please ensure sufficient 
                          funds and correct payment information. Contact your bank if issues persist.
                        </p>

                        <h4 className="font-semibold text-foreground">7.5 Service Tax</h4>
                        <div className="space-y-3">
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-blue-800 dark:text-blue-200 font-medium">
                              <strong>Mandatory Service Tax:</strong> A service tax of 3% is automatically applied 
                              to every booking made through the EzeeRoom platform.
                            </p>
                          </div>

                          <p>
                            Service tax is a standard fee applied to all accommodation bookings to support platform 
                            operations, payment processing, customer support, and system maintenance.
                          </p>

                          <h5 className="font-medium text-foreground">7.5.1 Calculation and Application</h5>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Service tax is calculated at 3% of the booking total amount</li>
                            <li>The tax applies to all booking types including daily, standard and hourly</li>
                            <li>The final total amount shown includes the service tax</li>
                          </ul>

                          <h5 className="font-medium text-foreground">7.5.2 Payment Processing</h5>
                          <p>
                            The service tax is included in the total amount charged at the time of booking. 
                            You will see a clear breakdown showing:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Base room price</li>
                            <li>Service tax amount</li>
                            <li>Total transaction amount</li>
                          </ul>

                          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-amber-800 dark:text-amber-200">
                              <strong>Important:</strong> Service tax is non-refundable, even in cases where 
                              cancellations are processed through the hotel. The hotel's refund policy will 
                              apply to the base room price only.
                            </p>
                          </div>
                        </div>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 8. Limitation of Liability */}
                  <div className="border-b">
                    <SectionHeader
                      title="8. Limitation of Liability and Disclaimers"
                      isExpanded={expandedSections.liability}
                      onToggle={() => toggleSection('liability')}
                    />
                    <SectionContent isExpanded={expandedSections.liability}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground">8.1 Service Availability</h4>
                        <p>
                          EzeeRoom does not guarantee uninterrupted service availability. We reserve the 
                          right to modify, suspend, or discontinue services at any time.
                        </p>

                        <h4 className="font-semibold text-foreground">8.2 Third-Party Services</h4>
                        <p>
                          We are not responsible for the quality, safety, or availability of third-party 
                          services (hotels, etc.) booked through our platform.
                        </p>

                        <h4 className="font-semibold text-foreground">8.3 Limitation of Damages</h4>
                        <p>
                          To the maximum extent permitted by law, EzeeRoom's liability is limited to the 
                          amount paid for the specific booking in question.
                        </p>

                        <h4 className="font-semibold text-foreground">8.4 Force Majeure</h4>
                        <p>
                          We are not liable for delays or failures caused by circumstances beyond our 
                          control, including natural disasters, government actions, or technical failures.
                        </p>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 9. Privacy and Data Protection */}
                  <div className="border-b">
                    <SectionHeader
                      title="9. Privacy and Data Protection"
                      isExpanded={expandedSections.privacy}
                      onToggle={() => toggleSection('privacy')}
                    />
                    <SectionContent isExpanded={expandedSections.privacy}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Your privacy is important to us. Please review our 
                          <Link to="/privacy-policy" className="text-primary hover:underline ml-1 cursor-pointer">
                            Privacy Policy
                          </Link> for detailed information about how we collect, use, and protect your data.
                        </p>
                        
                        <h4 className="font-semibold text-foreground">9.1 Data Collection</h4>
                        <p>
                          We collect personal information necessary to process bookings and provide services. 
                          This includes contact information, payment details, and travel preferences.
                        </p>

                        <h4 className="font-semibold text-foreground">9.2 Data Sharing</h4>
                        <p>
                          We may share your information with hotels and service providers to fulfill 
                          your bookings. We do not sell your personal information to third parties.
                        </p>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 10. Modifications to Terms */}
                  <div className="border-b">
                    <SectionHeader
                      title="10. Modifications to Terms"
                      isExpanded={expandedSections.modifications}
                      onToggle={() => toggleSection('modifications')}
                    />
                    <SectionContent isExpanded={expandedSections.modifications}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          EzeeRoom reserves the right to modify these Terms at any time. Changes will be 
                          posted on this page with an updated "Last Modified" date.
                        </p>
                        
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-blue-800 dark:text-blue-200">
                            <strong>Important:</strong> Continued use of our services after changes 
                            constitutes acceptance of the modified Terms.
                          </p>
                        </div>

                        <h4 className="font-semibold text-foreground">10.1 Notification of Changes</h4>
                        <p>
                          We will notify users of significant changes through our platform.
                        </p>
                      </div>
                    </SectionContent>
                  </div>

                  {/* 11. Contact Information */}
                  <div>
                    <SectionHeader
                      title="11. Contact Information and Support"
                      isExpanded={expandedSections.contact}
                      onToggle={() => toggleSection('contact')}
                    />
                    <SectionContent isExpanded={expandedSections.contact}>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          If you have questions about these Terms or need assistance with your booking, 
                          please contact us:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-foreground">Email Support</p>
                              <p className="text-xs">choegyell@gmail.com, zepadorji222@gmail.com</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-foreground">Phone Support</p>
                              <p className="text-xs">+97577965452, +97577236000</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-green-800 dark:text-green-200">
                            <strong>Quick Support:</strong> For urgent booking issues, please call @+97517482648
                            . For general inquiries, email is preferred.
                          </p>
                        </div>
                      </div>
                    </SectionContent>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Footer */}
          <div className="mt-8 text-center">
            <Separator className="mb-4" />
            <p className="text-xs text-muted-foreground">
              These Terms and Conditions are governed by the laws of Bhutan. 
              Any disputes will be resolved as per the laws of Bhutan.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © 2025 EzeeRoom. All rights reserved. | Last Updated: November 1, 2025
            </p>
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-2 md:p-3 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TermsAndConditions;