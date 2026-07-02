import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Separator } from '@/shared/components/separator';
import { ArrowLeft, Shield, ChevronRight, ChevronUp } from 'lucide-react';

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

const PrivacyPolicy = () => {
  const lastUpdated = "November 1, 2025";
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Ensure page scrolls to top when component mounts
  useEffect(() => {
    // Clear any hash fragments that might cause scrolling
    if (window.location.hash) {
      window.location.hash = '';
    }
    
    // Scroll to top with a slight delay to ensure page is fully rendered
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Additional scroll after a short delay to ensure it works
    const timeoutId = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

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

  // Table of Contents items
  const tocItems = [
    { id: 'information-we-collect', title: 'Information We Collect' },
    { id: 'how-we-use-information', title: 'How We Use Your Information' },
    { id: 'information-sharing', title: 'Information Sharing' },
    { id: 'data-security', title: 'Data Security' },
    { id: 'your-rights', title: 'Your Rights' },
    { id: 'third-party', title: 'Third-Party Services' },
    { id: 'changes', title: 'Changes to This Policy' },
    { id: 'contact', title: 'Contact Us' }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const breadcrumbItems = [
    { label: "Privacy Policy" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-foreground">Privacy & Security Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Main Content */}
        <div className="pb-16">
        <Card className="my-8 p-6 md:p-8">
          {/* Introduction */}
          <div className="space-y-6">
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                At EzeeRoom, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy & Security Policy explains how we collect, use, and safeguard your data when you use our hotel 
                booking platform.
              </p>
            </div>

            <Separator />

            {/* Table of Contents */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Table of Contents</h2>
              <nav className="space-y-1">
                {tocItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors py-0.5 cursor-pointer"
                  >
                    {index + 1}. {item.title}
                  </button>
                ))}
              </nav>
            </div>

            <Separator />

            {/* Section 1: Information We Collect */}
            <section id="information-we-collect" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">1. Information We Collect</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">We collect information you provide directly to us, including:</p>
                
                <div className="ml-4 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Account Information:</strong> Name and email address when you create an account</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Booking Information:</strong> Guest details, check-in/check-out dates, room preferences, cid, phone number, origin and destination</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Communication Data:</strong> Reviews and feedback you provide</span>
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 2: How We Use Your Information */}
            <section id="how-we-use-information" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">2. How We Use Your Information</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">We use the collected information to:</p>
                
                <div className="ml-4 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Process your hotel bookings</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Provide customer support and respond to inquiries</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Process payments and prevent fraud</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Comply with legal obligations and enforce our terms</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Improve our services through analytics and feedback</span>
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 3: Information Sharing */}
            <section id="information-sharing" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">3. Information Sharing</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">We share your information only in the following circumstances:</p>
                
                <div className="ml-4 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>With Hotels:</strong> We share necessary booking details with your selected hotel to fulfill your reservation</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Service Providers:</strong> With trusted third parties who help us operate our platform (payment processors(RMA))</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>With Your Consent:</strong> When you explicitly agree to specific sharing</span>
                  </p>
                </div>

                <p className="mt-3 text-sm font-medium">We never sell your personal information to third parties.</p>
              </div>
            </section>

            <Separator />

            {/* Section 4: Data Security */}
            <section id="data-security" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">4. Data Security</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">We implement industry-standard security measures to protect your information:</p>
                
                <div className="ml-4 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>SSL/TLS encryption for all data transmissions</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Secure servers with regular security audits</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>PCI DSS compliance for payment processing</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Access controls and authentication mechanisms</span>
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 5: Your Rights */}
            <section id="your-rights" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">5. Your Rights</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">You have the following rights regarding your personal information:</p>
                
                <div className="ml-4 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Account Management:</strong> Update your profile information and account settings through your dashboard</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Data Correction:</strong> Contact us to correct any inaccurate personal information</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Account Deletion:</strong> Request complete deletion of your account and associated data</span>
                  </p>
                </div>

                <p className="mt-3 text-sm">
                  To exercise these rights or for any privacy-related concerns, please contact us at choegyell@gmail.com. 
                  We will respond to your request within 12-24 hours.
                </p>
              </div>
            </section>

            <Separator />


            <Separator />

            {/* Section 6: Third-Party Services */}
            <section id="third-party" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">6. Third-Party Services</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">
                  Our platform may contain links to third-party websites or integrate with third-party services. 
                  We are not responsible for the privacy practices of these third parties. We encourage you to 
                  review their privacy policies before providing any personal information.
                </p>

                <p className="text-sm">Key third-party services we use include:</p>
                
                <div className="ml-4 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Payment processors for secure transactions</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Google Maps service for navigation and location features</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Social media platforms (Facebook, TikTok, Instagram) for marketing and user engagement</span>
                  </p>
                </div>
              </div>
            </section>

            <Separator />


            {/* Section 7: Changes to This Policy */}
            <section id="changes" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">7. Changes to This Policy</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">
                  We may update this Privacy & Security Policy from time to time to reflect changes in our practices 
                  or legal requirements. We will notify you of any material changes by posting the new policy on this 
                  page and updating the "Last updated" date.
                </p>

                <p className="text-sm">
                  We encourage you to review this policy periodically to stay informed about how we protect your 
                  information.
                </p>
              </div>
            </section>

            <Separator />

            {/* Section 8: Contact Us */}
            <section id="contact" className="space-y-3">
              <h2 className="text-lg font-heading font-semibold">8. Contact Us</h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">
                  If you have any questions, concerns, or requests regarding this Privacy & Security Policy or our 
                  data practices, please contact us:
                </p>

                <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                  <p className="text-sm"><strong>Email:</strong> choegyell@gmail.com, zepadorji222@gmail.com</p>
                  <p className="text-sm"><strong>Phone:</strong> +97577965452, +97577236000</p>
                  <p className="text-sm"><strong>Address:</strong> EzeeRoom Pvt, Thimphu, Bhutan</p>
                </div>

                <p className="text-sm">
                  Our team will respond to your inquiry within 12-24 hours.
                </p>
              </div>
            </section>
          </div>
        </Card>
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

export default PrivacyPolicy;
